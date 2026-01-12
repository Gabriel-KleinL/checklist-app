<?php
// ==========================================
// API DE RELATÓRIOS - SISTEMA DE INSPEÇÃO VEICULAR
// ==========================================
// Compatível com PHP 5.6
// ==========================================

require_once 'hml_veicular_config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // Obtém a ação via GET
    $acao = isset($_GET['acao']) ? $_GET['acao'] : '';

    error_log("📊 RELATÓRIOS: Ação recebida = " . $acao);

    switch ($acao) {
        case 'veiculos_sem_checklist':
            buscarVeiculosSemChecklist($pdo);
            break;

        default:
            http_response_code(400);
            echo json_encode(array(
                'sucesso' => false,
                'erro' => 'Ação inválida ou não especificada',
                'acoes_disponiveis' => array('veiculos_sem_checklist')
            ));
            break;
    }

} catch (Exception $e) {
    error_log("❌ RELATÓRIOS: Erro geral - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array(
        'sucesso' => false,
        'erro' => 'Erro ao processar requisição',
        'detalhes' => $e->getMessage()
    ));
}

// ==========================================
// FUNÇÃO: Buscar Veículos Sem Checklist
// ==========================================
function buscarVeiculosSemChecklist($pdo) {
    try {
        error_log("🔍 RELATÓRIOS: Buscando veículos sem checklist...");

        // Busca todas as placas únicas que JÁ TÊM checklist
        $sqlComChecklist = "
            SELECT DISTINCT UPPER(TRIM(placa)) as placa
            FROM bbb_inspecao_veiculo
            WHERE placa IS NOT NULL
              AND placa != ''
        ";

        $stmtComChecklist = $pdo->prepare($sqlComChecklist);
        $stmtComChecklist->execute();
        $placasComChecklist = $stmtComChecklist->fetchAll(PDO::FETCH_COLUMN);

        error_log("📋 RELATÓRIOS: " . count($placasComChecklist) . " placas COM checklist");

        // Busca TODAS as placas cadastradas na tabela Vehicles
        $sqlTodasPlacas = "
            SELECT DISTINCT UPPER(TRIM(LicensePlate)) as placa
            FROM Vehicles
            WHERE LicensePlate IS NOT NULL
              AND LicensePlate != ''
            ORDER BY LicensePlate ASC
        ";

        $stmtTodasPlacas = $pdo->prepare($sqlTodasPlacas);
        $stmtTodasPlacas->execute();
        $todasPlacas = $stmtTodasPlacas->fetchAll(PDO::FETCH_COLUMN);

        error_log("🚗 RELATÓRIOS: " . count($todasPlacas) . " placas TOTAIS cadastradas em Vehicles");

        // Normaliza arrays para comparação (uppercase e trim)
        $placasComChecklistNormalizadas = array_map(function($placa) {
            return strtoupper(trim($placa));
        }, $placasComChecklist);

        $todasPlacasNormalizadas = array_map(function($placa) {
            return strtoupper(trim($placa));
        }, $todasPlacas);

        // Identifica placas SEM checklist (diferença entre todas e as que têm)
        $placasSemChecklist = array_diff($todasPlacasNormalizadas, $placasComChecklistNormalizadas);

        // Remove placas vazias ou nulas
        $placasSemChecklist = array_filter($placasSemChecklist, function($placa) {
            return !empty(trim($placa));
        });

        // Reindexar array
        $placasSemChecklist = array_values($placasSemChecklist);

        error_log("⚠️  RELATÓRIOS: " . count($placasSemChecklist) . " placas SEM checklist");

        // Monta resultado
        $veiculos = array();
        foreach ($placasSemChecklist as $placa) {
            $veiculos[] = array(
                'placa' => $placa,
                'total_checklists' => 0,
                'status' => 'Sem checklist'
            );
        }

        // Resposta de sucesso
        http_response_code(200);
        echo json_encode(array(
            'sucesso' => true,
            'total' => count($veiculos),
            'veiculos' => $veiculos,
            'metadados' => array(
                'total_placas_sistema' => count($todasPlacas),
                'placas_com_checklist' => count($placasComChecklist),
                'placas_sem_checklist' => count($placasSemChecklist),
                'data_geracao' => date('Y-m-d H:i:s')
            )
        ));

    } catch (Exception $e) {
        error_log("❌ RELATÓRIOS: Erro ao buscar veículos sem checklist - " . $e->getMessage());
        http_response_code(500);
        echo json_encode(array(
            'sucesso' => false,
            'erro' => 'Erro ao buscar veículos sem checklist',
            'detalhes' => $e->getMessage()
        ));
    }
}
?>
