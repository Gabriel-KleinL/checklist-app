<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Log da requisição
error_log("=== TESTE DE CONEXÃO ===");
error_log("Método: " . $_SERVER['REQUEST_METHOD']);
error_log("User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'N/A'));
error_log("IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A'));
error_log("Headers: " . print_r(getallheaders(), true));

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$response = [
    'status' => 'success',
    'message' => 'Conexão funcionando',
    'timestamp' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'N/A',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'N/A'
];

echo json_encode($response);
?>
