<?php
/**
 * API UNIFICADA - Operações GET para Checklists
 *
 * Substitui:
 * - b_veicular_get.php (checklist simples)
 * - b_bbb_checklist_completo_get.php (checklist completo)
 *
 * Detecta automaticamente o tipo de checklist baseado no parâmetro 'tipo'
 * ou na ação solicitada.
 *
 * Versão: 4.0.0
 * Data: 2025-12-18
 */

// Headers CORS - DEVE VIR ANTES DE QUALQUER SAÍDA
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Responde requisições OPTIONS (preflight) IMEDIATAMENTE
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once 'hml_veicular_config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

try {
    $acao = isset($_GET['acao']) ? $_GET['acao'] : 'todos';
    $tipo = isset($_GET['tipo']) ? $_GET['tipo'] : 'simples'; // padrão: simples

    // Validar tipo
    if (!in_array($tipo, ['simples', 'completo'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Tipo inválido. Use: simples ou completo']);
        exit;
    }

    // ============================================
    // FUNÇÕES AUXILIARES
    // ============================================

    /**
     * Converte nível de combustível de TINYINT para string
     */
    function converterNivelCombustivelParaTexto($nivel) {
        $mapa = [
            0 => '0%',
            1 => '25%',
            2 => '50%',
            3 => '75%',
            4 => '100%'
        ];
        return isset($mapa[$nivel]) ? $mapa[$nivel] : '0%';
    }

    /**
     * Processa resultado de checklist simples
     */
    function processarChecklistSimples($resultado) {
        if ($resultado && isset($resultado['nivel_combustivel'])) {
            $resultado['nivel_combustivel'] = converterNivelCombustivelParaTexto($resultado['nivel_combustivel']);
        }
        return $resultado;
    }

    /**
     * Processa resultado de checklist completo
     */
    function processarChecklistCompleto($resultado) {
        if (!$resultado) {
            return $resultado;
        }

        // Converte nivel de combustível
        if (isset($resultado['nivel_combustivel'])) {
            $resultado['nivel_combustivel'] = converterNivelCombustivelParaTexto($resultado['nivel_combustivel']);
        }

        // Decodifica os campos JSON
        $partes = ['parte1_interna', 'parte2_equipamentos', 'parte3_dianteira', 'parte4_traseira', 'parte5_especial'];
        $mapping = [
            'parte1_interna' => 'parte1',
            'parte2_equipamentos' => 'parte2',
            'parte3_dianteira' => 'parte3',
            'parte4_traseira' => 'parte4',
            'parte5_especial' => 'parte5'
        ];

        foreach ($partes as $parte) {
            if (!empty($resultado[$parte])) {
                $decoded = json_decode($resultado[$parte], true);
                $resultado[$mapping[$parte]] = ($decoded !== null) ? $decoded : [];
                unset($resultado[$parte]);
            } else {
                $resultado[$mapping[$parte]] = [];
            }
        }

        return $resultado;
    }

    // ============================================
    // ROTAS BASEADAS NO TIPO DE CHECKLIST
    // ============================================

    if ($tipo === 'simples') {
        // ============================================
        // CHECKLIST SIMPLES (bbb_inspecao_veiculo)
        // ============================================

        switch ($acao) {
            case 'id':
                if (!isset($_GET['id'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'ID não informado']);
                    exit;
                }

                // Busca inspeção principal
                $sqlInspecao = "SELECT i.*, u.nome as usuario_nome
                               FROM bbb_inspecao_veiculo i
                               LEFT JOIN bbb_usuario u ON i.usuario_id = u.id
                               WHERE i.id = :id";
                $stmtInspecao = $pdo->prepare($sqlInspecao);
                $stmtInspecao->execute(['id' => $_GET['id']]);
                $inspecao = $stmtInspecao->fetch();

                if (!$inspecao) {
                    http_response_code(404);
                    echo json_encode(['erro' => 'Checklist não encontrado']);
                    exit;
                }

                // Processa nivel de combustível
                $inspecao = processarChecklistSimples($inspecao);

                // Busca fotos
                $sqlFotos = "SELECT tipo, foto FROM bbb_inspecao_foto WHERE inspecao_id = :id";
                $stmtFotos = $pdo->prepare($sqlFotos);
                $stmtFotos->execute(['id' => $_GET['id']]);
                $fotos = $stmtFotos->fetchAll();

                // Busca itens
                $sqlItens = "SELECT categoria, item, status, foto FROM bbb_inspecao_item WHERE inspecao_id = :id";
                $stmtItens = $pdo->prepare($sqlItens);
                $stmtItens->execute(['id' => $_GET['id']]);
                $itens = $stmtItens->fetchAll();

                // Monta o resultado completo
                $resultado = [
                    'inspecao' => $inspecao,
                    'fotos' => $fotos,
                    'itens' => $itens
                ];

                echo json_encode($resultado);
                break;

            case 'validar_placa':
                if (!isset($_GET['placa'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Placa não informada']);
                    exit;
                }

                $sql = "SELECT LicensePlate as placa
                        FROM Vehicles
                        WHERE UPPER(LicensePlate) = UPPER(:placa)
                        LIMIT 1";

                $stmt = $pdo->prepare($sql);
                $stmt->execute(['placa' => $_GET['placa']]);
                $veiculo = $stmt->fetch();

                if ($veiculo) {
                    echo json_encode([
                        'sucesso' => true,
                        'placa' => $veiculo['placa']
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'sucesso' => false,
                        'erro' => 'Placa não encontrada no cadastro de veículos'
                    ]);
                }
                break;

            case 'placa':
                if (!isset($_GET['placa'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Placa não informada']);
                    exit;
                }

                $sql = "SELECT i.*, u.nome as usuario_nome
                        FROM bbb_inspecao_veiculo i
                        LEFT JOIN bbb_usuario u ON i.usuario_id = u.id
                        WHERE i.placa = :placa
                        ORDER BY i.data_realizacao DESC";

                $stmt = $pdo->prepare($sql);
                $stmt->execute(['placa' => $_GET['placa']]);
                $resultados = $stmt->fetchAll();

                // Processa cada resultado
                foreach ($resultados as &$res) {
                    $res = processarChecklistSimples($res);
                }

                echo json_encode($resultados);
                break;

            case 'periodo':
                if (!isset($_GET['data_inicio']) || !isset($_GET['data_fim'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Datas não informadas']);
                    exit;
                }

                $sql = "SELECT i.*, u.nome as usuario_nome
                        FROM bbb_inspecao_veiculo i
                        LEFT JOIN bbb_usuario u ON i.usuario_id = u.id
                        WHERE i.data_realizacao BETWEEN :data_inicio AND :data_fim
                        ORDER BY i.data_realizacao DESC";

                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    'data_inicio' => $_GET['data_inicio'],
                    'data_fim' => $_GET['data_fim']
                ]);
                $resultados = $stmt->fetchAll();

                foreach ($resultados as &$res) {
                    $res = processarChecklistSimples($res);
                }

                echo json_encode($resultados);
                break;

            case 'completo':
                if (!isset($_GET['id'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'ID não informado']);
                    exit;
                }

                $id = $_GET['id'];

                // Busca inspeção com dados do usuário
                $sqlInspecao = "SELECT i.*, u.nome as usuario_nome
                                FROM bbb_inspecao_veiculo i
                                LEFT JOIN bbb_usuario u ON i.usuario_id = u.id
                                WHERE i.id = :id";
                $stmtInspecao = $pdo->prepare($sqlInspecao);
                $stmtInspecao->execute(['id' => $id]);
                $inspecao = $stmtInspecao->fetch();

                if (!$inspecao) {
                    http_response_code(404);
                    echo json_encode(['erro' => 'Checklist não encontrado']);
                    exit;
                }

                $inspecao = processarChecklistSimples($inspecao);

                // Busca fotos organizadas por tipo
                $sqlFotos = "SELECT tipo, foto FROM bbb_inspecao_foto WHERE inspecao_id = :id";
                $stmtFotos = $pdo->prepare($sqlFotos);
                $stmtFotos->execute(['id' => $id]);
                $fotosArray = $stmtFotos->fetchAll();

                $fotos = [];
                foreach ($fotosArray as $foto) {
                    $fotos[$foto['tipo']] = $foto['foto'];
                }

                // Busca itens organizados por categoria
                $sqlItens = "SELECT categoria, item, status, foto, pressao, foto_caneta FROM bbb_inspecao_item WHERE inspecao_id = :id";
                $stmtItens = $pdo->prepare($sqlItens);
                $stmtItens->execute(['id' => $id]);
                $itensArray = $stmtItens->fetchAll();

                // Organiza itens por categoria
                $itens = [
                    'MOTOR' => [],
                    'ELETRICO' => [],
                    'LIMPEZA' => [],
                    'FERRAMENTA' => [],
                    'PNEU' => []
                ];

                foreach ($itensArray as $item) {
                    $itens[$item['categoria']][] = [
                        'item' => $item['item'],
                        'status' => $item['status'],
                        'foto' => $item['foto'],
                        'pressao' => $item['pressao'],
                        'foto_caneta' => $item['foto_caneta']
                    ];
                }

                // Monta o resultado completo estruturado
                $resultado = [
                    'id' => $inspecao['id'],
                    'placa' => $inspecao['placa'],
                    'km_inicial' => $inspecao['km_inicial'],
                    'nivel_combustivel' => $inspecao['nivel_combustivel'],
                    'observacao_painel' => $inspecao['observacao_painel'],
                    'data_realizacao' => $inspecao['data_realizacao'],
                    'status_geral' => $inspecao['status_geral'],
                    'usuario' => [
                        'id' => $inspecao['usuario_id'],
                        'nome' => $inspecao['usuario_nome']
                    ],
                    'fotos' => $fotos,
                    'itens' => $itens
                ];

                echo json_encode($resultado);
                break;

            case 'todos':
            default:
                $limite = isset($_GET['limite']) ? (int)$_GET['limite'] : 100;

                $sql = "SELECT i.*, u.nome as usuario_nome
                        FROM bbb_inspecao_veiculo i
                        LEFT JOIN bbb_usuario u ON i.usuario_id = u.id
                        ORDER BY i.data_realizacao DESC
                        LIMIT :limite";

                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
                $stmt->execute();
                $resultados = $stmt->fetchAll();

                foreach ($resultados as &$res) {
                    $res = processarChecklistSimples($res);
                }

                echo json_encode($resultados);
                break;
        }

    } else if ($tipo === 'completo') {
        // ============================================
        // CHECKLIST COMPLETO (checklist_bbb_checklist_completo)
        // ============================================

        switch ($acao) {
            case 'id':
                if (!isset($_GET['id'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'ID não informado']);
                    exit;
                }

                $sql = "SELECT c.*, u.nome as usuario_nome
                        FROM checklist_bbb_checklist_completo c
                        LEFT JOIN bbb_usuario u ON c.usuario_id = u.id
                        WHERE c.id = :id";

                $stmt = $pdo->prepare($sql);
                $stmt->execute(['id' => $_GET['id']]);
                $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$resultado) {
                    http_response_code(404);
                    echo json_encode(['erro' => 'Checklist não encontrado']);
                    exit;
                }

                $resultado = processarChecklistCompleto($resultado);

                echo json_encode($resultado);
                break;

            case 'placa':
                if (!isset($_GET['placa'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Placa não informada']);
                    exit;
                }

                $sql = "SELECT c.id, c.placa, c.km_inicial, c.nivel_combustivel,
                               c.data_realizacao, c.created_at, u.nome as usuario_nome
                        FROM checklist_bbb_checklist_completo c
                        LEFT JOIN bbb_usuario u ON c.usuario_id = u.id
                        WHERE c.placa LIKE :placa
                        ORDER BY c.data_realizacao DESC
                        LIMIT 100";

                $stmt = $pdo->prepare($sql);
                $stmt->execute(['placa' => '%' . $_GET['placa'] . '%']);
                $resultados = $stmt->fetchAll();

                foreach ($resultados as &$res) {
                    if (isset($res['nivel_combustivel'])) {
                        $res['nivel_combustivel'] = converterNivelCombustivelParaTexto($res['nivel_combustivel']);
                    }
                }

                echo json_encode($resultados);
                break;

            case 'periodo':
                if (!isset($_GET['data_inicio']) || !isset($_GET['data_fim'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'Data de início e fim são obrigatórias']);
                    exit;
                }

                $sql = "SELECT c.id, c.placa, c.km_inicial, c.nivel_combustivel,
                               c.data_realizacao, c.created_at, u.nome as usuario_nome
                        FROM checklist_bbb_checklist_completo c
                        LEFT JOIN bbb_usuario u ON c.usuario_id = u.id
                        WHERE DATE(c.data_realizacao) BETWEEN :data_inicio AND :data_fim
                        ORDER BY c.data_realizacao DESC";

                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    'data_inicio' => $_GET['data_inicio'],
                    'data_fim' => $_GET['data_fim']
                ]);
                $resultados = $stmt->fetchAll();

                foreach ($resultados as &$res) {
                    if (isset($res['nivel_combustivel'])) {
                        $res['nivel_combustivel'] = converterNivelCombustivelParaTexto($res['nivel_combustivel']);
                    }
                }

                echo json_encode($resultados);
                break;

            case 'usuario':
                if (!isset($_GET['usuario_id'])) {
                    http_response_code(400);
                    echo json_encode(['erro' => 'ID do usuário não informado']);
                    exit;
                }

                $sql = "SELECT c.id, c.placa, c.km_inicial, c.nivel_combustivel,
                               c.data_realizacao, c.created_at, u.nome as usuario_nome
                        FROM checklist_bbb_checklist_completo c
                        LEFT JOIN bbb_usuario u ON c.usuario_id = u.id
                        WHERE c.usuario_id = :usuario_id
                        ORDER BY c.data_realizacao DESC
                        LIMIT 100";

                $stmt = $pdo->prepare($sql);
                $stmt->execute(['usuario_id' => $_GET['usuario_id']]);
                $resultados = $stmt->fetchAll();

                foreach ($resultados as &$res) {
                    if (isset($res['nivel_combustivel'])) {
                        $res['nivel_combustivel'] = converterNivelCombustivelParaTexto($res['nivel_combustivel']);
                    }
                }

                echo json_encode($resultados);
                break;

            case 'estatisticas':
                $sql = "SELECT
                            COUNT(*) as total_checklists,
                            COUNT(DISTINCT placa) as total_veiculos,
                            COUNT(DISTINCT usuario_id) as total_usuarios,
                            DATE(MIN(data_realizacao)) as primeira_inspecao,
                            DATE(MAX(data_realizacao)) as ultima_inspecao
                        FROM checklist_bbb_checklist_completo";

                $stmt = $pdo->prepare($sql);
                $stmt->execute();
                $resultado = $stmt->fetch();

                echo json_encode($resultado);
                break;

            case 'todos':
            default:
                $limite = isset($_GET['limite']) ? intval($_GET['limite']) : 100;

                $sql = "SELECT c.id, c.placa, c.km_inicial, c.nivel_combustivel,
                               c.data_realizacao, c.created_at, u.nome as usuario_nome
                        FROM checklist_bbb_checklist_completo c
                        LEFT JOIN bbb_usuario u ON c.usuario_id = u.id
                        ORDER BY c.data_realizacao DESC
                        LIMIT :limite";

                $stmt = $pdo->prepare($sql);
                $stmt->bindValue('limite', $limite, PDO::PARAM_INT);
                $stmt->execute();
                $resultados = $stmt->fetchAll();

                foreach ($resultados as &$res) {
                    if (isset($res['nivel_combustivel'])) {
                        $res['nivel_combustivel'] = converterNivelCombustivelParaTexto($res['nivel_combustivel']);
                    }
                }

                echo json_encode($resultados);
                break;
        }
    }

} catch (PDOException $e) {
    error_log("ERRO PDO [b_checklist_get.php]: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao buscar dados',
        'detalhes' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("ERRO GERAL [b_checklist_get.php]: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao processar requisição',
        'mensagem' => $e->getMessage()
    ]);
}
?>
