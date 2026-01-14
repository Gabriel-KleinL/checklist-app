<?php
/**
 * Script de Migração de Fotos Base64 -> Filesystem (STAGING)
 *
 * Este script migra fotos armazenadas como base64 no banco de dados
 * para arquivos no filesystem, melhorando performance e reduzindo uso de memória.
 *
 * IMPORTANTE:
 * - Execute migration_fotos_filesystem.sql ANTES deste script
 * - Faça BACKUP completo do banco antes de executar
 * - Execute fora de horário de pico
 * - Monitorar espaço em disco disponível
 *
 * USO:
 * - Via browser: http://localhost/api-staging/hml_foto_migrar.php
 * - Via CLI: php hml_foto_migrar.php
 *
 * PARÂMETROS:
 * - ?lote=50 (padrão: 50) - Quantas fotos processar por lote
 * - ?preview=1 - Apenas simula, não migra
 * - ?tabela=inspecao_foto ou inspecao_item - Migrar apenas uma tabela
 */

// Carrega configuração do banco
require_once __DIR__ . '/hml_veicular_config.php';
require_once __DIR__ . '/../api/utils/FotoUtils.php';

// Configurações
$LOTE_SIZE = isset($_GET['lote']) ? (int)$_GET['lote'] : 50;
$PREVIEW_MODE = isset($_GET['preview']) && $_GET['preview'] == '1';
$TABELA_ESPECIFICA = isset($_GET['tabela']) ? $_GET['tabela'] : null;

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Processa requisição OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conecta ao banco
try {
    $pdo = getConnection();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo json_encode([
        'sucesso' => false,
        'erro' => 'Erro ao conectar ao banco: ' . $e->getMessage()
    ]);
    exit();
}

// Estatísticas
$stats = [
    'inicio' => date('Y-m-d H:i:s'),
    'preview_mode' => $PREVIEW_MODE,
    'lote_size' => $LOTE_SIZE,
    'tabelas' => []
];

/**
 * Migra fotos de uma tabela específica
 */
