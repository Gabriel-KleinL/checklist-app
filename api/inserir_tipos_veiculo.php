<?php
/**
 * Script para inserir tipos de veículos de exemplo
 * Execute via navegador: https://floripa.in9automacao.com.br/inserir_tipos_veiculo.php
 */

header('Content-Type: application/json; charset=utf-8');

require_once 'b_veicular_config.php';

try {
    $pdo->beginTransaction();
    
    $tipos = [
        ['id' => 2, 'nome' => 'Moto', 'descricao' => 'Motocicleta ou motoneta', 'icone' => 'bicycle-outline'],
        ['id' => 3, 'nome' => 'Caminhão', 'descricao' => 'Veículo de carga pesada', 'icone' => 'cube-outline'],
        ['id' => 4, 'nome' => 'Ônibus', 'descricao' => 'Veículo de transporte coletivo', 'icone' => 'bus-outline'],
        ['id' => 5, 'nome' => 'Van', 'descricao' => 'Van ou utilitário', 'icone' => 'car-outline'],
        ['id' => 6, 'nome' => 'Caminhonete', 'descricao' => 'Pick-up ou caminhonete', 'icone' => 'car-outline']
    ];
    
    $inseridos = 0;
    $jaExistentes = 0;
    
    foreach ($tipos as $tipo) {
        // Verificar se já existe
        $stmt = $pdo->prepare("SELECT id FROM checklist_tipos_veiculo WHERE id = :id OR nome = :nome LIMIT 1");
        $stmt->execute(['id' => $tipo['id'], 'nome' => $tipo['nome']]);
        $existe = $stmt->fetch();
        
        if (!$existe) {
            $sql = "INSERT INTO `checklist_tipos_veiculo` (`id`, `nome`, `descricao`, `ativo`, `icone`, `usuario_id`) 
                    VALUES (:id, :nome, :descricao, 1, :icone, 1)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'id' => $tipo['id'],
                'nome' => $tipo['nome'],
                'descricao' => $tipo['descricao'],
                'icone' => $tipo['icone']
            ]);
            $inseridos++;
        } else {
            $jaExistentes++;
        }
    }
    
    $pdo->commit();
    
    // Buscar todos os tipos
    $stmt = $pdo->query("SELECT * FROM checklist_tipos_veiculo ORDER BY id ASC");
    $todosTipos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => "Tipos de veículos processados: $inseridos inseridos, $jaExistentes já existiam",
        'inseridos' => $inseridos,
        'ja_existentes' => $jaExistentes,
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
