<?php
/**
 * API - Tipos de Veículos (CONSOLIDADO)
 *
 * Gerencia tipos de veículos do sistema (Carro, Moto, Caminhão, etc.)
 * Permite CRUD completo de tipos de veículos
 *
 * Funciona em PRODUÇÃO e STAGING automaticamente
 *
 * Versão: 2.0.0 (Consolidada)
 * Data: 2026-01-13
 */

// Output buffering para garantir JSON limpo
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Carrega configuração centralizada (detecta ambiente automaticamente)
try {
    require_once __DIR__ . '/config.php';
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

// Headers CORS e OPTIONS já tratados pelo config.php
// Conexão $pdo já disponível

try {
    $method = $_SERVER['REQUEST_METHOD'];

    // ============================================
    // GET - Buscar tipos de veículos
    // ============================================
    if ($method === 'GET') {
        $acao = isset($_GET['acao']) ? $_GET['acao'] : 'todos';

        switch ($acao) {
            case 'por_id':
                // Buscar tipo específico por ID
                if (!isset($_GET['id'])) {
                    ob_clean();
                    http_response_code(400);
                    echo json_encode(['erro' => 'ID não informado'], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $sql = "SELECT * FROM bbb_tipos_veiculo WHERE id = :id LIMIT 1";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['id' => $_GET['id']]);
                $tipo = $stmt->fetch(PDO::FETCH_ASSOC);

                ob_clean();
                if ($tipo) {
                    echo json_encode($tipo, JSON_UNESCAPED_UNICODE);
                } else {
                    http_response_code(404);
                    echo json_encode(['erro' => 'Tipo de veículo não encontrado'], JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'todos':
            default:
                // Buscar todos os tipos (apenas ativos por padrão)
                $apenas_ativos = !isset($_GET['incluir_inativos']) || $_GET['incluir_inativos'] !== 'true';

                if ($apenas_ativos) {
                    $sql = "SELECT * FROM bbb_tipos_veiculo WHERE ativo = 1 ORDER BY nome ASC";
                } else {
                    $sql = "SELECT * FROM bbb_tipos_veiculo ORDER BY nome ASC";
                }

                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $tipos = $stmt->fetchAll(PDO::FETCH_ASSOC);

                ob_clean();
                echo json_encode($tipos, JSON_UNESCAPED_UNICODE);
                break;
        }

    // ============================================
    // POST - Criar, atualizar ou gerenciar tipos
    // ============================================
    } else if ($method === 'POST') {
        $json = file_get_contents('php://input');
        $dados = json_decode($json, true);

        if (!$dados) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['erro' => 'Dados inválidos'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $acao = isset($dados['acao']) ? $dados['acao'] : '';

        switch ($acao) {
            case 'criar':
                // Criar novo tipo de veículo
                if (!isset($dados['nome']) || empty(trim($dados['nome']))) {
                    ob_clean();
                    http_response_code(400);
                    echo json_encode(['erro' => 'Nome do tipo de veículo é obrigatório'], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                // Verificar se já existe tipo com mesmo nome
                $sqlCheck = "SELECT id FROM bbb_tipos_veiculo WHERE nome = :nome LIMIT 1";
                $stmtCheck = $pdo->prepare($sqlCheck);
                $stmtCheck->execute(['nome' => trim($dados['nome'])]);

                if ($stmtCheck->fetch()) {
                    ob_clean();
                    http_response_code(409);
                    echo json_encode(['erro' => 'Já existe um tipo de veículo com este nome'], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $sql = "INSERT INTO bbb_tipos_veiculo (nome, descricao, ativo, icone, usuario_id)
                        VALUES (:nome, :descricao, :ativo, :icone, :usuario_id)";

                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    'nome' => trim($dados['nome']),
                    'descricao' => isset($dados['descricao']) ? $dados['descricao'] : null,
                    'ativo' => isset($dados['ativo']) ? ($dados['ativo'] ? 1 : 0) : 1,
                    'icone' => isset($dados['icone']) ? $dados['icone'] : null,
                    'usuario_id' => isset($dados['usuario_id']) ? $dados['usuario_id'] : null
                ]);

                $id = $pdo->lastInsertId();

                // Buscar tipo criado
                $sqlBuscar = "SELECT * FROM bbb_tipos_veiculo WHERE id = :id";
                $stmtBuscar = $pdo->prepare($sqlBuscar);
                $stmtBuscar->execute(['id' => $id]);
                $tipo = $stmtBuscar->fetch(PDO::FETCH_ASSOC);

                ob_clean();
                http_response_code(201);
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Tipo de veículo criado com sucesso',
                    'tipo' => $tipo
                ], JSON_UNESCAPED_UNICODE);
                break;

            case 'atualizar':
                // Atualizar tipo de veículo existente
                if (!isset($dados['id']) || !isset($dados['nome']) || empty(trim($dados['nome']))) {
                    ob_clean();
                    http_response_code(400);
                    echo json_encode(['erro' => 'ID e nome são obrigatórios'], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                // Verificar se tipo existe
                $sqlCheck = "SELECT id FROM bbb_tipos_veiculo WHERE id = :id LIMIT 1";
                $stmtCheck = $pdo->prepare($sqlCheck);
                $stmtCheck->execute(['id' => $dados['id']]);

                if (!$stmtCheck->fetch()) {
                    ob_clean();
                    http_response_code(404);
                    echo json_encode(['erro' => 'Tipo de veículo não encontrado'], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                // Verificar se outro tipo já usa este nome
                $sqlCheckNome = "SELECT id FROM bbb_tipos_veiculo WHERE nome = :nome AND id != :id LIMIT 1";
                $stmtCheckNome = $pdo->prepare($sqlCheckNome);
                $stmtCheckNome->execute(['nome' => trim($dados['nome']), 'id' => $dados['id']]);

                if ($stmtCheckNome->fetch()) {
                    ob_clean();
                    http_response_code(409);
                    echo json_encode(['erro' => 'Já existe outro tipo de veículo com este nome'], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $sql = "UPDATE bbb_tipos_veiculo
                        SET nome = :nome, descricao = :descricao, icone = :icone
                        WHERE id = :id";

                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    'id' => $dados['id'],
                    'nome' => trim($dados['nome']),
                    'descricao' => isset($dados['descricao']) ? $dados['descricao'] : null,
                    'icone' => isset($dados['icone']) ? $dados['icone'] : null
                ]);

                // Buscar tipo atualizado
                $sqlBuscar = "SELECT * FROM bbb_tipos_veiculo WHERE id = :id";
                $stmtBuscar = $pdo->prepare($sqlBuscar);
                $stmtBuscar->execute(['id' => $dados['id']]);
                $tipo = $stmtBuscar->fetch(PDO::FETCH_ASSOC);

                ob_clean();
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Tipo de veículo atualizado com sucesso',
                    'tipo' => $tipo
                ], JSON_UNESCAPED_UNICODE);
                break;

            case 'toggle_ativo':
                // Ativar/desativar tipo de veículo
                if (!isset($dados['id'])) {
                    ob_clean();
                    http_response_code(400);
                    echo json_encode(['erro' => 'ID não informado'], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                // Buscar tipo atual
                $sqlBuscar = "SELECT id, ativo FROM bbb_tipos_veiculo WHERE id = :id LIMIT 1";
                $stmtBuscar = $pdo->prepare($sqlBuscar);
                $stmtBuscar->execute(['id' => $dados['id']]);
                $tipo = $stmtBuscar->fetch(PDO::FETCH_ASSOC);

                if (!$tipo) {
                    ob_clean();
                    http_response_code(404);
                    echo json_encode(['erro' => 'Tipo de veículo não encontrado'], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                // Não permitir desativar tipo padrão (ID 1 - Carro)
                if ($tipo['id'] == 1 && $tipo['ativo'] == 1) {
                    ob_clean();
                    http_response_code(400);
                    echo json_encode(['erro' => 'Não é possível desativar o tipo padrão "Carro"'], JSON_UNESCAPED_UNICODE);
                    exit;
                }

                $novoStatus = $tipo['ativo'] == 1 ? 0 : 1;

                $sql = "UPDATE bbb_tipos_veiculo SET ativo = :ativo WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['id' => $dados['id'], 'ativo' => $novoStatus]);

                // Buscar tipo atualizado
                $sqlBuscarAtualizado = "SELECT * FROM bbb_tipos_veiculo WHERE id = :id";
                $stmtBuscarAtualizado = $pdo->prepare($sqlBuscarAtualizado);
                $stmtBuscarAtualizado->execute(['id' => $dados['id']]);
                $tipoAtualizado = $stmtBuscarAtualizado->fetch(PDO::FETCH_ASSOC);

                ob_clean();
                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => $novoStatus == 1 ? 'Tipo de veículo ativado' : 'Tipo de veículo desativado',
                    'tipo' => $tipoAtualizado
                ], JSON_UNESCAPED_UNICODE);
                break;

            default:
                ob_clean();
                http_response_code(400);
                echo json_encode(['erro' => 'Ação inválida'], JSON_UNESCAPED_UNICODE);
                break;
        }

    } else {
        ob_clean();
        http_response_code(405);
        echo json_encode(['erro' => 'Método não permitido'], JSON_UNESCAPED_UNICODE);
    }

} catch (PDOException $e) {
    ob_clean();
    error_log("ERRO PDO TIPOS VEICULO (" . ENVIRONMENT . "): " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => READ_ONLY_MODE ? 'Operação bloqueada em staging' : 'Erro no banco de dados',
        'mensagem' => $e->getMessage(),
        'ambiente' => ENVIRONMENT
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    ob_clean();
    error_log("ERRO GERAL TIPOS VEICULO (" . ENVIRONMENT . "): " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro interno do servidor',
        'mensagem' => $e->getMessage(),
        'ambiente' => ENVIRONMENT
    ], JSON_UNESCAPED_UNICODE);
}
