<?php

require_once 'veicular_config.php';

// Já está sendo tratado no veicular_config.php, mas garantindo aqui também
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

try {
    $acao = isset($_GET['acao']) ? $_GET['acao'] : 'todos';

    switch ($acao) {
        case 'id':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['erro' => 'ID não informado']);
                exit;
            }

            $sql = "SELECT * FROM checklist_inspecao WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['id' => $_GET['id']]);
            $resultado = $stmt->fetch();

            if (!$resultado) {
                http_response_code(404);
                echo json_encode(['erro' => 'Checklist não encontrado']);
                exit;
            }

            echo json_encode($resultado);
            break;

        case 'placa':
            if (!isset($_GET['placa'])) {
                http_response_code(400);
                echo json_encode(['erro' => 'Placa não informada']);
                exit;
            }

            $sql = "SELECT * FROM checklist_inspecao WHERE placa = :placa ORDER BY data_realizacao DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['placa' => $_GET['placa']]);
            $resultado = $stmt->fetchAll();

            echo json_encode($resultado);
            break;

        case 'periodo':
            if (!isset($_GET['data_inicio']) || !isset($_GET['data_fim'])) {
                http_response_code(400);
                echo json_encode(['erro' => 'Datas não informadas']);
                exit;
            }

            $sql = "SELECT * FROM checklist_inspecao
                    WHERE data_realizacao BETWEEN :data_inicio AND :data_fim
                    ORDER BY data_realizacao DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'data_inicio' => $_GET['data_inicio'],
                'data_fim' => $_GET['data_fim']
            ]);
            $resultado = $stmt->fetchAll();

            echo json_encode($resultado);
            break;

        case 'todos':
        default:
            $limite = isset($_GET['limite']) ? (int)$_GET['limite'] : 100;

            $sql = "SELECT * FROM checklist_inspecao ORDER BY data_realizacao DESC LIMIT :limite";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
            $stmt->execute();
            $resultado = $stmt->fetchAll();

            echo json_encode($resultado);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao buscar dados',
        'detalhes' => $e->getMessage()
    ]);
}

?>
