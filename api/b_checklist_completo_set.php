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
error_log("=== CHECKLIST COMPLETO - REQUISIÇÃO RECEBIDA ===");
error_log("Método: " . $_SERVER['REQUEST_METHOD']);
error_log("Raw JSON Length: " . strlen($json));

if (!$dados) {
    http_response_code(400);
    echo json_encode(array('erro' => 'Dados inválidos'));
    exit;
}

try {
    // ============================================
    // VALIDAÇÃO: Verifica se já existe registro da mesma placa nas últimas 1 hora
    // ============================================
    $placaParaValidar = isset($dados['placa']) ? strtoupper(trim($dados['placa'])) : '';

    if (!empty($placaParaValidar)) {
        $sqlValidacao = "SELECT id, data_realizacao
                        FROM checklist_bbb_checklist_completo
                        WHERE placa = :placa
                        AND data_realizacao >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                        ORDER BY data_realizacao DESC
                        LIMIT 1";

        $stmtValidacao = $pdo->prepare($sqlValidacao);
        $stmtValidacao->execute(array('placa' => $placaParaValidar));
        $registroRecente = $stmtValidacao->fetch();

        if ($registroRecente) {
            error_log("VALIDAÇÃO FALHOU: Placa $placaParaValidar já possui registro recente (ID: {$registroRecente['id']})");
            error_log("Data do último registro: {$registroRecente['data_realizacao']}");

            http_response_code(409); // 409 Conflict
            echo json_encode(array(
                'erro' => 'Registro duplicado',
                'mensagem' => 'A placa ' . $placaParaValidar . ' já possui um registro nas últimas 1 hora. Aguarde antes de registrar novamente.',
                'ultimo_registro' => $registroRecente['data_realizacao']
            ));
            exit;
        }

        error_log("VALIDAÇÃO OK: Placa $placaParaValidar pode ser registrada");
    }

    // Inicia uma transação para garantir consistência
    $pdo->beginTransaction();

    // ============================================
    // Função auxiliar: Converte valores de combustível
    // ============================================
    function converterNivelCombustivel($valor) {
        $mapa = array(
            'vazio' => '0%',
            'Vazio' => '0%',
            '1/4' => '25%',
            '1/2' => '50%',
            '3/4' => '75%',
            'cheio' => '100%',
            'Cheio' => '100%',
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
    // Insere dados do checklist completo
    // ============================================
    $sqlChecklist = "INSERT INTO checklist_bbb_checklist_completo (
        placa,
        km_inicial,
        nivel_combustivel,
        foto_painel,
        observacao_painel,
        usuario_id,
        data_realizacao,
        parte1_interna,
        parte2_equipamentos,
        parte3_dianteira,
        parte4_traseira,
        parte5_especial
    ) VALUES (
        :placa,
        :km_inicial,
        :nivel_combustivel,
        :foto_painel,
        :observacao_painel,
        :usuario_id,
        :data_realizacao,
        :parte1_interna,
        :parte2_equipamentos,
        :parte3_dianteira,
        :parte4_traseira,
        :parte5_especial
    )";

    // Converte o nível de combustível
    $nivelCombustivelOriginal = isset($dados['nivel_combustivel']) ? $dados['nivel_combustivel'] : 'vazio';
    $nivelCombustivelConvertido = converterNivelCombustivel($nivelCombustivelOriginal);

    error_log("Nível Combustível: $nivelCombustivelOriginal -> $nivelCombustivelConvertido");

    // Obtém ou define usuario_id
    $usuarioId = isset($dados['usuario_id']) ? $dados['usuario_id'] : null;

    // Se não foi informado, busca qualquer usuário ativo
    if ($usuarioId === null) {
        $stmtUsuario = $pdo->query("SELECT id FROM bbb_usuario WHERE ativo = 1 AND id != 1 ORDER BY id LIMIT 1");
        $usuarioPadrao = $stmtUsuario->fetch();
        $usuarioId = $usuarioPadrao ? $usuarioPadrao['id'] : 1;
    }

    error_log("Usuario ID usado: " . $usuarioId);

    // Processa a data de realização
    $dataRealizacao = isset($dados['data_realizacao']) ? $dados['data_realizacao'] : date('Y-m-d H:i:s');

    // Converte ISO 8601 para MySQL datetime se necessário
    if (strpos($dataRealizacao, 'T') !== false) {
        $dataRealizacao = date('Y-m-d H:i:s', strtotime($dataRealizacao));
    }

    // Converte as partes para JSON
    $parte1Json = isset($dados['parte1']) ? json_encode($dados['parte1']) : null;
    $parte2Json = isset($dados['parte2']) ? json_encode($dados['parte2']) : null;
    $parte3Json = isset($dados['parte3']) ? json_encode($dados['parte3']) : null;
    $parte4Json = isset($dados['parte4']) ? json_encode($dados['parte4']) : null;
    $parte5Json = isset($dados['parte5']) ? json_encode($dados['parte5']) : null;

    // Executa a inserção
    $stmtChecklist = $pdo->prepare($sqlChecklist);
    $stmtChecklist->execute(array(
        'placa' => isset($dados['placa']) ? strtoupper(trim($dados['placa'])) : '',
        'km_inicial' => isset($dados['km_inicial']) ? $dados['km_inicial'] : 0,
        'nivel_combustivel' => $nivelCombustivelConvertido,
        'foto_painel' => isset($dados['foto_painel']) ? $dados['foto_painel'] : null,
        'observacao_painel' => isset($dados['observacao_painel']) ? $dados['observacao_painel'] : '',
        'usuario_id' => $usuarioId,
        'data_realizacao' => $dataRealizacao,
        'parte1_interna' => $parte1Json,
        'parte2_equipamentos' => $parte2Json,
        'parte3_dianteira' => $parte3Json,
        'parte4_traseira' => $parte4Json,
        'parte5_especial' => $parte5Json
    ));

    $checklistId = $pdo->lastInsertId();
    error_log("Checklist completo criado com ID: " . $checklistId);

    // Commit da transação
    $pdo->commit();

    http_response_code(201);
    echo json_encode(array(
        'sucesso' => true,
        'mensagem' => 'Checklist completo salvo com sucesso',
        'id' => $checklistId
    ));

    error_log("=== CHECKLIST COMPLETO SALVO COM SUCESSO - ID: " . $checklistId . " ===");

} catch (PDOException $e) {
    // Rollback em caso de erro
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("ERRO PDO: " . $e->getMessage());
    error_log("TRACE: " . $e->getTraceAsString());

    http_response_code(500);
    echo json_encode(array(
        'erro' => 'Erro ao salvar checklist completo',
        'detalhes' => $e->getMessage()
    ));
}
