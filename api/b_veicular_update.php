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

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(array('erro' => 'Método não permitido'));
    exit;
}

$json = file_get_contents('php://input');
$dados = json_decode($json, true);

// Log para debug
error_log("=== REQUISIÇÃO DE ATUALIZAÇÃO RECEBIDA ===");
error_log("Método: " . $_SERVER['REQUEST_METHOD']);
error_log("Raw JSON Length: " . strlen($json));
error_log("Dados decodificados: " . print_r($dados, true));

if (!$dados || !isset($dados['inspecao_id'])) {
    http_response_code(400);
    echo json_encode(array('erro' => 'Dados inválidos ou inspecao_id não informado'));
    exit;
}

try {
    $inspecaoId = $dados['inspecao_id'];

    // Verifica se a inspeção existe
    $sqlCheck = "SELECT id FROM bbb_inspecao_veiculo WHERE id = :id";
    $stmtCheck = $pdo->prepare($sqlCheck);
    $stmtCheck->execute(['id' => $inspecaoId]);

    if (!$stmtCheck->fetch()) {
        http_response_code(404);
        echo json_encode(array('erro' => 'Inspeção não encontrada'));
        exit;
    }

    // Inicia uma transação para garantir consistência
    $pdo->beginTransaction();

    // ============================================
    // 1. Atualiza fotos do veículo (se enviadas)
    // ============================================
    if (isset($dados['fotos']) && is_array($dados['fotos'])) {
        $sqlFoto = "INSERT INTO bbb_inspecao_foto (inspecao_id, tipo, foto) VALUES (:inspecao_id, :tipo, :foto)";
        $stmtFoto = $pdo->prepare($sqlFoto);

        foreach ($dados['fotos'] as $foto) {
            if (!empty($foto['tipo']) && !empty($foto['foto'])) {
                $stmtFoto->execute(array(
                    'inspecao_id' => $inspecaoId,
                    'tipo' => $foto['tipo'],
                    'foto' => $foto['foto']
                ));
                error_log("Foto inserida: " . $foto['tipo']);
            }
        }
    }

    // ============================================
    // 2. Insere itens de inspeção de forma DINÂMICA
    // ============================================
    $sqlItem = "INSERT INTO bbb_inspecao_item (inspecao_id, categoria, item, status, foto, pressao, foto_caneta, descricao)
                VALUES (:inspecao_id, :categoria, :item, :status, :foto, :pressao, :foto_caneta, :descricao)";
    $stmtItem = $pdo->prepare($sqlItem);

    // Processa itens de inspeção enviados como array dinâmico
    if (isset($dados['itens_inspecao']) && is_array($dados['itens_inspecao'])) {
        error_log("Processando " . count($dados['itens_inspecao']) . " itens de inspeção dinamicamente");

        foreach ($dados['itens_inspecao'] as $item) {
            // Salva TODOS os itens com status preenchido
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

    http_response_code(200);
    echo json_encode(array(
        'sucesso' => true,
        'mensagem' => 'Inspeção atualizada com sucesso',
        'id' => $inspecaoId
    ));

    error_log("=== INSPEÇÃO ATUALIZADA COM SUCESSO - ID: " . $inspecaoId . " ===");

} catch (PDOException $e) {
    // Rollback em caso de erro
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("ERRO PDO: " . $e->getMessage());
    error_log("TRACE: " . $e->getTraceAsString());

    http_response_code(500);
    echo json_encode(array(
        'erro' => 'Erro ao atualizar inspeção',
        'detalhes' => $e->getMessage()
    ));
}
