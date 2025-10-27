<?php

require_once 'veicular_config.php';

// Já está sendo tratado no veicular_config.php, mas garantindo aqui também
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

$json = file_get_contents('php://input');
$dados = json_decode($json, true);

// Log para debug
error_log("=== REQUISIÇÃO RECEBIDA ===");
error_log("Método: " . $_SERVER['REQUEST_METHOD']);
error_log("User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'N/A'));
error_log("IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A'));
error_log("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'N/A'));
error_log("Content-Length: " . ($_SERVER['CONTENT_LENGTH'] ?? 'N/A'));
error_log("Raw JSON: " . $json);
error_log("Dados decodificados: " . print_r($dados, true));

if (!$dados) {
    http_response_code(400);
    echo json_encode(['erro' => 'Dados inválidos']);
    exit;
}

try {
    // Log específico dos campos problemáticos
    error_log("motor_agua_radiador: " . ($dados['motor_agua_radiador'] ?? 'NÃO ENVIADO'));
    error_log("motor_agua_parabrisa: " . ($dados['motor_agua_parabrisa'] ?? 'NÃO ENVIADO'));
    error_log("motor_tampa_reservatorio: " . ($dados['motor_tampa_reservatorio'] ?? 'NÃO ENVIADO'));
    error_log("foto_frontal: " . ($dados['foto_frontal'] ?? 'NÃO ENVIADO'));
    error_log("foto_traseira: " . ($dados['foto_traseira'] ?? 'NÃO ENVIADO'));
    error_log("foto_lateral_direita: " . ($dados['foto_lateral_direita'] ?? 'NÃO ENVIADO'));
    error_log("foto_lateral_esquerda: " . ($dados['foto_lateral_esquerda'] ?? 'NÃO ENVIADO'));

    $sql = "INSERT INTO checklist_inspecao (
        placa, km_inicial, nivel_combustivel,
        foto_km_inicial, foto_combustivel, foto_painel,
        motor_agua_radiador, motor_agua_radiador_foto,
        motor_agua_parabrisa, motor_agua_parabrisa_foto,
        motor_fluido_freio, motor_fluido_freio_foto,
        motor_nivel_oleo, motor_nivel_oleo_foto,
        motor_tampa_reservatorio, motor_tampa_reservatorio_foto,
        motor_tampa_radiador, motor_tampa_radiador_foto,
        limpeza_interna, limpeza_interna_foto,
        limpeza_externa, limpeza_externa_foto,
        foto_frontal, foto_traseira, foto_lateral_direita, foto_lateral_esquerda,
        pneu_dianteira_direita, pneu_dianteira_direita_foto,
        pneu_dianteira_esquerda, pneu_dianteira_esquerda_foto,
        pneu_traseira_direita, pneu_traseira_direita_foto,
        pneu_traseira_esquerda, pneu_traseira_esquerda_foto,
        pneu_estepe, pneu_estepe_foto
    ) VALUES (
        :placa, :km_inicial, :nivel_combustivel,
        :foto_km_inicial, :foto_combustivel, :foto_painel,
        :motor_agua_radiador, :motor_agua_radiador_foto,
        :motor_agua_parabrisa, :motor_agua_parabrisa_foto,
        :motor_fluido_freio, :motor_fluido_freio_foto,
        :motor_nivel_oleo, :motor_nivel_oleo_foto,
        :motor_tampa_reservatorio, :motor_tampa_reservatorio_foto,
        :motor_tampa_radiador, :motor_tampa_radiador_foto,
        :limpeza_interna, :limpeza_interna_foto,
        :limpeza_externa, :limpeza_externa_foto,
        :foto_frontal, :foto_traseira, :foto_lateral_direita, :foto_lateral_esquerda,
        :pneu_dianteira_direita, :pneu_dianteira_direita_foto,
        :pneu_dianteira_esquerda, :pneu_dianteira_esquerda_foto,
        :pneu_traseira_direita, :pneu_traseira_direita_foto,
        :pneu_traseira_esquerda, :pneu_traseira_esquerda_foto,
        :pneu_estepe, :pneu_estepe_foto
    )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($dados);

    $id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Checklist salvo com sucesso',
        'id' => $id
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao salvar checklist',
        'detalhes' => $e->getMessage()
    ]);
}

?>
