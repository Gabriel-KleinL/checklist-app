<?php
/**
 * Migration: Adiciona campo data_realizacao na tabela bbb_inspecao_veiculo
 *
 * Este script:
 * 1. Verifica se a coluna data_realizacao já existe
 * 2. Adiciona a coluna se não existir
 * 3. Popula registros existentes com datas válidas
 * 4. Cria índice para performance
 *
 * Relacionado ao commit: 26fe4db (Adiciona campo 'local' e data de realização)
 */

require_once 'b_veicular_config.php';

echo "=== MIGRATION: Adicionar data_realizacao ===\n\n";

try {
    // 1. Verificar se a coluna já existe
    echo "1. Verificando se coluna data_realizacao existe...\n";
    $checkSql = "SHOW COLUMNS FROM bbb_inspecao_veiculo LIKE 'data_realizacao'";
    $stmt = $pdo->query($checkSql);
    $columnExists = $stmt->fetch();

    if ($columnExists) {
        echo "   ✓ Coluna 'data_realizacao' já existe.\n\n";

        // Verifica se tem valores NULL
        echo "2. Verificando registros com data NULL...\n";
        $nullCheckSql = "SELECT COUNT(*) as total_null
                         FROM bbb_inspecao_veiculo
                         WHERE data_realizacao IS NULL";
        $stmt = $pdo->query($nullCheckSql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result['total_null'] > 0) {
            echo "   ⚠ Encontrados {$result['total_null']} registros com data_realizacao NULL\n";
            echo "   Atualizando registros NULL...\n";

            // Atualiza registros NULL com fallback inteligente
            $updateSql = "UPDATE bbb_inspecao_veiculo
                         SET data_realizacao = CASE
                             WHEN created_at IS NOT NULL THEN created_at
                             WHEN updated_at IS NOT NULL THEN updated_at
                             ELSE NOW()
                         END
                         WHERE data_realizacao IS NULL";
            $pdo->exec($updateSql);

            echo "   ✓ Registros atualizados com sucesso.\n\n";
        } else {
            echo "   ✓ Todos os registros já têm data_realizacao válida.\n\n";
        }

    } else {
        echo "   ✗ Coluna não existe. Criando...\n\n";

        // 2. Adiciona a coluna
        echo "2. Adicionando coluna 'data_realizacao'...\n";
        $alterSql = "ALTER TABLE bbb_inspecao_veiculo
                    ADD COLUMN data_realizacao datetime DEFAULT CURRENT_TIMESTAMP
                    AFTER placa";
        $pdo->exec($alterSql);
        echo "   ✓ Coluna adicionada com sucesso.\n\n";

        // 3. Popula com dados existentes
        echo "3. Populando data_realizacao com dados existentes...\n";

        // Tenta usar created_at se existir, senão usa NOW()
        $checkCreatedAtSql = "SHOW COLUMNS FROM bbb_inspecao_veiculo LIKE 'created_at'";
        $stmt = $pdo->query($checkCreatedAtSql);
        $hasCreatedAt = $stmt->fetch();

        if ($hasCreatedAt) {
            echo "   - Usando campo 'created_at' como base...\n";
            $updateSql = "UPDATE bbb_inspecao_veiculo
                         SET data_realizacao = COALESCE(created_at, NOW())";
        } else {
            echo "   - Campo 'created_at' não existe. Usando NOW()...\n";
            $updateSql = "UPDATE bbb_inspecao_veiculo
                         SET data_realizacao = NOW()";
        }

        $pdo->exec($updateSql);
        echo "   ✓ Dados populados.\n\n";
    }

    // 4. Verificar/criar índice
    echo "4. Verificando índice idx_data...\n";
    $indexCheckSql = "SHOW INDEXES FROM bbb_inspecao_veiculo WHERE Key_name = 'idx_data'";
    $stmt = $pdo->query($indexCheckSql);
    $indexExists = $stmt->fetch();

    if ($indexExists) {
        echo "   ✓ Índice 'idx_data' já existe.\n\n";
    } else {
        echo "   - Criando índice idx_data para melhor performance...\n";
        try {
            $indexSql = "CREATE INDEX idx_data ON bbb_inspecao_veiculo(data_realizacao)";
            $pdo->exec($indexSql);
            echo "   ✓ Índice criado com sucesso.\n\n";
        } catch (PDOException $e) {
            // Ignora erro se índice já existir com nome diferente
            if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "   ✓ Índice já existe (nome diferente).\n\n";
            } else {
                throw $e;
            }
        }
    }

    // 5. Verificação final
    echo "5. Verificação final...\n";
    $verifySql = "SELECT
                    COUNT(*) as total,
                    COUNT(data_realizacao) as com_data,
                    COUNT(*) - COUNT(data_realizacao) as sem_data,
                    MIN(data_realizacao) as data_mais_antiga,
                    MAX(data_realizacao) as data_mais_recente
                  FROM bbb_inspecao_veiculo";
    $stmt = $pdo->query($verifySql);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "   - Total de registros: {$stats['total']}\n";
    echo "   - Com data_realizacao: {$stats['com_data']}\n";
    echo "   - Sem data_realizacao: {$stats['sem_data']}\n";

    if ($stats['total'] > 0) {
        echo "   - Data mais antiga: {$stats['data_mais_antiga']}\n";
        echo "   - Data mais recente: {$stats['data_mais_recente']}\n";
    }
    echo "\n";

    if ($stats['sem_data'] == 0) {
        echo "   ✓ Verificação OK: Todos os registros têm data_realizacao!\n\n";
    } else {
        echo "   ✗ ATENÇÃO: Ainda existem {$stats['sem_data']} registros sem data!\n\n";
    }

    echo "=== MIGRAÇÃO CONCLUÍDA COM SUCESSO ===\n\n";

    // 6. Teste da query do b_veicular_anomalias.php
    echo "6. Testando query que estava falhando...\n";
    $testSql = "SELECT i.placa, i.id, i.data_realizacao, i.km_inicial
                FROM bbb_inspecao_veiculo i
                LIMIT 1";

    try {
        $stmt = $pdo->query($testSql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) {
            echo "   ✓ Query executa corretamente!\n";
            echo "   Exemplo: placa={$result['placa']}, data={$result['data_realizacao']}\n\n";
        } else {
            echo "   ✓ Query OK (sem registros na tabela)\n\n";
        }
    } catch (PDOException $e) {
        echo "   ✗ ERRO: {$e->getMessage()}\n\n";
    }

    echo "PRÓXIMO PASSO: Testar a API\n";
    echo "curl -i \"https://floripa.in9automacao.com.br/b_veicular_anomalias.php?tipo=ativas\"\n\n";

} catch (PDOException $e) {
    echo "\n✗ ERRO NA MIGRAÇÃO:\n";
    echo "Mensagem: " . $e->getMessage() . "\n";
    echo "Código: " . $e->getCode() . "\n\n";

    // Dicas de troubleshooting
    if (strpos($e->getMessage(), 'Access denied') !== false) {
        echo "DICA: Problema de permissão no banco de dados.\n";
        echo "Verifique usuário e senha em b_veicular_config.php\n";
    } elseif (strpos($e->getMessage(), "doesn't exist") !== false) {
        echo "DICA: Tabela não existe.\n";
        echo "Verifique se o banco de dados está corretamente configurado.\n";
    } elseif (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "DICA: Coluna já existe. Isso é normal se você executou a migration antes.\n";
    }

    exit(1);
}
