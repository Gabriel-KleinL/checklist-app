<?php
// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once 'hml_veicular_config.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        // Atualizar status de anomalia
        $json = file_get_contents('php://input');
        $dados = json_decode($json, true);

        if (!isset($dados['placa']) || !isset($dados['categoria']) || !isset($dados['item']) || !isset($dados['acao'])) {
            http_response_code(400);
            echo json_encode(['erro' => 'Dados incompletos']);
            exit;
        }

        // Normaliza os dados
        $placa = strtoupper(trim($dados['placa']));
        $categoria = strtoupper(trim($dados['categoria']));
        $item = trim($dados['item']);
        $acao = $dados['acao']; // 'aprovar', 'reprovar', 'finalizar'
        $observacao = isset($dados['observacao']) ? $dados['observacao'] : null;
        $usuarioId = isset($dados['usuario_id']) ? $dados['usuario_id'] : null;

        // Determina o novo status
        if ($acao === 'aprovar') {
            $novoStatus = 'aprovado';
        } elseif ($acao === 'reprovar') {
            $novoStatus = 'reprovado';
        } elseif ($acao === 'finalizar') {
            $novoStatus = 'finalizado';
        } else {
            throw new Exception('Ação inválida');
        }

        // Verifica se já existe registro
        $sqlCheck = "SELECT id, status_anomalia FROM bbb_anomalia_status
                     WHERE placa = :placa AND categoria = :categoria AND item = :item";
        $stmtCheck = $pdo->prepare($sqlCheck);
        $stmtCheck->execute([
            'placa' => $placa,
            'categoria' => $categoria,
            'item' => $item
        ]);
        $registro = $stmtCheck->fetch();

        if ($registro) {
            // Atualiza registro existente
            $updates = ['status_anomalia = :status'];
            $params = [
                'status' => $novoStatus,
                'placa' => $placa,
                'categoria' => $categoria,
                'item' => $item
            ];

            if ($acao === 'aprovar') {
                $updates[] = 'data_aprovacao = NOW()';
                if ($usuarioId) {
                    $updates[] = 'usuario_aprovador_id = :usuario_id';
                    $params['usuario_id'] = $usuarioId;
                }
            } elseif ($acao === 'finalizar') {
                $updates[] = 'data_finalizacao = NOW()';
            }

            if ($observacao) {
                $updates[] = 'observacao = :observacao';
                $params['observacao'] = $observacao;
            }

            $sqlUpdate = "UPDATE bbb_anomalia_status SET " . implode(', ', $updates) . "
                          WHERE placa = :placa AND categoria = :categoria AND item = :item";
            $stmtUpdate = $pdo->prepare($sqlUpdate);
            $stmtUpdate->execute($params);

        } else {
            // Cria novo registro
            $sqlInsert = "INSERT INTO bbb_anomalia_status
                          (placa, categoria, item, status_anomalia, data_aprovacao, usuario_aprovador_id, observacao)
                          VALUES (:placa, :categoria, :item, :status,
                                  " . ($acao === 'aprovar' ? 'NOW()' : 'NULL') . ",
                                  :usuario_id, :observacao)";
            $stmtInsert = $pdo->prepare($sqlInsert);
            $stmtInsert->execute([
                'placa' => $placa,
                'categoria' => $categoria,
                'item' => $item,
                'status' => $novoStatus,
                'usuario_id' => $usuarioId,
                'observacao' => $observacao
            ]);
        }

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Status atualizado com sucesso',
            'novo_status' => $novoStatus
        ]);

    } elseif ($method === 'GET') {
        // Buscar status de uma anomalia específica
        if (!isset($_GET['placa']) || !isset($_GET['categoria']) || !isset($_GET['item'])) {
            http_response_code(400);
            echo json_encode(['erro' => 'Parâmetros incompletos']);
            exit;
        }

        // Normaliza os parâmetros de busca
        $placaBusca = strtoupper(trim($_GET['placa']));
        $categoriaBusca = strtoupper(trim($_GET['categoria']));
        $itemBusca = trim($_GET['item']);

        $sql = "SELECT * FROM bbb_anomalia_status
                WHERE placa = :placa AND categoria = :categoria AND item = :item";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'placa' => $placaBusca,
            'categoria' => $categoriaBusca,
            'item' => $itemBusca
        ]);
        $resultado = $stmt->fetch();

        if ($resultado) {
            echo json_encode($resultado);
        } else {
            echo json_encode(['status_anomalia' => 'pendente']);
        }

    } else {
        http_response_code(405);
        echo json_encode(['erro' => 'Método não permitido']);
    }

} catch (Exception $e) {
    error_log("ERRO ANOMALIA STATUS: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao processar requisição',
        'detalhes' => $e->getMessage()
    ]);
}
