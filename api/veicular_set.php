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

require_once 'veicular_config.php';

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
    // 1. Insere dados principais na aaa_inspecao_veiculo
    // ============================================
    $sqlInspecao = "INSERT INTO aaa_inspecao_veiculo (
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
        $stmtUsuario = $pdo->query("SELECT id FROM aaa_usuario WHERE ativo = 1 AND id != 1 ORDER BY id LIMIT 1");
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
    // 2. Insere fotos do veículo na aaa_inspecao_foto
    // ============================================
    $fotos = array(
        'foto_painel' => 'PAINEL',
        'foto_frontal' => 'FRONTAL',
        'foto_traseira' => 'TRASEIRA',
        'foto_lateral_direita' => 'LATERAL_DIREITA',
        'foto_lateral_esquerda' => 'LATERAL_ESQUERDA'
    );

    $sqlFoto = "INSERT INTO aaa_inspecao_foto (inspecao_id, tipo, foto) VALUES (:inspecao_id, :tipo, :foto)";
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
    // 3. Insere itens de inspeção na aaa_inspecao_item
    // ============================================
    $sqlItem = "INSERT INTO aaa_inspecao_item (inspecao_id, categoria, item, status, foto, pressao, foto_caneta)
                VALUES (:inspecao_id, :categoria, :item, :status, :foto, :pressao, :foto_caneta)";
    $stmtItem = $pdo->prepare($sqlItem);

    // MOTOR (salva apenas itens com status "ruim")
    $itensMotor = array(
        'motor_agua_radiador' => 'Água Radiador',
        'motor_agua_parabrisa' => 'Água Limpador Parabrisa',
        'motor_fluido_freio' => 'Fluido de Freio',
        'motor_nivel_oleo' => 'Nível de Óleo',
        'motor_tampa_radiador' => 'Tampa do Radiador',
        'motor_freio_mao' => 'Freio de Mão'
    );

    foreach ($itensMotor as $campo => $nomeItem) {
        if (!empty($dados[$campo]) && $dados[$campo] !== null) {
            // Salva apenas se o status for "ruim"
            if ($dados[$campo] === 'ruim') {
                $fotoMotor = isset($dados[$campo . '_foto']) ? $dados[$campo . '_foto'] : '';
                $stmtItem->execute(array(
                    'inspecao_id' => $inspecaoId,
                    'categoria' => 'MOTOR',
                    'item' => $nomeItem,
                    'status' => $dados[$campo],
                    'foto' => $fotoMotor,
                    'pressao' => null,
                    'foto_caneta' => null
                ));
                error_log("Item Motor inserido: " . $nomeItem . " = " . $dados[$campo]);
            }
        }
    }

    // ELÉTRICOS (salva apenas itens com status "ruim")
    $itensEletricos = array(
        'eletrico_seta_esquerda' => 'Seta Esquerda',
        'eletrico_seta_direita' => 'Seta Direita',
        'eletrico_pisca_alerta' => 'Pisca Alerta',
        'eletrico_farol' => 'Farol'
    );

    foreach ($itensEletricos as $campo => $nomeItem) {
        if (!empty($dados[$campo]) && $dados[$campo] !== null) {
            // Salva apenas se o status for "ruim"
            if ($dados[$campo] === 'ruim') {
                $fotoEletrico = isset($dados[$campo . '_foto']) ? $dados[$campo . '_foto'] : '';
                $stmtItem->execute(array(
                    'inspecao_id' => $inspecaoId,
                    'categoria' => 'ELETRICO',
                    'item' => $nomeItem,
                    'status' => $dados[$campo],
                    'foto' => $fotoEletrico,
                    'pressao' => null,
                    'foto_caneta' => null
                ));
                error_log("Item Elétrico inserido: " . $nomeItem . " = " . $dados[$campo]);
            }
        }
    }

    // LIMPEZA (salva apenas itens com status "ruim" ou "pessima")
    $itensLimpeza = array(
        'limpeza_interna' => 'Limpeza Interna',
        'limpeza_externa' => 'Limpeza Externa'
    );

    foreach ($itensLimpeza as $campo => $nomeItem) {
        if (!empty($dados[$campo]) && $dados[$campo] !== null) {
            // Salva apenas se o status for "ruim" ou "pessima"
            if ($dados[$campo] === 'ruim' || $dados[$campo] === 'pessima') {
                $fotoLimpeza = isset($dados[$campo . '_foto']) ? $dados[$campo . '_foto'] : '';
                $stmtItem->execute(array(
                    'inspecao_id' => $inspecaoId,
                    'categoria' => 'LIMPEZA',
                    'item' => $nomeItem,
                    'status' => $dados[$campo],
                    'foto' => $fotoLimpeza,
                    'pressao' => null,
                    'foto_caneta' => null
                ));
                error_log("Item Limpeza inserido: " . $nomeItem . " = " . $dados[$campo]);
            }
        }
    }

    // FERRAMENTAS (salva apenas itens com status "nao_contem")
    $itensFerramentas = array(
        'ferramenta_macaco' => 'Macaco',
        'ferramenta_chave_roda' => 'Chave de Roda',
        'ferramenta_chave_estepe' => 'Chave do Estepe',
        'ferramenta_triangulo' => 'Triângulo'
    );

    foreach ($itensFerramentas as $campo => $nomeItem) {
        if (!empty($dados[$campo]) && $dados[$campo] !== null) {
            // Salva apenas se o status for "nao_contem"
            if ($dados[$campo] === 'nao_contem') {
                $fotoFerramenta = isset($dados[$campo . '_foto']) ? $dados[$campo . '_foto'] : '';
                $stmtItem->execute(array(
                    'inspecao_id' => $inspecaoId,
                    'categoria' => 'FERRAMENTA',
                    'item' => $nomeItem,
                    'status' => $dados[$campo],
                    'foto' => $fotoFerramenta,
                    'pressao' => null,
                    'foto_caneta' => null
                ));
                error_log("Item Ferramenta inserido: " . $nomeItem . " = " . $dados[$campo]);
            }
        }
    }

    // PNEUS (salva SEMPRE todos os itens, independente do status)
    $itensPneus = array(
        'pneu_dianteira_direita' => 'Dianteira Direita',
        'pneu_dianteira_esquerda' => 'Dianteira Esquerda',
        'pneu_traseira_direita' => 'Traseira Direita',
        'pneu_traseira_esquerda' => 'Traseira Esquerda',
        'pneu_estepe' => 'Estepe'
    );

    foreach ($itensPneus as $campo => $nomeItem) {
        if (!empty($dados[$campo]) && $dados[$campo] !== null) {
            $fotoPneu = isset($dados[$campo . '_foto']) ? $dados[$campo . '_foto'] : '';
            $pressaoPneu = isset($dados[$campo . '_pressao']) ? $dados[$campo . '_pressao'] : null;
            $fotoCanetaPneu = isset($dados[$campo . '_foto_caneta']) ? $dados[$campo . '_foto_caneta'] : '';
            $stmtItem->execute(array(
                'inspecao_id' => $inspecaoId,
                'categoria' => 'PNEU',
                'item' => $nomeItem,
                'status' => $dados[$campo],
                'foto' => $fotoPneu,
                'pressao' => $pressaoPneu,
                'foto_caneta' => $fotoCanetaPneu
            ));
            error_log("Item Pneu inserido: " . $nomeItem . " = " . $dados[$campo] . " | Pressão: " . $pressaoPneu);
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

