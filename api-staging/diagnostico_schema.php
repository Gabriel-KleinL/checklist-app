<?php
/**
 * Script de diagnóstico para verificar o schema do banco de dados
 * Verifica se a coluna data_realizacao existe na tabela bbb_inspecao_veiculo
 */

require_once 'hml_veicular_config.php';

echo "=== DIAGNÓSTICO DO SCHEMA ===\n\n";

try {
    // 1. Verificar se coluna data_realizacao existe
    echo "1. Verificando coluna 'data_realizacao'...\n";
    $checkSql = "SHOW COLUMNS FROM bbb_inspecao_veiculo LIKE 'data_realizacao'";
    $stmt = $pdo->query($checkSql);
    $column = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($column) {
        echo "   ✓ COLUNA EXISTE\n";
        echo "   - Tipo: " . $column['Type'] . "\n";
        echo "   - NULL: " . $column['Null'] . "\n";
        echo "   - Default: " . (isset($column['Default']) ? $column['Default'] : 'NULL') . "\n\n";

        // Verificar registros com NULL
        echo "2. Verificando dados na coluna...\n";
        $dataSql = "SELECT
                        COUNT(*) as total,
                        COUNT(data_realizacao) as com_data,
                        COUNT(*) - COUNT(data_realizacao) as sem_data
                    FROM bbb_inspecao_veiculo";
        $stmt = $pdo->query($dataSql);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        echo "   - Total de registros: " . $stats['total'] . "\n";
        echo "   - Com data_realizacao: " . $stats['com_data'] . "\n";
        echo "   - Sem data_realizacao (NULL): " . $stats['sem_data'] . "\n\n";

        if ($stats['sem_data'] > 0) {
            echo "   ⚠ ATENÇÃO: Existem {$stats['sem_data']} registros com data_realizacao NULL\n";
            echo "   Isso pode causar problemas. Considere executar a migration.\n\n";
        } else {
            echo "   ✓ Todos os registros têm data_realizacao válida\n\n";
        }

    } else {
        echo "   ✗ COLUNA NÃO EXISTE\n";
        echo "   Você PRECISA executar a migration!\n\n";
    }

    // 3. Verificar índices
    echo "3. Verificando índices...\n";
    $indexSql = "SHOW INDEXES FROM bbb_inspecao_veiculo WHERE Key_name = 'idx_data'";
    $stmt = $pdo->query($indexSql);
    $index = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($index) {
        echo "   ✓ Índice 'idx_data' existe\n\n";
    } else {
        echo "   ✗ Índice 'idx_data' não existe\n";
        echo "   Isso pode afetar a performance. Considere criar o índice.\n\n";
    }

    // 4. Verificar estrutura completa da tabela
    echo "4. Estrutura completa da tabela bbb_inspecao_veiculo:\n";
    $structSql = "DESCRIBE bbb_inspecao_veiculo";
    $stmt = $pdo->query($structSql);
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "   Colunas encontradas:\n";
    foreach ($columns as $col) {
        echo "   - {$col['Field']} ({$col['Type']})";
        if ($col['Key']) {
            echo " [Chave: {$col['Key']}]";
        }
        echo "\n";
    }
    echo "\n";

    // 5. Testar a query do arquivo b_veicular_anomalias.php
    echo "5. Testando query completa (preview)...\n";
    $testSql = "SELECT i.placa, i.id, i.data_realizacao, i.km_inicial
                FROM bbb_inspecao_veiculo i
                LIMIT 1";

    try {
        $stmt = $pdo->query($testSql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) {
            echo "   ✓ Query executou com sucesso\n";
            echo "   Exemplo de registro:\n";
            foreach ($result as $key => $value) {
                echo "   - {$key}: " . (isset($value) ? $value : 'NULL') . "\n";
            }
        } else {
            echo "   ✓ Query executou mas não retornou registros (tabela vazia)\n";
        }
    } catch (PDOException $e) {
        echo "   ✗ ERRO ao executar query:\n";
        echo "   " . $e->getMessage() . "\n";
        echo "\n   Isso confirma que a coluna data_realizacao não existe!\n";
    }

    echo "\n=== DIAGNÓSTICO CONCLUÍDO ===\n\n";

    // Conclusão
    if (!$column) {
        echo "CONCLUSÃO: Você DEVE executar migration_add_data_realizacao.php\n";
        echo "Execute: php api/migration_add_data_realizacao.php\n";
    } elseif ($stats['sem_data'] > 0) {
        echo "CONCLUSÃO: Coluna existe mas tem dados NULL. Execute a migration para popular.\n";
        echo "Execute: php api/migration_add_data_realizacao.php\n";
    } else {
        echo "CONCLUSÃO: Schema está correto! O erro 500 pode ter outra causa.\n";
        echo "Próximo passo: Verificar logs de erro do PHP.\n";
    }

} catch (PDOException $e) {
    echo "ERRO DE CONEXÃO: " . $e->getMessage() . "\n";
    echo "Verifique as credenciais em hml_veicular_config.php\n";
    exit(1);
}
