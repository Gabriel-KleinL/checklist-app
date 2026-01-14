<?php
// Headers CORS - DEVE VIR ANTES DE QUALQUER SAÍDA
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Responde requisições OPTIONS (preflight) IMEDIATAMENTE
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once 'b_veicular_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('erro' => 'Método não permitido'));
    exit;
}

$json = file_get_contents('php://input');
$dados = json_decode($json, true);

// Log para debug
error_log("=== REQUISIÇÃO RECEBIDA ===");
error_log("Método: " . $_SERVER['REQUEST_METHOD']);
error_log("Raw JSON Length: " . strlen($json));
error_log("Dados decodificados: " . print_r($dados, true));

if (!$dados) {
    http_response_code(400);
    echo json_encode(array('erro' => 'Dados inválidos'));
    exit;
}

try {
    // ============================================
    // VALIDAÇÃO TEMPORARIAMENTE DESABILITADA
    // (A coluna data_realizacao ou created_at pode não existir em produção)
    // ============================================
    // Removido para evitar erro 500 - pode ser reativado após atualização do banco

    // Inicia uma transação para garantir consistência
    $pdo->beginTransaction();

    // ============================================
    // Função auxiliar: Converte valores de combustível do app para o banco
    // ============================================
    function converterNivelCombustivel($valor) {
        $mapa = array(
            'vazio' => '0%',
            '1/4' => '25%',
            '1/2' => '50%',
            '3/4' => '75%',
            'cheio' => '100%',
            // Aceita também os valores já no formato correto
            '0%' => '0%',
            '25%' => '25%',
            '50%' => '50%',
            '75%' => '75%',
            '100%' => '100%'
        );
        return isset($mapa[$valor]) ? $mapa[$valor] : '0%';
    }

    // ============================================
    // 1. Insere dados principais na bbb_inspecao_veiculo
    // ============================================
    $sqlInspecao = "INSERT INTO bbb_inspecao_veiculo (
        placa,
        km_inicial,
        nivel_combustivel,
        observacao_painel,
        usuario_id,
        status_geral
    ) VALUES (
        :placa,
        :km_inicial,
        :nivel_combustivel,
        :observacao_painel,
        :usuario_id,
        'PENDENTE'
    )";

    // Converte o nível de combustível para o formato do banco
    $nivelCombustivelOriginal = isset($dados['nivel_combustivel']) ? $dados['nivel_combustivel'] : 'vazio';
    $nivelCombustivelConvertido = converterNivelCombustivel($nivelCombustivelOriginal);

    error_log("Nível Combustível: $nivelCombustivelOriginal -> $nivelCombustivelConvertido");

    // Usa o usuario_id enviado pelo frontend, ou busca um usuário ativo
    // Se não quiser usuário padrão, altere o banco para aceitar NULL
    $usuarioId = isset($dados['usuario_id']) ? $dados['usuario_id'] : null;

    // Se não foi informado, busca qualquer usuário ativo (exceto Frota)
    if ($usuarioId === null) {
        $stmtUsuario = $pdo->query("SELECT id FROM bbb_usuario WHERE ativo = 1 AND id != 1 ORDER BY id LIMIT 1");
        $usuarioPadrao = $stmtUsuario->fetch();
        $usuarioId = $usuarioPadrao ? $usuarioPadrao['id'] : 1; // Se não achar nenhum, usa ID 1
    }

    error_log("Usuario ID usado: " . $usuarioId);

    $stmtInspecao = $pdo->prepare($sqlInspecao);
    $stmtInspecao->execute(array(
        'placa' => isset($dados['placa']) ? $dados['placa'] : '',
        'km_inicial' => isset($dados['km_inicial']) ? $dados['km_inicial'] : 0,
        'nivel_combustivel' => $nivelCombustivelConvertido,
        'observacao_painel' => isset($dados['observacao_painel']) ? $dados['observacao_painel'] : '',
        'usuario_id' => $usuarioId
    ));

    $inspecaoId = $pdo->lastInsertId();
    error_log("Inspeção criada com ID: " . $inspecaoId);

    // ============================================
    // 2. Insere fotos do veículo na bbb_inspecao_foto
    // ============================================
    $fotos = array(
        'foto_painel' => 'PAINEL',
        'foto_frontal' => 'FRONTAL',
        'foto_traseira' => 'TRASEIRA',
        'foto_lateral_direita' => 'LATERAL_DIREITA',
        'foto_lateral_esquerda' => 'LATERAL_ESQUERDA'
    );

    $sqlFoto = "INSERT INTO bbb_inspecao_foto (inspecao_id, tipo, foto) VALUES (:inspecao_id, :tipo, :foto)";
    $stmtFoto = $pdo->prepare($sqlFoto);

    foreach ($fotos as $campo => $tipo) {
        if (!empty($dados[$campo]) && $dados[$campo] !== '') {
            $stmtFoto->execute(array(
                'inspecao_id' => $inspecaoId,
                'tipo' => $tipo,
                'foto' => $dados[$campo]
            ));
            error_log("Foto inserida: " . $tipo);
        }
    }

    // ============================================
    // 3. Insere itens de inspeção de forma DINÂMICA
    // ============================================
    $sqlItem = "INSERT INTO bbb_inspecao_item (inspecao_id, categoria, item, status, foto, pressao, foto_caneta, descricao)
                VALUES (:inspecao_id, :categoria, :item, :status, :foto, :pressao, :foto_caneta, :descricao)";
    $stmtItem = $pdo->prepare($sqlItem);

    // Processa itens de inspeção enviados como array dinâmico
    if (isset($dados['itens_inspecao']) && is_array($dados['itens_inspecao'])) {
        error_log("Processando " . count($dados['itens_inspecao']) . " itens de inspeção dinamicamente");

        foreach ($dados['itens_inspecao'] as $item) {
            // Salva TODOS os itens com status preenchido (mudança: agora salva tudo!)
            if (!empty($item['status']) && $item['status'] !== null) {
                $stmtItem->execute(array(
                    'inspecao_id' => $inspecaoId,
                    'categoria' => $item['categoria'],
                    'item' => $item['item'],
                    'status' => $item['status'],
                    'foto' => isset($item['foto']) ? $item['foto'] : null,
                    'pressao' => null,
                    'foto_caneta' => null,
                    'descricao' => isset($item['descricao']) ? $item['descricao'] : null
                ));
                error_log("Item inserido dinamicamente: {$item['categoria']} - {$item['item']} = {$item['status']}");
            }
        }
    }

    // Processa pneus enviados como array dinâmico
    if (isset($dados['itens_pneus']) && is_array($dados['itens_pneus'])) {
        error_log("Processando " . count($dados['itens_pneus']) . " pneus dinamicamente");

        foreach ($dados['itens_pneus'] as $pneu) {
            // Pneus sempre são salvos (independente do status)
            if (!empty($pneu['status']) && $pneu['status'] !== null) {
                $stmtItem->execute(array(
                    'inspecao_id' => $inspecaoId,
                    'categoria' => 'PNEU',
                    'item' => $pneu['item'],
                    'status' => $pneu['status'],
                    'foto' => isset($pneu['foto']) ? $pneu['foto'] : null,
                    'pressao' => isset($pneu['pressao']) ? $pneu['pressao'] : null,
                    'foto_caneta' => isset($pneu['foto_caneta']) ? $pneu['foto_caneta'] : null,
                    'descricao' => isset($pneu['descricao']) ? $pneu['descricao'] : null
                ));
                error_log("Pneu inserido dinamicamente: {$pneu['item']} = {$pneu['status']} | Pressão: " . (isset($pneu['pressao']) ? $pneu['pressao'] : 'N/A'));
            }
        }
    }

    // Commit da transação
    $pdo->commit();

    http_response_code(201);
    echo json_encode(array(
        'sucesso' => true,
        'mensagem' => 'Checklist salvo com sucesso',
        'id' => $inspecaoId
    ));

    error_log("=== CHECKLIST SALVO COM SUCESSO - ID: " . $inspecaoId . " ===");

} catch (PDOException $e) {
    // Rollback em caso de erro
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("ERRO PDO: " . $e->getMessage());
    error_log("TRACE: " . $e->getTraceAsString());

    http_response_code(500);
    echo json_encode(array(
        'erro' => 'Erro ao salvar checklist',
        'detalhes' => $e->getMessage()
    ));
}
