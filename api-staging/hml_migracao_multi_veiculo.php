<?php
/**
 * Script de Migração: Sistema Multi-Veículos
 * 
 * Este script deve ser executado UMA VEZ para migrar o banco de dados
 * para suportar múltiplos tipos de veículos.
 * 
 * Execute via navegador: https://floripa.in9automacao.com.br/migracao_multi_veiculo.php
 * OU via linha de comando: php migracao_multi_veiculo.php
 */

header('Content-Type: application/json; charset=utf-8');

require_once 'hml_veicular_config.php';

try {
    $pdo->beginTransaction();
    
    $resultados = [];
    
    // ============================================
    // 1. CRIAR TABELA bbb_tipos_veiculo
    // ============================================
    $sql1 = "CREATE TABLE IF NOT EXISTS `bbb_tipos_veiculo` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `nome` VARCHAR(50) NOT NULL,
        `descricao` TEXT DEFAULT NULL,
        `ativo` TINYINT(1) DEFAULT 1,
        `icone` VARCHAR(50) DEFAULT NULL,
        `data_criacao` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `usuario_id` INT DEFAULT NULL,
        UNIQUE KEY `uk_nome` (`nome`),
        INDEX `idx_ativo` (`ativo`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql1);
    $resultados[] = ['status' => 'sucesso', 'mensagem' => 'Tabela bbb_tipos_veiculo criada/verificada'];
    
    // ============================================
    // 2. CRIAR TABELA bbb_config_itens_tipos_veiculo
    // ============================================
    $sql2 = "CREATE TABLE IF NOT EXISTS `bbb_config_itens_tipos_veiculo` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `config_item_id` INT NOT NULL,
        `tipo_veiculo_id` INT NOT NULL,
        UNIQUE KEY `uk_item_tipo` (`config_item_id`, `tipo_veiculo_id`),
        INDEX `idx_config_item` (`config_item_id`),
        INDEX `idx_tipo_veiculo` (`tipo_veiculo_id`),
        FOREIGN KEY (`config_item_id`) REFERENCES `bbb_config_itens` (`id`) ON DELETE CASCADE,
        FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `bbb_tipos_veiculo` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql2);
    $resultados[] = ['status' => 'sucesso', 'mensagem' => 'Tabela bbb_config_itens_tipos_veiculo criada/verificada'];
    
    // ============================================
    // 3. CRIAR TABELA bbb_config_itens_completo_tipos_veiculo
    // ============================================
    $sql3 = "CREATE TABLE IF NOT EXISTS `bbb_config_itens_completo_tipos_veiculo` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `config_item_completo_id` INT NOT NULL,
        `tipo_veiculo_id` INT NOT NULL,
        UNIQUE KEY `uk_item_tipo` (`config_item_completo_id`, `tipo_veiculo_id`),
        INDEX `idx_config_item` (`config_item_completo_id`),
        INDEX `idx_tipo_veiculo` (`tipo_veiculo_id`),
        FOREIGN KEY (`config_item_completo_id`) REFERENCES `bbb_config_itens_completo` (`id`) ON DELETE CASCADE,
        FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `bbb_tipos_veiculo` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql3);
    $resultados[] = ['status' => 'sucesso', 'mensagem' => 'Tabela bbb_config_itens_completo_tipos_veiculo criada/verificada'];
    
    // ============================================
    // 4. ADICIONAR COLUNA tipo_veiculo_id em bbb_config_itens
    // ============================================
    try {
        $sql4 = "ALTER TABLE `bbb_config_itens` 
                 ADD COLUMN `tipo_veiculo_id` INT DEFAULT NULL,
                 ADD INDEX `idx_tipo_veiculo` (`tipo_veiculo_id`),
                 ADD FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `bbb_tipos_veiculo` (`id`) ON DELETE SET NULL";
        $pdo->exec($sql4);
        $resultados[] = ['status' => 'sucesso', 'mensagem' => 'Coluna tipo_veiculo_id adicionada em bbb_config_itens'];
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            $resultados[] = ['status' => 'aviso', 'mensagem' => 'Coluna tipo_veiculo_id já existe em bbb_config_itens'];
        } else {
            throw $e;
        }
    }
    
    // ============================================
    // 5. ADICIONAR COLUNA tipo_veiculo_id em bbb_config_itens_completo
    // ============================================
    try {
        $sql5 = "ALTER TABLE `bbb_config_itens_completo` 
                 ADD COLUMN `tipo_veiculo_id` INT DEFAULT NULL,
                 ADD INDEX `idx_tipo_veiculo` (`tipo_veiculo_id`),
                 ADD FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `bbb_tipos_veiculo` (`id`) ON DELETE SET NULL";
        $pdo->exec($sql5);
        $resultados[] = ['status' => 'sucesso', 'mensagem' => 'Coluna tipo_veiculo_id adicionada em bbb_config_itens_completo'];
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            $resultados[] = ['status' => 'aviso', 'mensagem' => 'Coluna tipo_veiculo_id já existe em bbb_config_itens_completo'];
        } else {
            throw $e;
        }
    }
    
    // ============================================
    // 6. ADICIONAR COLUNA tipo_veiculo_id em bbb_inspecao_veiculo
    // ============================================
    try {
        $sql6 = "ALTER TABLE `bbb_inspecao_veiculo` 
                 ADD COLUMN `tipo_veiculo_id` INT DEFAULT NULL,
                 ADD INDEX `idx_tipo_veiculo` (`tipo_veiculo_id`),
                 ADD FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `bbb_tipos_veiculo` (`id`) ON DELETE RESTRICT";
        $pdo->exec($sql6);
        $resultados[] = ['status' => 'sucesso', 'mensagem' => 'Coluna tipo_veiculo_id adicionada em bbb_inspecao_veiculo'];
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            $resultados[] = ['status' => 'aviso', 'mensagem' => 'Coluna tipo_veiculo_id já existe em bbb_inspecao_veiculo'];
        } else {
            throw $e;
        }
    }
    
    // ============================================
    // 7. ADICIONAR COLUNA tipo_veiculo_id em checklist_bbb_checklist_completo
    // ============================================
    try {
        $sql7 = "ALTER TABLE `checklist_bbb_checklist_completo` 
                 ADD COLUMN `tipo_veiculo_id` INT DEFAULT NULL,
                 ADD INDEX `idx_tipo_veiculo` (`tipo_veiculo_id`),
                 ADD FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `bbb_tipos_veiculo` (`id`) ON DELETE RESTRICT";
        $pdo->exec($sql7);
        $resultados[] = ['status' => 'sucesso', 'mensagem' => 'Coluna tipo_veiculo_id adicionada em checklist_bbb_checklist_completo'];
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            $resultados[] = ['status' => 'aviso', 'mensagem' => 'Coluna tipo_veiculo_id já existe em checklist_bbb_checklist_completo'];
        } else {
            throw $e;
        }
    }
    
    // ============================================
    // 8. CRIAR TIPO PADRÃO "Carro" (ID 1)
    // ============================================
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bbb_tipos_veiculo WHERE id = 1");
    $stmt->execute();
    $existe = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existe['total'] == 0) {
        $sql8 = "INSERT INTO `bbb_tipos_veiculo` (`id`, `nome`, `descricao`, `ativo`, `icone`) 
                 VALUES (1, 'Carro', 'Veículo automotivo de passeio', 1, 'car-outline')";
        $pdo->exec($sql8);
        $resultados[] = ['status' => 'sucesso', 'mensagem' => 'Tipo padrão "Carro" criado (ID 1)'];
    } else {
        $resultados[] = ['status' => 'aviso', 'mensagem' => 'Tipo "Carro" já existe'];
    }
    
    // ============================================
    // 9. ATUALIZAR bbb_config_itens (assumir que itens existentes são de carro)
    // ============================================
    $sql9 = "UPDATE `bbb_config_itens` SET `tipo_veiculo_id` = 1 WHERE `tipo_veiculo_id` IS NULL";
    $stmt = $pdo->prepare($sql9);
    $stmt->execute();
    $linhas = $stmt->rowCount();
    $resultados[] = ['status' => 'sucesso', 'mensagem' => "Atualizados $linhas itens em bbb_config_itens para tipo Carro"];
    
    // ============================================
    // 10. ATUALIZAR bbb_config_itens_completo
    // ============================================
    $sql10 = "UPDATE `bbb_config_itens_completo` SET `tipo_veiculo_id` = 1 WHERE `tipo_veiculo_id` IS NULL";
    $stmt = $pdo->prepare($sql10);
    $stmt->execute();
    $linhas = $stmt->rowCount();
    $resultados[] = ['status' => 'sucesso', 'mensagem' => "Atualizados $linhas itens em bbb_config_itens_completo para tipo Carro"];
    
    // ============================================
    // 11. ATUALIZAR bbb_inspecao_veiculo (checklists existentes são de carro)
    // ============================================
    $sql11 = "UPDATE `bbb_inspecao_veiculo` SET `tipo_veiculo_id` = 1 WHERE `tipo_veiculo_id` IS NULL";
    $stmt = $pdo->prepare($sql11);
    $stmt->execute();
    $linhas = $stmt->rowCount();
    $resultados[] = ['status' => 'sucesso', 'mensagem' => "Atualizados $linhas checklists em bbb_inspecao_veiculo para tipo Carro"];
    
    // ============================================
    // 12. ATUALIZAR checklist_bbb_checklist_completo
    // ============================================
    $sql12 = "UPDATE `checklist_bbb_checklist_completo` SET `tipo_veiculo_id` = 1 WHERE `tipo_veiculo_id` IS NULL";
    $stmt = $pdo->prepare($sql12);
    $stmt->execute();
    $linhas = $stmt->rowCount();
    $resultados[] = ['status' => 'sucesso', 'mensagem' => "Atualizados $linhas checklists completos para tipo Carro"];
    
    // ============================================
    // 13. ALTERAR COLUNAS PARA NOT NULL (após popular dados)
    // ============================================
    try {
        $sql13 = "ALTER TABLE `bbb_inspecao_veiculo` MODIFY COLUMN `tipo_veiculo_id` INT NOT NULL";
        $pdo->exec($sql13);
        $resultados[] = ['status' => 'sucesso', 'mensagem' => 'Coluna tipo_veiculo_id em bbb_inspecao_veiculo alterada para NOT NULL'];
    } catch (PDOException $e) {
        $resultados[] = ['status' => 'aviso', 'mensagem' => 'Não foi possível alterar para NOT NULL: ' . $e->getMessage()];
    }
    
    try {
        $sql14 = "ALTER TABLE `checklist_bbb_checklist_completo` MODIFY COLUMN `tipo_veiculo_id` INT NOT NULL";
        $pdo->exec($sql14);
        $resultados[] = ['status' => 'sucesso', 'mensagem' => 'Coluna tipo_veiculo_id em checklist_bbb_checklist_completo alterada para NOT NULL'];
    } catch (PDOException $e) {
        $resultados[] = ['status' => 'aviso', 'mensagem' => 'Não foi possível alterar para NOT NULL: ' . $e->getMessage()];
    }
    
    $pdo->commit();
    
    // Resultado final
    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Migração concluída com sucesso!',
        'resultados' => $resultados
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro no banco de dados durante migração',
        'detalhes' => $e->getMessage(),
        'arquivo' => $e->getFile(),
        'linha' => $e->getLine()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro geral durante migração',
        'detalhes' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
