<?php
// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Responde requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once 'hml_veicular_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array('erro' => 'Método não permitido. Use GET.'));
    exit;
}

try {
    // Pega o termo de busca (opcional)
    $termo = isset($_GET['termo']) ? trim($_GET['termo']) : '';
    $limite = isset($_GET['limite']) ? intval($_GET['limite']) : 20;

    // Query base
    $sql = "SELECT DISTINCT LicensePlate as placa
            FROM Vehicles
            WHERE LicensePlate IS NOT NULL
            AND LicensePlate != ''";

    $params = [];

    // Adiciona filtro se houver termo de busca
    if (!empty($termo)) {
        $sql .= " AND UPPER(LicensePlate) LIKE UPPER(:termo)";
        $params['termo'] = '%' . $termo . '%';
    }

    $sql .= " ORDER BY LicensePlate ASC LIMIT :limite";

    $stmt = $pdo->prepare($sql);

    // Bind dos parâmetros
    if (!empty($termo)) {
        $stmt->bindValue(':termo', '%' . $termo . '%', PDO::PARAM_STR);
    }
    $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);

    $stmt->execute();
    $placas = $stmt->fetchAll(PDO::FETCH_COLUMN);

    http_response_code(200);
    echo json_encode([
        'sucesso' => true,
        'total' => count($placas),
        'placas' => $placas
    ]);

} catch (PDOException $e) {
    error_log("ERRO BUSCAR PLACAS: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao buscar placas',
        'detalhes' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("ERRO GERAL BUSCAR PLACAS: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro inesperado ao buscar placas',
        'detalhes' => $e->getMessage()
    ]);
}