function migrarTabela($pdo, $tabela, $coluna, $loteSize, $previewMode) {
    global $stats;

    $tabelaCompleta = "checklist_$tabela";
    $stats['tabelas'][$tabela] = [
        'coluna' => $coluna,
        'total_registros' => 0,
        'base64_encontrados' => 0,
        'migrados' => 0,
        'erros' => 0,
        'economia_bytes' => 0,
        'tempo_segundos' => 0,
        'detalhes' => []
    ];

    $inicio = microtime(true);

    echo "\n========================================\n";
    echo "Processando tabela: $tabelaCompleta.$coluna\n";
    echo "========================================\n\n";

    try {
        // Conta total de registros
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM $tabelaCompleta WHERE $coluna IS NOT NULL AND $coluna != ''");
        $stmt->execute();
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        $stats['tabelas'][$tabela]['total_registros'] = $total;

        echo "Total de registros com $coluna: $total\n\n";

        // Busca registros com fotos base64 (fotos com mais de 1000 caracteres)
        $offset = 0;
        $totalMigrados = 0;
        $totalErros = 0;

        while (true) {
            $stmt = $pdo->prepare("
                SELECT id, $coluna, inspecao_id
                FROM $tabelaCompleta
                WHERE $coluna IS NOT NULL
                  AND LENGTH($coluna) > 1000
                LIMIT :lote OFFSET :offset
            ");
            $stmt->bindValue(':lote', $loteSize, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $registros = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($registros)) {
                break; // Fim dos registros
            }

            echo "Processando lote " . ($offset / $loteSize + 1) . " (registros $offset a " . ($offset + count($registros)) . ")...\n";

            foreach ($registros as $registro) {
                $id = $registro['id'];
                $base64Data = $registro[$coluna];
                $inspecaoId = $registro['inspecao_id'] ?? $id;

                // Calcula tamanho original
                $tamanhoOriginal = strlen($base64Data);

                // Verifica se realmente é base64
                if (!FotoUtils::isBase64($base64Data)) {
                    echo "  - ID $id: Não é base64, pulando...\n";
                    continue;
                }

                $stats['tabelas'][$tabela]['base64_encontrados']++;

                if ($previewMode) {
                    echo "  - ID $id: [PREVIEW] Seria migrado (~" . number_format($tamanhoOriginal / 1024, 2) . " KB)\n";
                    continue;
                }

                // Tenta salvar a foto
                $tipo = strtoupper($coluna); // 'FOTO' ou 'FOTO_CANETA'
                $caminhoRelativo = FotoUtils::save($base64Data, $inspecaoId, $tipo);

                if ($caminhoRelativo === false) {
                    $totalErros++;
                    $stats['tabelas'][$tabela]['erros']++;
                    echo "  - ID $id: ❌ ERRO ao salvar foto\n";

                    $stats['tabelas'][$tabela]['detalhes'][] = [
                        'id' => $id,
                        'status' => 'erro',
                        'mensagem' => 'Erro ao salvar foto no filesystem'
                    ];
                    continue;
                }

                // Atualiza registro no banco com o caminho relativo
                $updateStmt = $pdo->prepare("UPDATE $tabelaCompleta SET $coluna = :caminho WHERE id = :id");
                $updateStmt->execute([
                    ':caminho' => $caminhoRelativo,
                    ':id' => $id
                ]);

                $totalMigrados++;
                $stats['tabelas'][$tabela]['migrados']++;
                $stats['tabelas'][$tabela]['economia_bytes'] += $tamanhoOriginal - strlen($caminhoRelativo);

                echo "  - ID $id: ✅ Migrado (~" . number_format($tamanhoOriginal / 1024, 2) . " KB → " . strlen($caminhoRelativo) . " bytes)\n";

                $stats['tabelas'][$tabela]['detalhes'][] = [
                    'id' => $id,
                    'status' => 'sucesso',
                    'caminho' => $caminhoRelativo,
                    'economia_bytes' => $tamanhoOriginal - strlen($caminhoRelativo)
                ];
            }

            $offset += $loteSize;

            // Pequena pausa para não sobrecarregar
            usleep(100000); // 0.1 segundo
        }

        $fim = microtime(true);
        $stats['tabelas'][$tabela]['tempo_segundos'] = round($fim - $inicio, 2);

        echo "\n✅ Tabela $tabelaCompleta.$coluna concluída:\n";
        echo "   - Total de registros: " . $stats['tabelas'][$tabela]['total_registros'] . "\n";
        echo "   - Base64 encontrados: " . $stats['tabelas'][$tabela]['base64_encontrados'] . "\n";
        echo "   - Migrados: $totalMigrados\n";
        echo "   - Erros: $totalErros\n";
        echo "   - Economia: " . number_format($stats['tabelas'][$tabela]['economia_bytes'] / 1024 / 1024, 2) . " MB\n";
        echo "   - Tempo: " . $stats['tabelas'][$tabela]['tempo_segundos'] . " segundos\n\n";

    } catch (Exception $e) {
        echo "❌ ERRO ao processar tabela $tabelaCompleta.$coluna: " . $e->getMessage() . "\n\n";
        $stats['tabelas'][$tabela]['erro_fatal'] = $e->getMessage();
    }
}

// ========================================
// EXECUÇÃO PRINCIPAL
// ========================================

echo "========================================\n";
echo "MIGRAÇÃO DE FOTOS BASE64 → FILESYSTEM (STAGING)\n";
echo "========================================\n";
echo "Início: " . $stats['inicio'] . "\n";
echo "Modo: " . ($PREVIEW_MODE ? "PREVIEW (simulação)" : "PRODUÇÃO") . "\n";
echo "Lote: $LOTE_SIZE registros por vez\n";
echo "========================================\n";

// Migra tabelas
if ($TABELA_ESPECIFICA === 'inspecao_foto' || $TABELA_ESPECIFICA === null) {
    migrarTabela($pdo, 'inspecao_foto', 'foto', $LOTE_SIZE, $PREVIEW_MODE);
}

if ($TABELA_ESPECIFICA === 'inspecao_item' || $TABELA_ESPECIFICA === null) {
    migrarTabela($pdo, 'inspecao_item', 'foto', $LOTE_SIZE, $PREVIEW_MODE);
    migrarTabela($pdo, 'inspecao_item', 'foto_caneta', $LOTE_SIZE, $PREVIEW_MODE);
}

// Resumo final
$stats['fim'] = date('Y-m-d H:i:s');
$totalMigrados = array_sum(array_column($stats['tabelas'], 'migrados'));
$totalErros = array_sum(array_column($stats['tabelas'], 'erros'));
$totalEconomia = array_sum(array_column($stats['tabelas'], 'economia_bytes'));

echo "========================================\n";
echo "RESUMO FINAL\n";
echo "========================================\n";
echo "Início: " . $stats['inicio'] . "\n";
echo "Fim: " . $stats['fim'] . "\n";
echo "Total migrado: $totalMigrados fotos\n";
echo "Total de erros: $totalErros\n";
echo "Economia total: " . number_format($totalEconomia / 1024 / 1024, 2) . " MB\n";
echo "========================================\n";

if ($PREVIEW_MODE) {
    echo "\n⚠️  MODO PREVIEW - Nenhuma alteração foi feita no banco\n";
    echo "Para executar a migração real, remova o parâmetro ?preview=1\n";
}

// Retorna JSON
echo json_encode([
    'sucesso' => true,
    'estatisticas' => $stats,
    'resumo' => [
        'total_migrados' => $totalMigrados,
        'total_erros' => $totalErros,
        'economia_mb' => round($totalEconomia / 1024 / 1024, 2),
        'preview_mode' => $PREVIEW_MODE
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
