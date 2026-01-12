<?php
/**
 * API UNIFICADA - Configuração de Itens de Checklist
 *
 * Substitui:
 * - b_veicular_config_itens.php
 * - b_checklist_completo_config_itens.php
 *
 * Trabalha com a tabela unificada bbb_config_itens que contém
 * tanto itens do checklist simples quanto do completo.
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

require_once 'hml_veicular_config.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];

    // ============================================
    // GET - Buscar configurações de itens
    // ============================================
    if ($method === 'GET') {
        $acao = isset($_GET['acao']) ? $_GET['acao'] : 'todos';
        $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : null;

        // Validar tipo se fornecido
        if ($tipo && !in_array($tipo, ['simples', 'completo'])) {
            http_response_code(400);
            echo json_encode(['erro' => 'Tipo inválido. Use: simples ou completo']);
            exit;
        }

        switch ($acao) {
            case 'categoria':
                // Buscar itens de uma categoria específica
                if (!isset($_GET['categoria'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Categoria não informada']);
                    exit;
                }

                $sql = "SELECT * FROM bbb_config_itens WHERE categoria = :categoria";
                $params = ['categoria' => $_GET['categoria']];

                // Filtrar por tipo se especificado
                if ($tipo) {
                    $sql .= " AND tipo_checklist = :tipo";
                    $params['tipo'] = $tipo;
                }

                $sql .= " ORDER BY nome_item ASC";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $resultados = $stmt->fetchAll();

                echo json_encode($resultados);
                break;

            case 'habilitados':
                // Buscar apenas itens habilitados
                $categoria = isset($_GET['categoria']) ? $_GET['categoria'] : null;

                $sql = "SELECT * FROM bbb_config_itens WHERE habilitado = 1";
                $params = [];

                // Filtrar por tipo se especificado
                if ($tipo) {
                    $sql .= " AND tipo_checklist = :tipo";
                    $params['tipo'] = $tipo;
                }

                // Filtrar por categoria se especificado
                if ($categoria) {
                    $sql .= " AND categoria = :categoria";
                    $params['categoria'] = $categoria;
                }

                $sql .= " ORDER BY categoria ASC, nome_item ASC";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $resultados = $stmt->fetchAll();

                echo json_encode($resultados);
                break;

            case 'por_tipo':
                // Buscar itens agrupados por tipo de checklist
                $sql = "SELECT * FROM bbb_config_itens ORDER BY tipo_checklist, categoria ASC, nome_item ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $todos = $stmt->fetchAll();

                // Agrupar por tipo
                $agrupado = [
                    'simples' => [],
                    'completo' => []
                ];

                foreach ($todos as $item) {
                    $tipo_item = $item['tipo_checklist'];
                    $agrupado[$tipo_item][] = $item;
                }

                echo json_encode($agrupado);
                break;

            case 'por_categoria':
                // Buscar itens agrupados por categoria (para checklist completo)
                $sql = "SELECT * FROM bbb_config_itens";
                $params = [];

                if ($tipo) {
                    $sql .= " WHERE tipo_checklist = :tipo";
                    $params['tipo'] = $tipo;
                }

                $sql .= " ORDER BY categoria ASC, nome_item ASC";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $todos = $stmt->fetchAll();

                // Agrupar por categoria
                $agrupado = [];
                foreach ($todos as $item) {
                    $cat = $item['categoria'];
                    if (!isset($agrupado[$cat])) {
                        $agrupado[$cat] = [];
                    }
                    $agrupado[$cat][] = $item;
                }

                echo json_encode($agrupado);
                break;

            case 'todos':
            default:
                // Buscar todos os itens
                $sql = "SELECT * FROM bbb_config_itens";
                $params = [];

                // Filtrar por tipo se especificado
                if ($tipo) {
                    $sql .= " WHERE tipo_checklist = :tipo";
                    $params['tipo'] = $tipo;
                }

                $sql .= " ORDER BY tipo_checklist, categoria ASC, nome_item ASC";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $resultados = $stmt->fetchAll();

                echo json_encode($resultados);
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

                $sql = "UPDATE bbb_config_itens
                        SET habilitado = :habilitado
                        WHERE id = :id";

                $params = [
                    'id' => $dados['id'],
                    'habilitado' => $dados['habilitado'] ? 1 : 0
                ];

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);

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
                    $sql = "UPDATE bbb_config_itens
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
                if (!isset($dados['tipo_checklist']) || !isset($dados['categoria']) || !isset($dados['nome_item'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Tipo de checklist, categoria e nome do item são obrigatórios']);
                    exit;
                }

                // Validar tipo de checklist
                if (!in_array($dados['tipo_checklist'], ['simples', 'completo'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Tipo de checklist inválido. Use: simples ou completo']);
                    exit;
                }

                // Validar categoria baseada no tipo
                $categorias_simples = ['MOTOR', 'ELETRICO', 'LIMPEZA', 'FERRAMENTA', 'PNEU'];
                $categorias_completo = ['PARTE1_INTERNA', 'PARTE2_EQUIPAMENTOS', 'PARTE3_DIANTEIRA', 'PARTE4_TRASEIRA', 'PARTE5_ESPECIAL'];

                $categorias_validas = $dados['tipo_checklist'] === 'simples' ? $categorias_simples : $categorias_completo;

                if (!in_array($dados['categoria'], $categorias_validas)) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Categoria inválida para o tipo ' . $dados['tipo_checklist'] . '. Use: ' . implode(', ', $categorias_validas)]);
                    exit;
                }

                $sql = "INSERT INTO bbb_config_itens (tipo_checklist, categoria, nome_item, habilitado, usuario_id)
                        VALUES (:tipo_checklist, :categoria, :nome_item, :habilitado, :usuario_id)";

                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    'tipo_checklist' => $dados['tipo_checklist'],
                    'categoria' => $dados['categoria'],
                    'nome_item' => $dados['nome_item'],
                    'habilitado' => isset($dados['habilitado']) ? ($dados['habilitado'] ? 1 : 0) : 1,
                    'usuario_id' => isset($dados['usuario_id']) ? $dados['usuario_id'] : null
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

        $sql = "DELETE FROM bbb_config_itens WHERE id = :id";
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
    error_log("ERRO PDO [b_config_itens.php]: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro no banco de dados',
        'mensagem' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("ERRO GERAL [b_config_itens.php]: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro interno do servidor',
        'mensagem' => $e->getMessage()
    ]);
}
?>
