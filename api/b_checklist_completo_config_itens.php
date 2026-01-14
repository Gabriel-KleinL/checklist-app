<?php
// Output buffering para garantir JSON limpo
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Headers CORS - DEVE VIR ANTES DE QUALQUER SAÍDA
if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    header('Content-Type: application/json; charset=utf-8');
}

// Responde requisições OPTIONS (preflight) IMEDIATAMENTE
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_clean();
    http_response_code(200);
    exit(0);
}

try {
    require_once 'b_veicular_config.php';
} catch (Exception $e) {
    ob_clean();
    error_log("ERRO ao carregar config: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao carregar configuração',
        'mensagem' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];

    // ============================================
    // GET - Buscar configurações de itens
    // ============================================
    if ($method === 'GET') {
        $acao = isset($_GET['acao']) ? $_GET['acao'] : 'todos';

        switch ($acao) {
            case 'categoria':
                // Buscar itens de uma categoria específica
                if (!isset($_GET['categoria'])) {
                    ob_clean();
                    http_response_code(400);
                    echo json_encode(['erro' => 'Categoria não informada'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    exit;
                }

                $sql = "SELECT * FROM checklist_config_itens_completo
                        WHERE categoria = :categoria
                        ORDER BY nome_item ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['categoria' => $_GET['categoria']]);
                $resultados = $stmt->fetchAll();

                ob_clean();
                $json = json_encode($resultados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                if ($json === false) {
                    throw new Exception('Erro ao codificar JSON: ' . json_last_error_msg());
                }
                echo $json;
                break;

            case 'habilitados':
                // Buscar apenas itens habilitados
                $categoria = isset($_GET['categoria']) ? $_GET['categoria'] : null;

                if ($categoria) {
                    $sql = "SELECT * FROM checklist_config_itens_completo
                            WHERE habilitado = 1 AND categoria = :categoria
                            ORDER BY nome_item ASC";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute(['categoria' => $categoria]);
                } else {
                    $sql = "SELECT * FROM checklist_config_itens_completo
                            WHERE habilitado = 1
                            ORDER BY categoria ASC, nome_item ASC";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute();
                }

                $resultados = $stmt->fetchAll();
                ob_clean();
                $json = json_encode($resultados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                if ($json === false) {
                    throw new Exception('Erro ao codificar JSON: ' . json_last_error_msg());
                }
                echo $json;
                break;

            case 'por_parte':
                // Buscar itens agrupados por parte
                $sql = "SELECT * FROM checklist_config_itens_completo
                        ORDER BY categoria ASC, nome_item ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $todos = $stmt->fetchAll();

                // Agrupar por categoria
                $agrupado = [
                    'PARTE1_INTERNA' => [],
                    'PARTE2_EQUIPAMENTOS' => [],
                    'PARTE3_DIANTEIRA' => [],
                    'PARTE4_TRASEIRA' => [],
                    'PARTE5_ESPECIAL' => []
                ];

                foreach ($todos as $item) {
                    $categoria = $item['categoria'];
                    if (isset($agrupado[$categoria])) {
                        $agrupado[$categoria][] = $item;
                    }
                }

                ob_clean();
                $json = json_encode($agrupado, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                if ($json === false) {
                    throw new Exception('Erro ao codificar JSON: ' . json_last_error_msg());
                }
                echo $json;
                break;

            case 'todos':
            default:
                // Buscar todos os itens
                $sql = "SELECT * FROM checklist_config_itens_completo
                        ORDER BY categoria ASC, nome_item ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $resultados = $stmt->fetchAll();

                ob_clean();
                $json = json_encode($resultados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                if ($json === false) {
                    throw new Exception('Erro ao codificar JSON: ' . json_last_error_msg());
                }
                echo $json;
                break;
        }

    // ============================================
    // POST - Atualizar configuração de um item
    // ============================================
    } else if ($method === 'POST') {
        $json = file_get_contents('php://input');
        $dados = json_decode($json, true);

        if (!$dados) {
            http_response_code(400);
            echo json_encode(['erro' => 'Dados inválidos']);
            exit;
        }

        $acao = isset($dados['acao']) ? $dados['acao'] : '';

        switch ($acao) {
            case 'atualizar_item':
                // Atualizar um item específico
                if (!isset($dados['id']) || !isset($dados['habilitado'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'ID e status habilitado são obrigatórios']);
                    exit;
                }

                $sql = "UPDATE checklist_config_itens_completo
                        SET habilitado = :habilitado
                        WHERE id = :id";

                $params = [
                    'id' => $dados['id'],
                    'habilitado' => $dados['habilitado'] ? 1 : 0
                ];

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);

                // Retorna sucesso mesmo se não houve mudanças (já estava no estado desejado)
                http_response_code(200);
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => $stmt->rowCount() > 0 ? 'Item atualizado com sucesso' : 'Item já estava no estado solicitado',
                    'linhas_afetadas' => $stmt->rowCount()
                ]);
                break;

            case 'atualizar_multiplos':
                // Atualizar múltiplos itens de uma vez
                if (!isset($dados['itens']) || !is_array($dados['itens'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Lista de itens inválida']);
                    exit;
                }

                $pdo->beginTransaction();

                try {
                    $sql = "UPDATE checklist_config_itens_completo
                            SET habilitado = :habilitado
                            WHERE id = :id";
                    $stmt = $pdo->prepare($sql);

                    $count = 0;
                    foreach ($dados['itens'] as $item) {
                        if (isset($item['id']) && isset($item['habilitado'])) {
                            $stmt->execute([
                                'id' => $item['id'],
                                'habilitado' => $item['habilitado'] ? 1 : 0
                            ]);
                            $count += $stmt->rowCount();
                        }
                    }

                    $pdo->commit();

                    http_response_code(200);
                    echo json_encode([
                        'sucesso' => true,
                        'mensagem' => "$count itens atualizados com sucesso"
                    ]);

                } catch (Exception $e) {
                    $pdo->rollBack();
                    throw $e;
                }
                break;

            case 'adicionar_item':
                // Adicionar um novo item customizado
                if (!isset($dados['categoria']) || !isset($dados['nome_item'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Categoria e nome do item são obrigatórios']);
                    exit;
                }

                // Validar categoria
                $categorias_validas = ['PARTE1_INTERNA', 'PARTE2_EQUIPAMENTOS', 'PARTE3_DIANTEIRA', 'PARTE4_TRASEIRA', 'PARTE5_ESPECIAL'];
                if (!in_array($dados['categoria'], $categorias_validas)) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Categoria inválida. Use: ' . implode(', ', $categorias_validas)]);
                    exit;
                }

                $sql = "INSERT INTO checklist_config_itens_completo (categoria, nome_item, habilitado, usuario_id, usuario_nome)
                        VALUES (:categoria, :nome_item, :habilitado, :usuario_id, :usuario_nome)";

                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    'categoria' => $dados['categoria'],
                    'nome_item' => $dados['nome_item'],
                    'habilitado' => isset($dados['habilitado']) ? ($dados['habilitado'] ? 1 : 0) : 1,
                    'usuario_id' => isset($dados['usuario_id']) ? $dados['usuario_id'] : null,
                    'usuario_nome' => isset($dados['usuario_nome']) ? $dados['usuario_nome'] : null
                ]);

                $id = $pdo->lastInsertId();

                http_response_code(201);
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Item adicionado com sucesso',
                    'id' => $id
                ]);
                break;

            default:
                http_response_code(400);
                echo json_encode(['erro' => 'Ação inválida']);
                break;
        }

    // ============================================
    // DELETE - Remover um item customizado
    // ============================================
    } else if ($method === 'DELETE') {
        $json = file_get_contents('php://input');
        $dados = json_decode($json, true);

        if (!isset($dados['id'])) {
            http_response_code(400);
            echo json_encode(['erro' => 'ID do item não informado']);
            exit;
        }

        $sql = "DELETE FROM checklist_config_itens_completo WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $dados['id']]);

        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Item removido com sucesso'
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Item não encontrado'
            ]);
        }

    } else {
        http_response_code(405);
        echo json_encode(['erro' => 'Método não permitido']);
    }

} catch (PDOException $e) {
    ob_clean();
    error_log("ERRO PDO: " . $e->getMessage());
    http_response_code(500);
    $json = json_encode([
        'erro' => 'Erro no banco de dados',
        'mensagem' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    echo $json ? $json : '{"erro":"Erro ao codificar JSON de erro"}';
} catch (Exception $e) {
    ob_clean();
    error_log("ERRO GERAL: " . $e->getMessage());
    http_response_code(500);
    $json = json_encode([
        'erro' => 'Erro interno do servidor',
        'mensagem' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    echo $json ? $json : '{"erro":"Erro ao codificar JSON de erro"}';
}
?>
