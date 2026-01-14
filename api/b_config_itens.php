<?php
/**
 * API UNIFICADA - Configuração de Itens de Checklist
 *
 * Substitui:
 * - b_veicular_config_itens.php
 * - b_checklist_completo_config_itens.php
 *
 * Trabalha com a tabela unificada checklist_config_itens que contém
 * tanto itens do checklist simples quanto do completo.
 *
 * Versão: 4.0.0
 * Data: 2025-12-18
 */

// Carrega configuração centralizada (headers CORS já configurados)
require_once __DIR__ . '/config.php';

// ============================================
// FUNÇÃO HELPER: Buscar itens por tipo de veículo
// ============================================
function buscarItensPorTipoVeiculo($pdo, $tipo_veiculo_id, $condicoes_adicionais = '', $params_adicionais = []) {
    // Busca itens específicos do tipo + itens gerais associados
    $sql = "SELECT DISTINCT ci.* 
            FROM checklist_config_itens ci
            LEFT JOIN checklist_config_itens_tipos_veiculo citv ON ci.id = citv.config_item_id
            WHERE (ci.tipo_veiculo_id = :tipo_veiculo_id 
                   OR (ci.tipo_veiculo_id IS NULL AND citv.tipo_veiculo_id = :tipo_veiculo_id))
            " . ($condicoes_adicionais ? " AND " . $condicoes_adicionais : "") . "
            ORDER BY ci.categoria ASC, ci.nome_item ASC";
    
    $params = array_merge(['tipo_veiculo_id' => $tipo_veiculo_id], $params_adicionais);
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

try {
    $method = $_SERVER['REQUEST_METHOD'];

    // ============================================
    // GET - Buscar configurações de itens
    // ============================================
    if ($method === 'GET') {
        $acao = isset($_GET['acao']) ? $_GET['acao'] : 'todos';
        $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : null;
        $tipo_veiculo_id = isset($_GET['tipo_veiculo_id']) ? intval($_GET['tipo_veiculo_id']) : null;

        // Validar tipo se fornecido
        if ($tipo && !in_array($tipo, ['simples', 'completo'])) {
            http_response_code(400);
            echo json_encode(['erro' => 'Tipo inválido. Use: simples ou completo']);
            exit;
        }

        switch ($acao) {
            case 'por_tipo_veiculo':
                // Buscar itens por tipo de veículo (novo endpoint)
                if (!$tipo_veiculo_id) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'tipo_veiculo_id não informado']);
                    exit;
                }

                $categoria = isset($_GET['categoria']) ? $_GET['categoria'] : null;
                $apenas_habilitados = isset($_GET['apenas_habilitados']) && $_GET['apenas_habilitados'] === 'true';

                $condicoes = [];
                $params = [];
                
                if ($categoria) {
                    $condicoes[] = "ci.categoria = :categoria";
                    $params['categoria'] = $categoria;
                }
                
                if ($apenas_habilitados) {
                    $condicoes[] = "ci.habilitado = 1";
                }

                $condicoes_str = implode(' AND ', $condicoes);
                $resultados = buscarItensPorTipoVeiculo($pdo, $tipo_veiculo_id, $condicoes_str, $params);

                echo json_encode($resultados);
                break;

            case 'categoria':
                // Buscar itens de uma categoria específica
                if (!isset($_GET['categoria'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Categoria não informada']);
                    exit;
                }

                $sql = "SELECT * FROM checklist_config_itens WHERE categoria = :categoria";
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

                $sql = "SELECT * FROM checklist_config_itens WHERE habilitado = 1";
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
                $sql = "SELECT * FROM checklist_config_itens ORDER BY tipo_checklist, categoria ASC, nome_item ASC";
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
                $sql = "SELECT * FROM checklist_config_itens";
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
                // Se tipo_veiculo_id for fornecido, usar função helper
                if ($tipo_veiculo_id) {
                    $resultados = buscarItensPorTipoVeiculo($pdo, $tipo_veiculo_id);
                    echo json_encode($resultados);
                    break;
                }

                // Caso contrário, buscar normalmente (compatibilidade)
                $sql = "SELECT * FROM checklist_config_itens";
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

                $sql = "UPDATE checklist_config_itens
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
                    $sql = "UPDATE checklist_config_itens
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

                // tipo_veiculo_id é opcional (NULL = item geral)
                $tipo_veiculo_id = isset($dados['tipo_veiculo_id']) && $dados['tipo_veiculo_id'] ? intval($dados['tipo_veiculo_id']) : null;

                $pdo->beginTransaction();

                try {
                    $sql = "INSERT INTO checklist_config_itens (tipo_checklist, categoria, nome_item, habilitado, tipo_veiculo_id, usuario_id)
                            VALUES (:tipo_checklist, :categoria, :nome_item, :habilitado, :tipo_veiculo_id, :usuario_id)";

                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([
                        'tipo_checklist' => $dados['tipo_checklist'],
                        'categoria' => $dados['categoria'],
                        'nome_item' => $dados['nome_item'],
                        'habilitado' => isset($dados['habilitado']) ? ($dados['habilitado'] ? 1 : 0) : 1,
                        'tipo_veiculo_id' => $tipo_veiculo_id,
                        'usuario_id' => isset($dados['usuario_id']) ? $dados['usuario_id'] : null
                    ]);

                    $id = $pdo->lastInsertId();

                    // Se for item geral e tiver tipos associados, criar associações
                    if (!$tipo_veiculo_id && isset($dados['tipos_veiculo_associados']) && is_array($dados['tipos_veiculo_associados']) && count($dados['tipos_veiculo_associados']) > 0) {
                        $sqlAssociar = "INSERT INTO checklist_config_itens_tipos_veiculo (config_item_id, tipo_veiculo_id) VALUES (:config_item_id, :tipo_veiculo_id)";
                        $stmtAssociar = $pdo->prepare($sqlAssociar);
                        
                        foreach ($dados['tipos_veiculo_associados'] as $tipo_id) {
                            try {
                                $stmtAssociar->execute([
                                    'config_item_id' => $id,
                                    'tipo_veiculo_id' => intval($tipo_id)
                                ]);
                            } catch (PDOException $e) {
                                // Ignorar duplicatas
                                if (strpos($e->getMessage(), 'Duplicate entry') === false) {
                                    throw $e;
                                }
                            }
                        }
                    }

                    $pdo->commit();

                    http_response_code(201);
                    echo json_encode([
                        'sucesso' => true,
                        'mensagem' => 'Item adicionado com sucesso',
                        'id' => $id
                    ]);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    throw $e;
                }
                break;

            case 'associar_geral':
                // Associar item geral a tipos de veículos
                if (!isset($dados['item_id']) || !isset($dados['tipos_veiculo_ids']) || !is_array($dados['tipos_veiculo_ids'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'item_id e tipos_veiculo_ids (array) são obrigatórios']);
                    exit;
                }

                // Verificar se item é geral (tipo_veiculo_id IS NULL)
                $sqlCheck = "SELECT id, tipo_veiculo_id FROM checklist_config_itens WHERE id = :id LIMIT 1";
                $stmtCheck = $pdo->prepare($sqlCheck);
                $stmtCheck->execute(['id' => $dados['item_id']]);
                $item = $stmtCheck->fetch();

                if (!$item) {
                    http_response_code(404);
                    echo json_encode(['erro' => 'Item não encontrado']);
                    exit;
                }

                if ($item['tipo_veiculo_id'] !== null) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Item não é geral. Apenas itens gerais podem ser associados a tipos']);
                    exit;
                }

                $pdo->beginTransaction();

                try {
                    // Remover associações existentes
                    $sqlDelete = "DELETE FROM checklist_config_itens_tipos_veiculo WHERE config_item_id = :item_id";
                    $stmtDelete = $pdo->prepare($sqlDelete);
                    $stmtDelete->execute(['item_id' => $dados['item_id']]);

                    // Criar novas associações
                    $sqlInsert = "INSERT INTO checklist_config_itens_tipos_veiculo (config_item_id, tipo_veiculo_id) VALUES (:config_item_id, :tipo_veiculo_id)";
                    $stmtInsert = $pdo->prepare($sqlInsert);
                    
                    $count = 0;
                    foreach ($dados['tipos_veiculo_ids'] as $tipo_id) {
                        try {
                            $stmtInsert->execute([
                                'config_item_id' => $dados['item_id'],
                                'tipo_veiculo_id' => intval($tipo_id)
                            ]);
                            $count++;
                        } catch (PDOException $e) {
                            // Ignorar duplicatas
                            if (strpos($e->getMessage(), 'Duplicate entry') === false) {
                                throw $e;
                            }
                        }
                    }

                    $pdo->commit();

                    http_response_code(200);
                    echo json_encode([
                        'sucesso' => true,
                        'mensagem' => "$count tipos de veículos associados com sucesso"
                    ]);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    throw $e;
                }
                break;

            case 'desassociar_geral':
                // Remover associação de item geral a tipos de veículos
                if (!isset($dados['item_id']) || !isset($dados['tipos_veiculo_ids']) || !is_array($dados['tipos_veiculo_ids'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'item_id e tipos_veiculo_ids (array) são obrigatórios']);
                    exit;
                }

                $placeholders = implode(',', array_fill(0, count($dados['tipos_veiculo_ids']), '?'));
                $sql = "DELETE FROM checklist_config_itens_tipos_veiculo 
                        WHERE config_item_id = ? AND tipo_veiculo_id IN ($placeholders)";
                
                $params = array_merge([$dados['item_id']], array_map('intval', $dados['tipos_veiculo_ids']));
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);

                http_response_code(200);
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Associações removidas com sucesso',
                    'linhas_afetadas' => $stmt->rowCount()
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

        $sql = "DELETE FROM checklist_config_itens WHERE id = :id";
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
