<?php
/**
 * Script para popular a tabela bbb_config_itens com dados iniciais
 *
 * IMPORTANTE: Execute este script apenas UMA VEZ para criar os dados iniciais
 *
 * Acesse via navegador: https://floripa.in9automacao.com.br/popular_config_itens.php
 */

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

require_once 'hml_veicular_config.php';

try {
    // Verifica se já existem dados na tabela
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM bbb_config_itens");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result['total'] > 0) {
        echo json_encode([
            'aviso' => 'A tabela já contém dados',
            'total_itens' => $result['total'],
            'mensagem' => 'Se deseja recriar os dados, limpe a tabela manualmente primeiro: TRUNCATE TABLE bbb_config_itens;'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Inicia transação
    $pdo->beginTransaction();

    // Array com todos os itens a serem inseridos
    $itens = [
        // MOTOR
        ['categoria' => 'MOTOR', 'nome_item' => 'Água Radiador'],
        ['categoria' => 'MOTOR', 'nome_item' => 'Água Limpador Parabrisa'],
        ['categoria' => 'MOTOR', 'nome_item' => 'Fluido de Freio'],
        ['categoria' => 'MOTOR', 'nome_item' => 'Nível de Óleo'],
        ['categoria' => 'MOTOR', 'nome_item' => 'Tampa do Radiador'],
        ['categoria' => 'MOTOR', 'nome_item' => 'Freio de Mão'],

        // ELETRICO
        ['categoria' => 'ELETRICO', 'nome_item' => 'Seta Esquerda'],
        ['categoria' => 'ELETRICO', 'nome_item' => 'Seta Direita'],
        ['categoria' => 'ELETRICO', 'nome_item' => 'Pisca Alerta'],
        ['categoria' => 'ELETRICO', 'nome_item' => 'Farol'],

        // LIMPEZA
        ['categoria' => 'LIMPEZA', 'nome_item' => 'Limpeza Interna'],
        ['categoria' => 'LIMPEZA', 'nome_item' => 'Limpeza Externa'],

        // FERRAMENTA
        ['categoria' => 'FERRAMENTA', 'nome_item' => 'Macaco'],
        ['categoria' => 'FERRAMENTA', 'nome_item' => 'Chave de Roda'],
        ['categoria' => 'FERRAMENTA', 'nome_item' => 'Chave do Estepe'],
        ['categoria' => 'FERRAMENTA', 'nome_item' => 'Triângulo'],

        // PNEU
        ['categoria' => 'PNEU', 'nome_item' => 'Dianteira Direita'],
        ['categoria' => 'PNEU', 'nome_item' => 'Dianteira Esquerda'],
        ['categoria' => 'PNEU', 'nome_item' => 'Traseira Direita'],
        ['categoria' => 'PNEU', 'nome_item' => 'Traseira Esquerda'],
        ['categoria' => 'PNEU', 'nome_item' => 'Estepe']
    ];

    // Prepara o SQL de inserção
    $sql = "INSERT INTO bbb_config_itens (categoria, nome_item, habilitado, usuario_id, usuario_nome)
            VALUES (:categoria, :nome_item, 1, NULL, NULL)";

    $stmt = $pdo->prepare($sql);

    // Insere cada item
    $count = 0;
    foreach ($itens as $item) {
        $stmt->execute([
            'categoria' => $item['categoria'],
            'nome_item' => $item['nome_item']
        ]);
        $count++;
    }

    // Confirma a transação
    $pdo->commit();

    // Busca estatísticas por categoria
    $stmt = $pdo->query("
        SELECT
            categoria,
            COUNT(*) as total_itens,
            SUM(CASE WHEN habilitado = 1 THEN 1 ELSE 0 END) as itens_habilitados
        FROM bbb_config_itens
        GROUP BY categoria
        ORDER BY categoria
    ");
    $estatisticas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Retorna sucesso
    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Dados iniciais criados com sucesso!',
        'total_inserido' => $count,
        'estatisticas' => $estatisticas
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    // Em caso de erro, desfaz a transação
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'erro' => 'Erro ao inserir dados',
        'detalhes' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>
