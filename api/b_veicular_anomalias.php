<?php
// Headers CORS - DEVE VIR ANTES DE QUALQUER SAÍDA
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Responde requisições OPTIONS (preflight) IMEDIATAMENTE
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once 'b_veicular_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array('erro' => 'Método não permitido. Use GET.'));
    exit;
}

try {
    $inicio = microtime(true);
    error_log("=== INÍCIO BUSCA ANOMALIAS ===");

    // Determina o tipo de busca
    $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : 'ativas'; // 'ativas' ou 'finalizadas'

    // Busca todas as inspeções com itens que têm problemas
    $sql = "SELECT
                i.placa,
                i.id as inspecao_id,
                i.data_realizacao,
                i.km_inicial,
                ii.categoria,
                ii.item,
                ii.status,
                ii.foto,
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

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $anomalias = $stmt->fetchAll();

    $tempoQuery = microtime(true) - $inicio;
    error_log("Query executada em: " . $tempoQuery . "s - Total registros: " . count($anomalias));

    // OTIMIZAÇÃO: Usa array associativo em vez de loop dentro de loop
    $anomaliasPorPlaca = array();
    $indiceProblemas = array(); // Índice para acesso O(1) em vez de O(n)

    foreach ($anomalias as $anomalia) {
        // Normaliza placa (já vem normalizada do SQL, mas garante)
        $placa = strtoupper(trim($anomalia['placa']));
        $categoria = strtoupper(trim($anomalia['categoria']));
        $item = trim($anomalia['item']);

        // Inicializa arrays para a placa se não existir
        if (!isset($anomaliasPorPlaca[$placa])) {
            $anomaliasPorPlaca[$placa] = array(
                'problemas' => array(),
                'total' => 0,
                'inspecoes' => array()
            );
            $indiceProblemas[$placa] = array();
        }

        // Cria chave única para identificar problemas iguais (SEM status - agrupa pelo item)
        $chaveProblema = $placa . '|' . $categoria . '|' . $item;

        // Verifica se já existe esse problema usando índice O(1)
        if (isset($indiceProblemas[$placa][$chaveProblema])) {
            // Problema já existe, apenas atualiza
            $idx = $indiceProblemas[$placa][$chaveProblema];

            // Adiciona status único à lista
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

            // Atualiza foto se vazia
            if (empty($anomaliasPorPlaca[$placa]['problemas'][$idx]['foto']) && !empty($anomalia['foto'])) {
                $anomaliasPorPlaca[$placa]['problemas'][$idx]['foto'] = $anomalia['foto'];
            }

            // Atualiza informações de aprovação se estiverem preenchidas
            if (!empty($anomalia['status_anomalia'])) {
                $anomaliasPorPlaca[$placa]['problemas'][$idx]['status_anomalia'] = $anomalia['status_anomalia'];
            }
            if (!empty($anomalia['data_aprovacao'])) {
                $anomaliasPorPlaca[$placa]['problemas'][$idx]['data_aprovacao'] = $anomalia['data_aprovacao'];
            }
            if (!empty($anomalia['data_finalizacao'])) {
                $anomaliasPorPlaca[$placa]['problemas'][$idx]['data_finalizacao'] = $anomalia['data_finalizacao'];
            }
            if (!empty($anomalia['observacao'])) {
                $anomaliasPorPlaca[$placa]['problemas'][$idx]['observacao'] = $anomalia['observacao'];
            }
            if (!empty($anomalia['usuario_aprovador_id'])) {
                $anomaliasPorPlaca[$placa]['problemas'][$idx]['usuario_aprovador_id'] = $anomalia['usuario_aprovador_id'];
            }
            if (!empty($anomalia['usuario_aprovador_nome'])) {
                $anomaliasPorPlaca[$placa]['problemas'][$idx]['usuario_aprovador_nome'] = $anomalia['usuario_aprovador_nome'];
            }

            // Incrementa contador de ocorrências
            $anomaliasPorPlaca[$placa]['problemas'][$idx]['total_ocorrencias']++;
        } else {
            // Problema novo, adiciona
            $statusAnomalia = 'pendente';
            if (isset($anomalia['status_anomalia']) && $anomalia['status_anomalia'] != null) {
                $statusAnomalia = $anomalia['status_anomalia'];
            }

            $novoProblema = array(
                'inspecao_id' => $anomalia['inspecao_id'],
                'inspecoes_ids' => array($anomalia['inspecao_id']),
                'data_realizacao' => $anomalia['data_realizacao'],
                'km_inicial' => $anomalia['km_inicial'],
                'categoria' => $categoria,
                'item' => $item,
                'status' => $anomalia['status'],
                'statuses' => array($anomalia['status']),
                'foto' => $anomalia['foto'],
                'usuario_nome' => $anomalia['usuario_nome'],
                'usuarios' => array($anomalia['usuario_nome']),
                'total_ocorrencias' => 1,
                'status_anomalia' => $statusAnomalia,
                'data_aprovacao' => $anomalia['data_aprovacao'],
                'data_finalizacao' => $anomalia['data_finalizacao'],
                'observacao' => $anomalia['observacao'],
                'usuario_aprovador_id' => $anomalia['usuario_aprovador_id'],
                'usuario_aprovador_nome' => $anomalia['usuario_aprovador_nome']
            );

            $anomaliasPorPlaca[$placa]['problemas'][] = $novoProblema;
            $indiceProblemas[$placa][$chaveProblema] = count($anomaliasPorPlaca[$placa]['problemas']) - 1;
            $anomaliasPorPlaca[$placa]['total']++;
        }

        // Registra inspeção
        $anomaliasPorPlaca[$placa]['inspecoes'][$anomalia['inspecao_id']] = true;
    }

    $tempoProcessamento = microtime(true) - $inicio - $tempoQuery;
    error_log("Processamento em: " . $tempoProcessamento . "s");

    // Monta resultado final
    $resultado = array();
    foreach ($anomaliasPorPlaca as $placa => $dados) {
        $resultado[] = array(
            'placa' => $placa,
            'total_problemas' => $dados['total'],
            'total_inspecoes_com_problema' => count($dados['inspecoes']),
            'data_ultima_inspecao' => $dados['problemas'][0]['data_realizacao'],
            'anomalias' => $dados['problemas']
        );
    }

    // Ordena por total de problemas
    usort($resultado, function($a, $b) {
        return $b['total_problemas'] - $a['total_problemas'];
    });

    $tempoTotal = microtime(true) - $inicio;
    error_log("Tempo total: " . $tempoTotal . "s - Placas: " . count($resultado));

    http_response_code(200);
    echo json_encode($resultado);

} catch (PDOException $e) {
    error_log("ERRO ANOMALIAS: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array(
        'erro' => 'Erro ao buscar anomalias',
        'detalhes' => $e->getMessage()
    ));
} catch (Exception $e) {
    error_log("ERRO GERAL ANOMALIAS: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array(
        'erro' => 'Erro inesperado ao processar anomalias',
        'detalhes' => $e->getMessage()
    ));
}
