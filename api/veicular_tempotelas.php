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

try {
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        // Salvar tempo de tela
        $json = file_get_contents('php://input');
        $dados = json_decode($json, true);

        if (!$dados || !isset($dados['tela']) || !isset($dados['tempo_segundos'])) {
            http_response_code(400);
            echo json_encode(['erro' => 'Dados incompletos. É necessário informar: tela, tempo_segundos, data_hora_inicio, data_hora_fim']);
            exit;
        }

        $sql = "INSERT INTO aaa_tempo_telas
                (inspecao_id, usuario_id, tela, tempo_segundos, data_hora_inicio, data_hora_fim)
                VALUES
                (:inspecao_id, :usuario_id, :tela, :tempo_segundos, :data_hora_inicio, :data_hora_fim)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'inspecao_id' => isset($dados['inspecao_id']) ? $dados['inspecao_id'] : null,
            'usuario_id' => isset($dados['usuario_id']) ? $dados['usuario_id'] : null,
            'tela' => $dados['tela'],
            'tempo_segundos' => $dados['tempo_segundos'],
            'data_hora_inicio' => $dados['data_hora_inicio'],
            'data_hora_fim' => $dados['data_hora_fim']
        ]);

        $id = $pdo->lastInsertId();

        http_response_code(201);
        echo json_encode([
            'sucesso' => true,
            'id' => $id,
            'mensagem' => 'Tempo de tela registrado com sucesso'
        ]);

    } else if ($method === 'GET') {
        // Buscar tempos de tela
        $acao = isset($_GET['acao']) ? $_GET['acao'] : 'todos';

        switch ($acao) {
            case 'inspecao':
                // Buscar tempos de uma inspeção específica
                if (!isset($_GET['inspecao_id'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'ID da inspeção não informado']);
                    exit;
                }

                $sql = "SELECT * FROM aaa_tempo_telas
                        WHERE inspecao_id = :inspecao_id
                        ORDER BY data_hora_inicio ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['inspecao_id' => $_GET['inspecao_id']]);
                $resultados = $stmt->fetchAll();

                echo json_encode($resultados);
                break;

            case 'usuario':
                // Buscar tempos de um usuário específico
                if (!isset($_GET['usuario_id'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'ID do usuário não informado']);
                    exit;
                }

                $sql = "SELECT * FROM aaa_tempo_telas
                        WHERE usuario_id = :usuario_id
                        ORDER BY data_hora_inicio DESC
                        LIMIT 100";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['usuario_id' => $_GET['usuario_id']]);
                $resultados = $stmt->fetchAll();

                echo json_encode($resultados);
                break;

            case 'estatisticas':
                // Retorna estatísticas gerais de tempo por tela
                $sql = "SELECT
                            tela,
                            COUNT(*) as total_registros,
                            AVG(tempo_segundos) as tempo_medio_segundos,
                            MIN(tempo_segundos) as tempo_minimo_segundos,
                            MAX(tempo_segundos) as tempo_maximo_segundos,
                            SUM(tempo_segundos) as tempo_total_segundos
                        FROM aaa_tempo_telas
                        GROUP BY tela
                        ORDER BY tempo_medio_segundos DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $resultados = $stmt->fetchAll();

                echo json_encode($resultados);
                break;

            case 'todos':
            default:
                // Buscar todos os registros (com limite)
                $limite = isset($_GET['limite']) ? intval($_GET['limite']) : 100;

                $sql = "SELECT * FROM aaa_tempo_telas
                        ORDER BY data_hora_inicio DESC
                        LIMIT :limite";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue('limite', $limite, PDO::PARAM_INT);
                $stmt->execute();
                $resultados = $stmt->fetchAll();

                echo json_encode($resultados);
                break;
        }

    } else {
        http_response_code(405);
        echo json_encode(['erro' => 'Método não permitido']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro no banco de dados',
        'mensagem' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro interno do servidor',
        'mensagem' => $e->getMessage()
    ]);
}
?>
