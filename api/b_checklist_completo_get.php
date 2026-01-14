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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array('erro' => 'Método não permitido'));
    exit;
}

try {
    $acao = isset($_GET['acao']) ? $_GET['acao'] : 'todos';
    error_log("=== CHECKLIST COMPLETO GET - Ação: $acao ===");

    switch ($acao) {
        case 'id':
            // Busca checklist completo por ID
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(array('erro' => 'ID não informado'));
                exit;
            }

            error_log("Buscando checklist completo ID: " . $_GET['id']);

            $sql = "SELECT
                        c.*,
                        u.nome as usuario_nome
                    FROM bbb_checklist_completo c
                    LEFT JOIN bbb_usuario u ON c.usuario_id = u.id
                    WHERE c.id = :id";

            error_log("SQL preparado");

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['id' => $_GET['id']]);

            error_log("Query executada");

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            error_log("Resultado obtido: " . ($resultado ? 'SIM' : 'NÃO'));

            if (!$resultado) {
                http_response_code(404);
                echo json_encode(array('erro' => 'Checklist não encontrado'));
                exit;
            }

            // Decodifica os campos JSON com tratamento de erro
            if (!empty($resultado['parte1_interna'])) {
                $decoded = json_decode($resultado['parte1_interna'], true);
                $resultado['parte1'] = ($decoded !== null) ? $decoded : array();
                unset($resultado['parte1_interna']);
            } else {
                $resultado['parte1'] = array();
            }

            if (!empty($resultado['parte2_equipamentos'])) {
                $decoded = json_decode($resultado['parte2_equipamentos'], true);
                $resultado['parte2'] = ($decoded !== null) ? $decoded : array();
                unset($resultado['parte2_equipamentos']);
            } else {
                $resultado['parte2'] = array();
            }

            if (!empty($resultado['parte3_dianteira'])) {
                $decoded = json_decode($resultado['parte3_dianteira'], true);
                $resultado['parte3'] = ($decoded !== null) ? $decoded : array();
                unset($resultado['parte3_dianteira']);
            } else {
                $resultado['parte3'] = array();
            }

            if (!empty($resultado['parte4_traseira'])) {
                $decoded = json_decode($resultado['parte4_traseira'], true);
                $resultado['parte4'] = ($decoded !== null) ? $decoded : array();
                unset($resultado['parte4_traseira']);
            } else {
                $resultado['parte4'] = array();
            }

            if (!empty($resultado['parte5_especial'])) {
                $decoded = json_decode($resultado['parte5_especial'], true);
                $resultado['parte5'] = ($decoded !== null) ? $decoded : array();
                unset($resultado['parte5_especial']);
            } else {
                $resultado['parte5'] = array();
            }

            echo json_encode($resultado);
            break;

        case 'placa':
            // Busca checklists completos por placa
            if (!isset($_GET['placa'])) {
                http_response_code(400);
                echo json_encode(array('erro' => 'Placa não informada'));
                exit;
            }

            $sql = "SELECT
                        c.id,
                        c.placa,
                        c.km_inicial,
                        c.nivel_combustivel,
                        c.data_realizacao,
                        c.created_at,
                        u.nome as usuario_nome
                    FROM bbb_checklist_completo c
                    LEFT JOIN bbb_usuario u ON c.usuario_id = u.id
                    WHERE c.placa LIKE :placa
                    ORDER BY c.data_realizacao DESC
                    LIMIT 100";

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['placa' => '%' . $_GET['placa'] . '%']);
            $resultados = $stmt->fetchAll();

            echo json_encode($resultados);
            break;

        case 'periodo':
            // Busca checklists completos por período
            if (!isset($_GET['data_inicio']) || !isset($_GET['data_fim'])) {
                http_response_code(400);
                echo json_encode(array('erro' => 'Data de início e fim são obrigatórias'));
                exit;
            }

            $sql = "SELECT
                        c.id,
                        c.placa,
                        c.km_inicial,
                        c.nivel_combustivel,
                        c.data_realizacao,
                        c.created_at,
                        u.nome as usuario_nome
                    FROM bbb_checklist_completo c
                    LEFT JOIN bbb_usuario u ON c.usuario_id = u.id
                    WHERE DATE(c.data_realizacao) BETWEEN :data_inicio AND :data_fim
                    ORDER BY c.data_realizacao DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'data_inicio' => $_GET['data_inicio'],
                'data_fim' => $_GET['data_fim']
            ]);
            $resultados = $stmt->fetchAll();

            echo json_encode($resultados);
            break;

        case 'usuario':
            // Busca checklists completos por usuário
            if (!isset($_GET['usuario_id'])) {
                http_response_code(400);
                echo json_encode(array('erro' => 'ID do usuário não informado'));
                exit;
            }

            $sql = "SELECT
                        c.id,
                        c.placa,
                        c.km_inicial,
                        c.nivel_combustivel,
                        c.data_realizacao,
                        c.created_at,
                        u.nome as usuario_nome
                    FROM bbb_checklist_completo c
                    LEFT JOIN bbb_usuario u ON c.usuario_id = u.id
                    WHERE c.usuario_id = :usuario_id
                    ORDER BY c.data_realizacao DESC
                    LIMIT 100";

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['usuario_id' => $_GET['usuario_id']]);
            $resultados = $stmt->fetchAll();

            echo json_encode($resultados);
            break;

        case 'estatisticas':
            // Retorna estatísticas gerais
            $sql = "SELECT
                        COUNT(*) as total_checklists,
                        COUNT(DISTINCT placa) as total_veiculos,
                        COUNT(DISTINCT usuario_id) as total_usuarios,
                        DATE(MIN(data_realizacao)) as primeira_inspecao,
                        DATE(MAX(data_realizacao)) as ultima_inspecao
                    FROM bbb_checklist_completo";

            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $resultado = $stmt->fetch();

            echo json_encode($resultado);
            break;

        case 'todos':
        default:
            // Busca todos os checklists completos (com limite)
            $limite = isset($_GET['limite']) ? intval($_GET['limite']) : 100;

            $sql = "SELECT
                        c.id,
                        c.placa,
                        c.km_inicial,
                        c.nivel_combustivel,
                        c.data_realizacao,
                        c.created_at,
                        u.nome as usuario_nome
                    FROM bbb_checklist_completo c
                    LEFT JOIN bbb_usuario u ON c.usuario_id = u.id
                    ORDER BY c.data_realizacao DESC
                    LIMIT :limite";

            $stmt = $pdo->prepare($sql);
            $stmt->bindValue('limite', $limite, PDO::PARAM_INT);
            $stmt->execute();
            $resultados = $stmt->fetchAll();

            echo json_encode($resultados);
            break;
    }

} catch (PDOException $e) {
    error_log("ERRO PDO: " . $e->getMessage());
    error_log("TRACE: " . $e->getTraceAsString());
    error_log("FILE: " . $e->getFile() . " LINE: " . $e->getLine());

    http_response_code(500);
    echo json_encode(array(
        'erro' => 'Erro ao buscar checklists completos',
        'mensagem' => $e->getMessage(),
        'codigo' => $e->getCode(),
        'arquivo' => $e->getFile(),
        'linha' => $e->getLine()
    ));
} catch (Exception $e) {
    error_log("ERRO GERAL: " . $e->getMessage());
    error_log("TRACE: " . $e->getTraceAsString());

    http_response_code(500);
    echo json_encode(array(
        'erro' => 'Erro geral ao processar requisição',
        'mensagem' => $e->getMessage(),
        'tipo' => get_class($e)
    ));
}
