<?php
/**
 * Script para criar e popular tabela bbb_config_itens_completo
 * Execute via navegador ou linha de comando
 */

header('Content-Type: application/json; charset=utf-8');

require_once 'b_veicular_config.php';

try {
    echo json_encode(['status' => 'iniciando', 'mensagem' => 'Criando tabela...']) . "\n";

    // Criar tabela
    $sql_create = "CREATE TABLE IF NOT EXISTS bbb_config_itens_completo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        categoria VARCHAR(50) NOT NULL,
        nome_item VARCHAR(100) NOT NULL,
        habilitado TINYINT(1) DEFAULT 1,
        usuario_id INT DEFAULT NULL,
        usuario_nome VARCHAR(100) DEFAULT NULL,
        UNIQUE KEY unique_item (categoria, nome_item),
        INDEX idx_categoria (categoria),
        INDEX idx_habilitado (habilitado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql_create);
    echo json_encode(['status' => 'sucesso', 'mensagem' => 'Tabela criada/verificada']) . "\n";

    // Verificar se já tem dados
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM bbb_config_itens_completo");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result['total'] > 0) {
        echo json_encode([
            'status' => 'aviso',
            'mensagem' => 'Tabela já contém ' . $result['total'] . ' itens. Para recriar, execute: TRUNCATE TABLE bbb_config_itens_completo;'
        ]) . "\n";
        exit;
    }

    // Array com todos os itens
    $itens = [
        // PARTE 1: INTERNA
        ['PARTE1_INTERNA', 'Buzina'],
        ['PARTE1_INTERNA', 'Cinto de Segurança Dianteiro'],
        ['PARTE1_INTERNA', 'Cinto de Segurança Traseiro'],
        ['PARTE1_INTERNA', 'Espelho Retrovisor Interno'],
        ['PARTE1_INTERNA', 'Freio de Mão'],
        ['PARTE1_INTERNA', 'Limpador de Parabrisa'],
        ['PARTE1_INTERNA', 'Para-Sol'],
        ['PARTE1_INTERNA', 'Velocímetro'],
        ['PARTE1_INTERNA', 'Luz do Painel'],
        ['PARTE1_INTERNA', 'Luz Interna'],
        ['PARTE1_INTERNA', 'Alça de Transporte'],
        ['PARTE1_INTERNA', 'Estado de Conservação Interna'],

        // PARTE 2: EQUIPAMENTOS
        ['PARTE2_EQUIPAMENTOS', 'Espelho Retrovisor Externo Direito'],
        ['PARTE2_EQUIPAMENTOS', 'Espelho Retrovisor Externo Esquerdo'],
        ['PARTE2_EQUIPAMENTOS', 'Extintor'],
        ['PARTE2_EQUIPAMENTOS', 'Chave de Roda'],
        ['PARTE2_EQUIPAMENTOS', 'Macaco'],
        ['PARTE2_EQUIPAMENTOS', 'Triângulo'],
        ['PARTE2_EQUIPAMENTOS', 'Pneu Sobressalente'],

        // PARTE 3: DIANTEIRA
        ['PARTE3_DIANTEIRA', 'Farolete Dianteiro Direito'],
        ['PARTE3_DIANTEIRA', 'Farolete Dianteiro Esquerdo'],
        ['PARTE3_DIANTEIRA', 'Farol Alto Direito'],
        ['PARTE3_DIANTEIRA', 'Farol Baixo Direito'],
        ['PARTE3_DIANTEIRA', 'Farol Alto Esquerdo'],
        ['PARTE3_DIANTEIRA', 'Farol Baixo Esquerdo'],
        ['PARTE3_DIANTEIRA', 'Seta Dianteira Direita'],
        ['PARTE3_DIANTEIRA', 'Seta Dianteira Esquerda'],
        ['PARTE3_DIANTEIRA', 'Pneu Dianteiro Direito'],
        ['PARTE3_DIANTEIRA', 'Parafusos Pneu Dianteiro Direito'],
        ['PARTE3_DIANTEIRA', 'Pneu Dianteiro Esquerdo'],
        ['PARTE3_DIANTEIRA', 'Parafusos Pneu Dianteiro Esquerdo'],
        ['PARTE3_DIANTEIRA', 'Para-choque Dianteiro'],

        // PARTE 4: TRASEIRA
        ['PARTE4_TRASEIRA', 'Lanterna Traseira Direita'],
        ['PARTE4_TRASEIRA', 'Lanterna Traseira Esquerda'],
        ['PARTE4_TRASEIRA', 'Lanterna Marcha Ré Direita'],
        ['PARTE4_TRASEIRA', 'Lanterna Marcha Ré Esquerda'],
        ['PARTE4_TRASEIRA', 'Iluminação Placa Traseira'],
        ['PARTE4_TRASEIRA', 'Seta Traseira Direita'],
        ['PARTE4_TRASEIRA', 'Seta Traseira Esquerda'],
        ['PARTE4_TRASEIRA', 'Luz Indicadora de Parada'],
        ['PARTE4_TRASEIRA', 'Alerta'],
        ['PARTE4_TRASEIRA', 'Para-choque Traseiro'],
        ['PARTE4_TRASEIRA', 'Lacre da Placa'],
        ['PARTE4_TRASEIRA', 'Pneu Traseiro Direito'],
        ['PARTE4_TRASEIRA', 'Parafusos Pneu Traseiro Direito'],
        ['PARTE4_TRASEIRA', 'Pneu Traseiro Esquerdo'],
        ['PARTE4_TRASEIRA', 'Parafusos Pneu Traseiro Esquerdo'],
        ['PARTE4_TRASEIRA', 'Protetores de Rodas Traseiras'],
        ['PARTE4_TRASEIRA', 'Estado da Carroceria'],
        ['PARTE4_TRASEIRA', 'Silencioso'],
        ['PARTE4_TRASEIRA', 'Corrosão Lataria'],
        ['PARTE4_TRASEIRA', 'Corrosão Fundo'],
        ['PARTE4_TRASEIRA', 'Freios de Estacionamento'],
        ['PARTE4_TRASEIRA', 'Logomarca'],
        ['PARTE4_TRASEIRA', 'Vazamentos'],

        // PARTE 5: ESPECIAL
        ['PARTE5_ESPECIAL', 'Certificado CETURB'],
        ['PARTE5_ESPECIAL', 'Fumaça Preta'],
        ['PARTE5_ESPECIAL', 'Corrosão Cavalo'],
        ['PARTE5_ESPECIAL', 'Corrosão Carroceria'],
        ['PARTE5_ESPECIAL', 'Corrosão Carreta'],
        ['PARTE5_ESPECIAL', 'Alça Eixo Cardan'],
        ['PARTE5_ESPECIAL', 'Protetores Rodas Traseiras'],
        ['PARTE5_ESPECIAL', 'Freio de Marcha'],
        ['PARTE5_ESPECIAL', 'Alarme Sonoro de Ré'],
        ['PARTE5_ESPECIAL', 'Enlonamento'],
        ['PARTE5_ESPECIAL', 'Bomba de Recalque'],
        ['PARTE5_ESPECIAL', 'Adesivos Refletores'],
        ['PARTE5_ESPECIAL', 'Altura Para-choque'],
        ['PARTE5_ESPECIAL', 'Estado das Mangueiras']
    ];

    // Iniciar transação
    $pdo->beginTransaction();

    // Preparar SQL de inserção
    $sql_insert = "INSERT INTO bbb_config_itens_completo (categoria, nome_item, habilitado) VALUES (?, ?, 1)";
    $stmt = $pdo->prepare($sql_insert);

    // Inserir cada item
    $count = 0;
    foreach ($itens as $item) {
        try {
            $stmt->execute([$item[0], $item[1]]);
            $count++;
        } catch (PDOException $e) {
            // Ignorar erro de duplicata
            if (strpos($e->getMessage(), 'Duplicate entry') === false) {
                throw $e;
            }
        }
    }

    // Commit
    $pdo->commit();

    // Buscar estatísticas
    $stmt = $pdo->query("
        SELECT
            categoria,
            COUNT(*) as total,
            SUM(CASE WHEN habilitado = 1 THEN 1 ELSE 0 END) as habilitados
        FROM bbb_config_itens_completo
        GROUP BY categoria
        ORDER BY categoria
    ");
    $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Resultado final
    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Instalação concluída!',
        'itens_inseridos' => $count,
        'estatisticas' => $stats
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro no banco de dados',
        'detalhes' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro geral',
        'detalhes' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}
?>
