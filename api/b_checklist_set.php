<?php
/**
 * API UNIFICADA - Operações POST/SET para Checklists
 *
 * Substitui:
 * - b_veicular_set.php (checklist simples)
 * - b_checklist_completo_set.php (checklist completo)
 *
 * Detecta automaticamente o tipo de checklist baseado no parâmetro 'tipo'
 * ou na estrutura dos dados enviados.
 *
 * Versão: 4.0.0
 * Data: 2025-12-18
 */

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
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$json = file_get_contents('php://input');
$dados = json_decode($json, true);

error_log("=== REQUISIÇÃO UNIFICADA RECEBIDA ===");
error_log("Raw JSON Length: " . strlen($json));

if (!$dados) {
    http_response_code(400);
    echo json_encode(['erro' => 'Dados inválidos']);
    exit;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Converte nível de combustível de string para TINYINT
 */
function converterNivelCombustivel($valor) {
    $mapa = [
        'vazio' => 0, 'Vazio' => 0, '0%' => 0,
        '1/4' => 1, '25%' => 1,
        '1/2' => 2, '50%' => 2,
        '3/4' => 3, '75%' => 3,
        'cheio' => 4, 'Cheio' => 4, '100%' => 4
    ];
    return isset($mapa[$valor]) ? $mapa[$valor] : 0;
}

/**
 * Detecta o tipo de checklist baseado nos dados
 */
function detectarTipoChecklist($dados) {
    // Se o tipo está explícito, usa ele
    if (isset($dados['tipo'])) {
        return $dados['tipo'];
    }

    // Detecta por estrutura: checklist completo tem parte1, parte2, etc
    if (isset($dados['parte1']) || isset($dados['parte2']) || isset($dados['parte1_interna'])) {
        return 'completo';
    }

    // Detecta por estrutura: checklist simples tem itens_inspecao e itens_pneus
    if (isset($dados['itens_inspecao']) || isset($dados['itens_pneus'])) {
        return 'simples';
    }

    // Padrão: simples
    return 'simples';
}

/**
 * Valida se já existe registro recente da mesma placa
 */
function validarRegistroDuplicado($pdo, $placa, $tabela) {
    $placaValidar = strtoupper(trim($placa));

    if (empty($placaValidar)) {
        return true; // Sem placa, não valida
    }

    $sqlValidacao = "SELECT id, data_realizacao
                    FROM $tabela
                    WHERE placa = :placa
                    AND data_realizacao >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                    ORDER BY data_realizacao DESC
                    LIMIT 1";

    $stmtValidacao = $pdo->prepare($sqlValidacao);
    $stmtValidacao->execute(['placa' => $placaValidar]);
    $registroRecente = $stmtValidacao->fetch();

    if ($registroRecente) {
        error_log("VALIDAÇÃO FALHOU: Placa $placaValidar já possui registro recente (ID: {$registroRecente['id']})");
        http_response_code(409);
        echo json_encode([
            'erro' => 'Registro duplicado',
            'mensagem' => "A placa $placaValidar já possui um registro nas últimas 1 hora. Aguarde antes de registrar novamente.",
            'ultimo_registro' => $registroRecente['data_realizacao']
        ]);
        return false;
    }

    error_log("VALIDAÇÃO OK: Placa $placaValidar pode ser registrada");
    return true;
}

/**
 * Obtém ou define usuario_id
 */
function obterUsuarioId($pdo, $dados) {
    $usuarioId = isset($dados['usuario_id']) ? $dados['usuario_id'] : null;

    if ($usuarioId === null) {
        $stmtUsuario = $pdo->query("SELECT id FROM bbb_usuario WHERE ativo = 1 AND id != 1 ORDER BY id LIMIT 1");
        $usuarioPadrao = $stmtUsuario->fetch();
        $usuarioId = $usuarioPadrao ? $usuarioPadrao['id'] : 1;
    }

    error_log("Usuario ID usado: " . $usuarioId);
    return $usuarioId;
}

// ============================================
// PROCESSA REQUISIÇÃO
// ============================================

try {
    $tipo = detectarTipoChecklist($dados);
    error_log("Tipo de checklist detectado: $tipo");

    // ============================================
    // CHECKLIST SIMPLES
    // ============================================
    if ($tipo === 'simples') {
        // Validação de duplicado
        $placa = isset($dados['placa']) ? $dados['placa'] : '';
        if (!validarRegistroDuplicado($pdo, $placa, 'bbb_inspecao_veiculo')) {
            exit;
        }

        // Inicia transação
        $pdo->beginTransaction();

        // Converte nível de combustível
        $nivelCombustivelOriginal = isset($dados['nivel_combustivel']) ? $dados['nivel_combustivel'] : 'vazio';
        $nivelCombustivelConvertido = converterNivelCombustivel($nivelCombustivelOriginal);
        error_log("Nível Combustível: $nivelCombustivelOriginal -> $nivelCombustivelConvertido");

        // Obtém usuario_id
        $usuarioId = obterUsuarioId($pdo, $dados);

        // Insere dados principais
        $sqlInspecao = "INSERT INTO bbb_inspecao_veiculo (
            placa, km_inicial, nivel_combustivel, observacao_painel, usuario_id, status_geral
        ) VALUES (
            :placa, :km_inicial, :nivel_combustivel, :observacao_painel, :usuario_id, 'PENDENTE'
        )";

        $stmtInspecao = $pdo->prepare($sqlInspecao);
        $stmtInspecao->execute([
            'placa' => isset($dados['placa']) ? $dados['placa'] : '',
            'km_inicial' => isset($dados['km_inicial']) ? $dados['km_inicial'] : 0,
            'nivel_combustivel' => $nivelCombustivelConvertido,
            'observacao_painel' => isset($dados['observacao_painel']) ? $dados['observacao_painel'] : '',
            'usuario_id' => $usuarioId
        ]);

        $inspecaoId = $pdo->lastInsertId();
        error_log("Inspeção criada com ID: " . $inspecaoId);

        // Insere fotos do veículo
        $fotos = [
            'foto_painel' => 'PAINEL',
            'foto_frontal' => 'FRONTAL',
            'foto_traseira' => 'TRASEIRA',
            'foto_lateral_direita' => 'LATERAL_DIREITA',
            'foto_lateral_esquerda' => 'LATERAL_ESQUERDA'
        ];

        $sqlFoto = "INSERT INTO bbb_inspecao_foto (inspecao_id, tipo, foto) VALUES (:inspecao_id, :tipo, :foto)";
        $stmtFoto = $pdo->prepare($sqlFoto);

        foreach ($fotos as $campo => $tipo_foto) {
            if (!empty($dados[$campo]) && $dados[$campo] !== '') {
                $stmtFoto->execute([
                    'inspecao_id' => $inspecaoId,
                    'tipo' => $tipo_foto,
                    'foto' => $dados[$campo]
                ]);
                error_log("Foto inserida: " . $tipo_foto);
            }
        }

        // Insere itens de inspeção dinamicamente
        $sqlItem = "INSERT INTO bbb_inspecao_item (inspecao_id, categoria, item, status, foto, pressao, foto_caneta, descricao)
                    VALUES (:inspecao_id, :categoria, :item, :status, :foto, :pressao, :foto_caneta, :descricao)";
        $stmtItem = $pdo->prepare($sqlItem);

        // Processa itens de inspeção
        if (isset($dados['itens_inspecao']) && is_array($dados['itens_inspecao'])) {
            error_log("Processando " . count($dados['itens_inspecao']) . " itens de inspeção");

            foreach ($dados['itens_inspecao'] as $item) {
                if (!empty($item['status']) && $item['status'] !== null) {
                    $stmtItem->execute([
                        'inspecao_id' => $inspecaoId,
                        'categoria' => $item['categoria'],
                        'item' => $item['item'],
                        'status' => $item['status'],
                        'foto' => isset($item['foto']) ? $item['foto'] : null,
                        'pressao' => null,
                        'foto_caneta' => null,
                        'descricao' => isset($item['descricao']) ? $item['descricao'] : null
                    ]);
                    error_log("Item inserido: {$item['categoria']} - {$item['item']} = {$item['status']}");
                }
            }
        }

        // Processa pneus
        if (isset($dados['itens_pneus']) && is_array($dados['itens_pneus'])) {
            error_log("Processando " . count($dados['itens_pneus']) . " pneus");

            foreach ($dados['itens_pneus'] as $pneu) {
                if (!empty($pneu['status']) && $pneu['status'] !== null) {
                    $stmtItem->execute([
                        'inspecao_id' => $inspecaoId,
                        'categoria' => 'PNEU',
                        'item' => $pneu['item'],
                        'status' => $pneu['status'],
                        'foto' => isset($pneu['foto']) ? $pneu['foto'] : null,
                        'pressao' => isset($pneu['pressao']) ? $pneu['pressao'] : null,
                        'foto_caneta' => isset($pneu['foto_caneta']) ? $pneu['foto_caneta'] : null,
                        'descricao' => isset($pneu['descricao']) ? $pneu['descricao'] : null
                    ]);
                    error_log("Pneu inserido: {$pneu['item']} = {$pneu['status']}");
                }
            }
        }

        // Commit da transação
        $pdo->commit();

        http_response_code(201);
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Checklist simples salvo com sucesso',
            'id' => $inspecaoId,
            'tipo' => 'simples'
        ]);

        error_log("=== CHECKLIST SIMPLES SALVO - ID: $inspecaoId ===");

    // ============================================
    // CHECKLIST COMPLETO
    // ============================================
    } else if ($tipo === 'completo') {
        // Validação de duplicado
        $placa = isset($dados['placa']) ? $dados['placa'] : '';
        if (!validarRegistroDuplicado($pdo, $placa, 'bbb_checklist_completo')) {
            exit;
        }

        // Inicia transação
        $pdo->beginTransaction();

        // Converte nível de combustível
        $nivelCombustivelOriginal = isset($dados['nivel_combustivel']) ? $dados['nivel_combustivel'] : 'vazio';
        $nivelCombustivelConvertido = converterNivelCombustivel($nivelCombustivelOriginal);
        error_log("Nível Combustível: $nivelCombustivelOriginal -> $nivelCombustivelConvertido");

        // Obtém usuario_id
        $usuarioId = obterUsuarioId($pdo, $dados);

        // Processa data de realização
        $dataRealizacao = isset($dados['data_realizacao']) ? $dados['data_realizacao'] : date('Y-m-d H:i:s');
        if (strpos($dataRealizacao, 'T') !== false) {
            $dataRealizacao = date('Y-m-d H:i:s', strtotime($dataRealizacao));
        }

        // Converte as partes para JSON
        $parte1Json = isset($dados['parte1']) ? json_encode($dados['parte1']) : null;
        $parte2Json = isset($dados['parte2']) ? json_encode($dados['parte2']) : null;
        $parte3Json = isset($dados['parte3']) ? json_encode($dados['parte3']) : null;
        $parte4Json = isset($dados['parte4']) ? json_encode($dados['parte4']) : null;
        $parte5Json = isset($dados['parte5']) ? json_encode($dados['parte5']) : null;

        // Insere dados do checklist completo
        $sqlChecklist = "INSERT INTO bbb_checklist_completo (
            placa, km_inicial, nivel_combustivel, foto_painel, observacao_painel,
            usuario_id, data_realizacao,
            parte1_interna, parte2_equipamentos, parte3_dianteira, parte4_traseira, parte5_especial
        ) VALUES (
            :placa, :km_inicial, :nivel_combustivel, :foto_painel, :observacao_painel,
            :usuario_id, :data_realizacao,
            :parte1_interna, :parte2_equipamentos, :parte3_dianteira, :parte4_traseira, :parte5_especial
        )";

        $stmtChecklist = $pdo->prepare($sqlChecklist);
        $stmtChecklist->execute([
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
        ]);

        $checklistId = $pdo->lastInsertId();
        error_log("Checklist completo criado com ID: " . $checklistId);

        // Commit da transação
        $pdo->commit();

        http_response_code(201);
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Checklist completo salvo com sucesso',
            'id' => $checklistId,
            'tipo' => 'completo'
        ]);

        error_log("=== CHECKLIST COMPLETO SALVO - ID: $checklistId ===");
    }

} catch (PDOException $e) {
    // Rollback em caso de erro
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("ERRO PDO [b_checklist_set.php]: " . $e->getMessage());
    error_log("TRACE: " . $e->getTraceAsString());

    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao salvar checklist',
        'detalhes' => $e->getMessage()
    ]);
} catch (Exception $e) {
    // Rollback em caso de erro
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("ERRO GERAL [b_checklist_set.php]: " . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao processar requisição',
        'mensagem' => $e->getMessage()
    ]);
}
?>
