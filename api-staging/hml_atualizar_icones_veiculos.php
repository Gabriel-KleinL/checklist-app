<?php
/**
 * Script para atualizar os ícones dos tipos de veículos (HOMOLOGAÇÃO)
 * Execute via navegador: https://floripa.in9automacao.com.br/hml_atualizar_icones_veiculos.php
 */

header('Content-Type: application/json; charset=utf-8');

require_once 'hml_veicular_config.php';

try {
    $pdo->beginTransaction();
    
    // Atualizar ícones para versões que existem no Ionicons
    $atualizacoes = [
        ['id' => 2, 'icone' => 'bicycle-outline'], // Moto
        ['id' => 3, 'icone' => 'cube-outline'],    // Caminhão
        ['id' => 4, 'icone' => 'bus-outline'],     // Ônibus (já está correto)
        ['id' => 5, 'icone' => 'car-outline'],     // Van
        ['id' => 6, 'icone' => 'car-outline']      // Caminhonete
    ];
    
    $atualizados = 0;
    
    foreach ($atualizacoes as $atualizacao) {
        $sql = "UPDATE `bbb_tipos_veiculo` SET `icone` = :icone WHERE `id` = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $atualizacao['id'],
            'icone' => $atualizacao['icone']
        ]);
        
        if ($stmt->rowCount() > 0) {
            $atualizados++;
        }
    }
    
    $pdo->commit();
    
    // Buscar todos os tipos atualizados
    $stmt = $pdo->query("SELECT * FROM bbb_tipos_veiculo ORDER BY id ASC");
    $todosTipos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => "$atualizados tipos de veículos atualizados",
        'atualizados' => $atualizados,
        'total_tipos' => count($todosTipos),
        'tipos' => $todosTipos
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro no banco de dados',
        'detalhes' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro geral',
        'detalhes' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
