<?php
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

require_once 'veicular_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

try {
    $acao = isset($_GET['acao']) ? $_GET['acao'] : 'todos';

    switch ($acao) {
        case 'id':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['erro' => 'ID não informado']);
                exit;
            }

            // Busca inspeção principal
            $sqlInspecao = "SELECT * FROM aaa_inspecao_veiculo WHERE id = :id";
            $stmtInspecao = $pdo->prepare($sqlInspecao);
            $stmtInspecao->execute(['id' => $_GET['id']]);
            $inspecao = $stmtInspecao->fetch();

            if (!$inspecao) {
                http_response_code(404);
                echo json_encode(['erro' => 'Checklist não encontrado']);
                exit;
            }

            // Busca fotos
            $sqlFotos = "SELECT tipo, foto FROM aaa_inspecao_foto WHERE inspecao_id = :id";
            $stmtFotos = $pdo->prepare($sqlFotos);
            $stmtFotos->execute(['id' => $_GET['id']]);
            $fotos = $stmtFotos->fetchAll();

            // Busca itens
            $sqlItens = "SELECT categoria, item, status, foto FROM aaa_inspecao_item WHERE inspecao_id = :id";
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

        case 'placa':
            if (!isset($_GET['placa'])) {
                http_response_code(400);
                echo json_encode(['erro' => 'Placa não informada']);
                exit;
            }

            // Busca todas as inspeções da placa
            $sql = "SELECT
                        i.*,
                        COALESCE(u.nome, 'Usuário não identificado') as usuario_nome
                    FROM aaa_inspecao_veiculo i
                    LEFT JOIN aaa_usuario u ON i.usuario_id = u.id
                    WHERE i.placa = :placa
                    ORDER BY i.data_realizacao DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['placa' => $_GET['placa']]);
            $resultado = $stmt->fetchAll();

            echo json_encode($resultado);
            break;

        case 'periodo':
            if (!isset($_GET['data_inicio']) || !isset($_GET['data_fim'])) {
                http_response_code(400);
                echo json_encode(['erro' => 'Datas não informadas']);
                exit;
            }

            $sql = "SELECT
                        i.*,
                        COALESCE(u.nome, 'Usuário não identificado') as usuario_nome
                    FROM aaa_inspecao_veiculo i
                    LEFT JOIN aaa_usuario u ON i.usuario_id = u.id
                    WHERE i.data_realizacao BETWEEN :data_inicio AND :data_fim
                    ORDER BY i.data_realizacao DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'data_inicio' => $_GET['data_inicio'],
                'data_fim' => $_GET['data_fim']
            ]);
            $resultado = $stmt->fetchAll();

            echo json_encode($resultado);
            break;

        case 'completo':
            // Retorna dados completos (usado para relatórios)
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['erro' => 'ID não informado']);
                exit;
            }

            $id = $_GET['id'];

            // Busca inspeção com dados do usuário
            $sqlInspecao = "SELECT
                                i.*,
                                COALESCE(u.nome, 'Usuário não identificado') as usuario_nome
                            FROM aaa_inspecao_veiculo i
                            LEFT JOIN aaa_usuario u ON i.usuario_id = u.id
                            WHERE i.id = :id";
            $stmtInspecao = $pdo->prepare($sqlInspecao);
            $stmtInspecao->execute(['id' => $id]);
            $inspecao = $stmtInspecao->fetch();

            if (!$inspecao) {
                http_response_code(404);
                echo json_encode(['erro' => 'Checklist não encontrado']);
                exit;
            }

            // Busca fotos organizadas por tipo
            $sqlFotos = "SELECT tipo, foto FROM aaa_inspecao_foto WHERE inspecao_id = :id";
            $stmtFotos = $pdo->prepare($sqlFotos);
            $stmtFotos->execute(['id' => $id]);
            $fotosArray = $stmtFotos->fetchAll();

            $fotos = [];
            foreach ($fotosArray as $foto) {
                $fotos[$foto['tipo']] = $foto['foto'];
            }

            // Busca itens organizados por categoria
            $sqlItens = "SELECT categoria, item, status, foto, pressao, foto_caneta FROM aaa_inspecao_item WHERE inspecao_id = :id";
            $stmtItens = $pdo->prepare($sqlItens);
            $stmtItens->execute(['id' => $id]);
            $itensArray = $stmtItens->fetchAll();

            // Define estrutura completa de todos os itens possíveis
            $todosItens = [
                'MOTOR' => [
                    'Água Radiador' => 'bom',
                    'Água Limpador Parabrisa' => 'bom',
                    'Fluido de Freio' => 'bom',
                    'Nível de Óleo' => 'bom',
                    'Tampa do Radiador' => 'bom',
                    'Freio de Mão' => 'bom'
                ],
                'ELETRICO' => [
                    'Seta Esquerda' => 'bom',
                    'Seta Direita' => 'bom',
                    'Pisca Alerta' => 'bom',
                    'Farol' => 'bom'
                ],
                'LIMPEZA' => [
                    'Limpeza Interna' => 'otimo',
                    'Limpeza Externa' => 'otimo'
                ],
                'FERRAMENTA' => [
                    'Macaco' => 'contem',
                    'Chave de Roda' => 'contem',
                    'Chave do Estepe' => 'contem',
                    'Triângulo' => 'contem'
                ],
                'PNEU' => []
            ];

            // Inicializa o array de itens com valores padrão
            $itens = [
                'MOTOR' => [],
                'ELETRICO' => [],
                'LIMPEZA' => [],
                'FERRAMENTA' => [],
                'PNEU' => []
            ];

            // Preenche com itens do banco (sobrescreve os padrões)
            foreach ($itensArray as $item) {
                $itens[$item['categoria']][] = [
                    'item' => $item['item'],
                    'status' => $item['status'],
                    'foto' => $item['foto'],
                    'pressao' => $item['pressao'],
                    'foto_caneta' => $item['foto_caneta']
                ];
            }

            // Para Motor, Elétrico, Limpeza e Ferramenta: adiciona itens que não estão no banco
            foreach (['MOTOR', 'ELETRICO', 'LIMPEZA', 'FERRAMENTA'] as $categoria) {
                $itensSalvos = array_column($itens[$categoria], 'item');
                foreach ($todosItens[$categoria] as $nomeItem => $statusPadrao) {
                    if (!in_array($nomeItem, $itensSalvos)) {
                        $itens[$categoria][] = [
                            'item' => $nomeItem,
                            'status' => $statusPadrao,
                            'foto' => ''
                        ];
                    }
                }
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

            $sql = "SELECT
                        i.id,
                        i.placa,
                        i.data_realizacao,
                        i.km_inicial,
                        i.nivel_combustivel,
                        i.status_geral,
                        COALESCE(u.nome, 'Usuário não identificado') as usuario_nome
                    FROM aaa_inspecao_veiculo i
                    LEFT JOIN aaa_usuario u ON i.usuario_id = u.id
                    ORDER BY i.data_realizacao DESC
                    LIMIT :limite";

            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
            $stmt->execute();
            $resultado = $stmt->fetchAll();

            echo json_encode($resultado);
            break;
    }

} catch (PDOException $e) {
    error_log("ERRO GET: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao buscar dados',
        'detalhes' => $e->getMessage()
    ]);
}