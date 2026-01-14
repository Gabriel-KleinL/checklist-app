<?php
// Versão otimizada - SEM fotos para economizar memória
// As fotos podem ser carregadas individualmente em outro endpoint se necessário

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array('erro' => 'Método não permitido. Use GET.'));
    exit;
}

try {
    $inicio = microtime(true);
    error_log("=== INÍCIO BUSCA ANOMALIAS ===");

    $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : 'ativas';
    error_log("Tipo de busca solicitado: " . $tipo);

    // Query otimizada SEM campo foto (fotos base64 consomem muita memória)
    // Total de 602 registros com fotos estava estourando limite de 128MB
    $sql = "SELECT
                i.placa,
                i.id as inspecao_id,
                i.data_realizacao,
                i.km_inicial,
                ii.categoria,
                ii.item,
                ii.status,
                COALESCE(u.nome, 'Usuário não identificado') as usuario_nome,
                ast.status_anomalia,
                ast.data_aprovacao,
                ast.data_finalizacao,
                ast.observacao,
                ast.usuario_aprovador_id,
                COALESCE(u_aprovador.nome, NULL) as usuario_aprovador_nome
            FROM bbb_inspecao_veiculo i
            INNER JOIN bbb_inspecao_item ii ON i.id = ii.inspecao_id
            LEFT JOIN bbb_usuario u ON i.usuario_id = u.id
            LEFT JOIN bbb_anomalia_status ast ON (
                BINARY UPPER(TRIM(ast.placa)) = BINARY UPPER(TRIM(i.placa))
                AND BINARY UPPER(TRIM(ast.categoria)) = BINARY UPPER(TRIM(ii.categoria))
                AND BINARY TRIM(ast.item) = BINARY TRIM(ii.item)
            )
            LEFT JOIN bbb_usuario u_aprovador ON ast.usuario_aprovador_id = u_aprovador.id
            WHERE LOWER(ii.status) NOT IN ('bom', 'ótimo', 'otimo', 'contem', 'contém', 'satisfatória', 'satisfatório', 'satisfatoria', 'satisfatorio')
                AND ii.status IS NOT NULL
                AND ii.status != ''";

    // Filtro por tipo
    if ($tipo === 'finalizadas') {
        $sql .= " AND ast.status_anomalia = 'finalizado'";
    } else {
        // Ativas: pendentes, aprovadas ou sem status (NULL, reprovadas ficam ocultas)
        $sql .= " AND (ast.status_anomalia IS NULL OR ast.status_anomalia IN ('pendente', 'aprovado'))";
    }

    $sql .= " ORDER BY i.placa, i.data_realizacao DESC";

    error_log("Executando query...");
    $stmt = $pdo->prepare($sql);

    if (!$stmt) {
        $errorInfo = $pdo->errorInfo();
        error_log("ERRO NA PREPARAÇÃO DA QUERY:");
        error_log("SQLSTATE: " . $errorInfo[0]);
        error_log("Driver Error Code: " . (isset($errorInfo[1]) ? $errorInfo[1] : 'N/A'));
        error_log("Driver Error Message: " . (isset($errorInfo[2]) ? $errorInfo[2] : 'N/A'));
        throw new PDOException("Erro ao preparar query: " . (isset($errorInfo[2]) ? $errorInfo[2] : 'Erro desconhecido'));
    }

    $stmt->execute();
    $anomalias = $stmt->fetchAll();

    $tempoQuery = microtime(true) - $inicio;
    error_log("Query executada em: " . $tempoQuery . "s - Total registros: " . count($anomalias));

    // Processa resultados de forma eficiente
    $anomaliasPorPlaca = array();
    $indiceProblemas = array();

    foreach ($anomalias as $anomalia) {
        $placa = strtoupper(trim($anomalia['placa']));
        $categoria = strtoupper(trim($anomalia['categoria']));
        $item = trim($anomalia['item']);

        if (!isset($anomaliasPorPlaca[$placa])) {
            $anomaliasPorPlaca[$placa] = array(
                'problemas' => array(),
                'total' => 0,
                'inspecoes' => array()
            );
            $indiceProblemas[$placa] = array();
        }

        $chaveProblema = $placa . '|' . $categoria . '|' . $item;

        if (isset($indiceProblemas[$placa][$chaveProblema])) {
            // Problema já existe, apenas atualiza
            $idx = $indiceProblemas[$placa][$chaveProblema];

            // Adiciona status único
            if (!in_array($anomalia['status'], $anomaliasPorPlaca[$placa]['problemas'][$idx]['statuses'])) {
                $anomaliasPorPlaca[$placa]['problemas'][$idx]['statuses'][] = $anomalia['status'];
            }

            // Adiciona usuário único
            if (!in_array($anomalia['usuario_nome'], $anomaliasPorPlaca[$placa]['problemas'][$idx]['usuarios'])) {
                $anomaliasPorPlaca[$placa]['problemas'][$idx]['usuarios'][] = $anomalia['usuario_nome'];
            }

            // Adiciona inspeção única
            if (!in_array($anomalia['inspecao_id'], $anomaliasPorPlaca[$placa]['problemas'][$idx]['inspecoes_ids'])) {
                $anomaliasPorPlaca[$placa]['problemas'][$idx]['inspecoes_ids'][] = $anomalia['inspecao_id'];
            }

            // Atualiza status_anomalia se presente
            if (!empty($anomalia['status_anomalia'])) {
                if (!in_array($anomalia['status_anomalia'], $anomaliasPorPlaca[$placa]['problemas'][$idx]['status_anomalias'])) {
                    $anomaliasPorPlaca[$placa]['problemas'][$idx]['status_anomalias'][] = $anomalia['status_anomalia'];
                }
            }

            // Atualiza data_aprovacao se presente
            if (!empty($anomalia['data_aprovacao'])) {
                if (!in_array($anomalia['data_aprovacao'], $anomaliasPorPlaca[$placa]['problemas'][$idx]['datas_aprovacao'])) {
                    $anomaliasPorPlaca[$placa]['problemas'][$idx]['datas_aprovacao'][] = $anomalia['data_aprovacao'];
                }
            }

            $anomaliasPorPlaca[$placa]['problemas'][$idx]['total_ocorrencias']++;

        } else {
            // Novo problema
            $novoProblema = array(
                'categoria' => $categoria,
                'item' => $item,
                'statuses' => array($anomalia['status']),
                'foto' => null, // Fotos removidas para economizar memória
                'usuarios' => array($anomalia['usuario_nome']),
                'inspecoes_ids' => array($anomalia['inspecao_id']),
                'total_ocorrencias' => 1,
                'data_realizacao' => $anomalia['data_realizacao'],
                'km_inicial' => $anomalia['km_inicial'],
                'status_anomalias' => !empty($anomalia['status_anomalia']) ? array($anomalia['status_anomalia']) : array(),
                'datas_aprovacao' => !empty($anomalia['data_aprovacao']) ? array($anomalia['data_aprovacao']) : array(),
                'datas_finalizacao' => !empty($anomalia['data_finalizacao']) ? array($anomalia['data_finalizacao']) : array(),
                'observacoes' => !empty($anomalia['observacao']) ? array($anomalia['observacao']) : array(),
                'usuario_aprovador_id' => $anomalia['usuario_aprovador_id'],
                'usuario_aprovador_nome' => $anomalia['usuario_aprovador_nome']
            );

            $anomaliasPorPlaca[$placa]['problemas'][] = $novoProblema;
            $indiceProblemas[$placa][$chaveProblema] = count($anomaliasPorPlaca[$placa]['problemas']) - 1;
        }

        // Adiciona inspeção única à lista geral da placa
        if (!in_array($anomalia['inspecao_id'], $anomaliasPorPlaca[$placa]['inspecoes'])) {
            $anomaliasPorPlaca[$placa]['inspecoes'][] = $anomalia['inspecao_id'];
        }
    }

    // Libera memória da query
    unset($anomalias);
    $stmt = null;

    // Monta resultado final
    $resultado = array();
    foreach ($anomaliasPorPlaca as $placa => $dados) {
        // Verifica se há problemas antes de acessar
        $dataUltimaInspecao = null;
        if (!empty($dados['problemas']) && is_array($dados['problemas']) && isset($dados['problemas'][0])) {
            $dataUltimaInspecao = $dados['problemas'][0]['data_realizacao'];
        }

        $veiculoComAnomalias = array(
            'placa' => $placa,
            'total_problemas' => count($dados['problemas']),
            'total_inspecoes_com_problema' => count($dados['inspecoes']),
            'data_ultima_inspecao' => $dataUltimaInspecao,
            'anomalias' => $dados['problemas']
        );
        $resultado[] = $veiculoComAnomalias;
    }

    // Libera mais memória
    unset($anomaliasPorPlaca);
    unset($indiceProblemas);

    // Ordena por placa
    usort($resultado, function($a, $b) {
        return strcmp($a['placa'], $b['placa']);
    });

    $tempoTotal = microtime(true) - $inicio;
    error_log("Processamento total: " . $tempoTotal . "s");
    error_log("Veículos com anomalias: " . count($resultado));
    error_log("=== FIM BUSCA ANOMALIAS ===");

    http_response_code(200);
    echo json_encode($resultado);

} catch (PDOException $e) {
    error_log("ERRO PDO ANOMALIAS: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(array(
        'erro' => 'Erro ao buscar anomalias',
        'detalhes' => $e->getMessage()
    ));
} catch (Exception $e) {
    error_log("ERRO GERAL ANOMALIAS: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(array(
        'erro' => 'Erro inesperado ao processar anomalias',
        'detalhes' => $e->getMessage()
    ));
}
