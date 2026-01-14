<?php
/**
 * Router para servidor PHP built-in
 * 
 * Este arquivo permite que o servidor PHP built-in (php -S)
 * roteie corretamente as requisições para os arquivos PHP
 * na pasta api/
 */

// Caminho do arquivo solicitado
$requestUri = $_SERVER['REQUEST_URI'];
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// Remove query string para comparação
$requestPath = strtok($requestPath, '?');

// Remove a barra inicial
$requestPath = ltrim($requestPath, '/');

// Se o caminho começa com 'api/', remove o prefixo
if (strpos($requestPath, 'api/') === 0) {
    $requestPath = substr($requestPath, 4);
}

// Se o arquivo existe diretamente, serve
$filePath = __DIR__ . '/' . $requestPath;
if (file_exists($filePath) && is_file($filePath)) {
    return false; // Serve o arquivo normalmente
}

// Se for um arquivo PHP, tenta encontrar pelo nome (sem caminho)
if (pathinfo($requestPath, PATHINFO_EXTENSION) === 'php') {
    $phpFileName = basename($requestPath);
    $phpFile = __DIR__ . '/' . $phpFileName;
    if (file_exists($phpFile)) {
        // Serve o arquivo diretamente
        return false;
    }
}

// Se não encontrou nada, retorna 404
http_response_code(404);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
echo json_encode(['erro' => 'Arquivo não encontrado: ' . $requestPath]);
return true;
