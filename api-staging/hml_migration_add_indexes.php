<?php
/**
 * ========================================
 * MIGRAÇÃO: Adicionar Índices ao Banco
 * ========================================
 * Fase 2.2 do Plano de Limpeza
 * 
 * Este script adiciona índices para melhorar performance
 * nas tabelas do prefixo checklist_
 * 
 * IMPORTANTE: Execute este script APÓS a migração de dados
 * ========================================
 */

ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Headers CORS
if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json; charset=utf-8');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Função auxiliar para obter conexão direta (sem wrapper READ-ONLY)
function getDirectConnection() {
    // Carregar variáveis de ambiente
    $envFile = __DIR__ . '/.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0 || empty(trim($line))) {
                continue;
            }
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                putenv("$key=$value");
                $_ENV[$key] = $value;
            }
        }
    }
    
    $host = getenv('DB_HOST') ?: '187.49.226.10';
    $port = getenv('DB_PORT') ?: '3306';
    $dbname = getenv('DB_NAME') ?: 'f137049_in9aut';
    $username = getenv('DB_USER') ?: 'f137049_tool';
    $password = getenv('DB_PASSWORD') ?: 'In9@1234qwer';
    
    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $options = array(
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    );
    
    return new PDO($dsn, $username, $password, $options);
}

try {
    // Para scripts de migração, usar conexão direta
    $pdo = getDirectConnection();
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'erro' => 'Erro ao conectar ao banco',
        'mensagem' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {

try {
    $pdo = getConnection();
    
    // Array de índices a criar (se não existirem)
    $indices = [
        // bbb_inspecao_item
        [
            'tabela' => 'bbb_inspecao_item',
            'nome' => 'idx_inspecao_item_inspecao_id',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_inspecao_item_inspecao_id` ON `bbb_inspecao_item`(`inspecao_id`)'
        ],
        [
            'tabela' => 'bbb_inspecao_item',
            'nome' => 'idx_item_categoria',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_item_categoria` ON `bbb_inspecao_item`(`categoria`)'
        ],
        
        // bbb_inspecao_foto
        [
            'tabela' => 'bbb_inspecao_foto',
            'nome' => 'idx_inspecao_foto_inspecao_id',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_inspecao_foto_inspecao_id` ON `bbb_inspecao_foto`(`inspecao_id`)'
        ],
        [
            'tabela' => 'bbb_inspecao_foto',
            'nome' => 'idx_foto_tipo',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_foto_tipo` ON `bbb_inspecao_foto`(`tipo`)'
        ],
        
        // bbb_inspecao_veiculo
        [
            'tabela' => 'bbb_inspecao_veiculo',
            'nome' => 'idx_inspecao_placa',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_inspecao_placa` ON `bbb_inspecao_veiculo`(`placa`)'
        ],
        [
            'tabela' => 'bbb_inspecao_veiculo',
            'nome' => 'idx_inspecao_data',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_inspecao_data` ON `bbb_inspecao_veiculo`(`data_realizacao`)'
        ],
        [
            'tabela' => 'bbb_inspecao_veiculo',
            'nome' => 'idx_inspecao_usuario',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_inspecao_usuario` ON `bbb_inspecao_veiculo`(`usuario_id`)'
        ],
        [
            'tabela' => 'bbb_inspecao_veiculo',
            'nome' => 'idx_inspecao_tipo_veiculo',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_inspecao_tipo_veiculo` ON `bbb_inspecao_veiculo`(`tipo_veiculo_id`)'
        ],
        [
            'tabela' => 'bbb_inspecao_veiculo',
            'nome' => 'idx_inspecao_usuario_data',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_inspecao_usuario_data` ON `bbb_inspecao_veiculo`(`usuario_id`, `data_realizacao`)'
        ],
        
        // bbb_anomalia_status
        [
            'tabela' => 'bbb_anomalia_status',
            'nome' => 'idx_anomalia_placa',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_anomalia_placa` ON `bbb_anomalia_status`(`placa`)'
        ],
        [
            'tabela' => 'bbb_anomalia_status',
            'nome' => 'idx_anomalia_status',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_anomalia_status` ON `bbb_anomalia_status`(`status_anomalia`)'
        ],
        [
            'tabela' => 'bbb_anomalia_status',
            'nome' => 'idx_anomalia_categoria_item',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_anomalia_categoria_item` ON `bbb_anomalia_status`(`categoria`, `item`)'
        ],
        
        // bbb_tempo_telas
        [
            'tabela' => 'bbb_tempo_telas',
            'nome' => 'idx_tempo_inspecao',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_tempo_inspecao` ON `bbb_tempo_telas`(`inspecao_id`)'
        ],
        [
            'tabela' => 'bbb_tempo_telas',
            'nome' => 'idx_tempo_tela',
            'sql' => 'CREATE INDEX IF NOT EXISTS `idx_tempo_tela` ON `bbb_tempo_telas`(`tela`)'
        ],
    ];
    
    $resultados = [];
    $criados = 0;
    $ja_existiam = 0;
    $erros = 0;
    
    foreach ($indices as $indice) {
        try {
            // Verificar se o índice já existe
            $sqlVerificar = "
                SELECT COUNT(*) as total
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND INDEX_NAME = ?
            ";
            
            $stmtVerificar = $pdo->prepare($sqlVerificar);
            $stmtVerificar->execute([$indice['tabela'], $indice['nome']]);
            $existe = $stmtVerificar->fetch(PDO::FETCH_ASSOC)['total'] > 0;
            
            if ($existe) {
                $ja_existiam++;
                $resultados[] = [
                    'tabela' => $indice['tabela'],
                    'indice' => $indice['nome'],
                    'status' => 'já_existia'
                ];
            } else {
                // Criar índice
                // Nota: MySQL não suporta IF NOT EXISTS em CREATE INDEX diretamente
                // Vamos usar um try-catch
                try {
                    $pdo->exec($indice['sql']);
                    $criados++;
                    $resultados[] = [
                        'tabela' => $indice['tabela'],
                        'indice' => $indice['nome'],
                        'status' => 'criado'
                    ];
                } catch (PDOException $e) {
                    // Se o erro for "Duplicate key name", o índice já existe
                    if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
                        $ja_existiam++;
                        $resultados[] = [
                            'tabela' => $indice['tabela'],
                            'indice' => $indice['nome'],
                            'status' => 'já_existia'
                        ];
                    } else {
                        throw $e;
                    }
                }
            }
        } catch (Exception $e) {
            $erros++;
            $resultados[] = [
                'tabela' => $indice['tabela'],
                'indice' => $indice['nome'],
                'status' => 'erro',
                'mensagem' => $e->getMessage()
            ];
            error_log("Erro ao criar índice {$indice['nome']} em {$indice['tabela']}: " . $e->getMessage());
        }
    }
    
    ob_clean();
    http_response_code(200);
    
    $json = json_encode([
        'sucesso' => true,
        'mensagem' => 'Migração de índices concluída',
        'resumo' => [
            'total' => count($indices),
            'criados' => $criados,
            'ja_existiam' => $ja_existiam,
            'erros' => $erros
        ],
        'detalhes' => $resultados
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    
    if ($json === false) {
        echo json_encode([
            'erro' => 'Erro ao codificar JSON',
            'mensagem' => json_last_error_msg()
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
        echo $json;
    }
    
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    $json = json_encode([
        'erro' => 'Erro no banco de dados',
        'mensagem' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    if ($json === false) {
        echo '{"erro":"Erro ao codificar JSON de erro"}';
    } else {
        echo $json;
    }
    
    error_log("Erro em migration_add_indexes.php: " . $e->getMessage());
}