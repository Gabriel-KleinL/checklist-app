<?php
/**
 * ========================================
 * MIGRAÇÃO: Adicionar Foreign Keys
 * ========================================
 * Fase 2.3 do Plano de Limpeza
 * 
 * Este script adiciona foreign keys para garantir
 * integridade referencial nas tabelas do prefixo checklist_
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
    
    // Array de foreign keys a criar (se não existirem)
    $foreignKeys = [
        // bbb_inspecao_item
        [
            'tabela' => 'bbb_inspecao_item',
            'nome' => 'fk_item_inspecao',
            'sql' => 'ALTER TABLE `bbb_inspecao_item` 
                      ADD CONSTRAINT `fk_item_inspecao` 
                      FOREIGN KEY (`inspecao_id`) 
                      REFERENCES `bbb_inspecao_veiculo`(`id`) 
                      ON DELETE CASCADE'
        ],
        
        // bbb_inspecao_foto
        [
            'tabela' => 'bbb_inspecao_foto',
            'nome' => 'fk_foto_inspecao',
            'sql' => 'ALTER TABLE `bbb_inspecao_foto` 
                      ADD CONSTRAINT `fk_foto_inspecao` 
                      FOREIGN KEY (`inspecao_id`) 
                      REFERENCES `bbb_inspecao_veiculo`(`id`) 
                      ON DELETE CASCADE'
        ],
        
        // bbb_tempo_telas
        [
            'tabela' => 'bbb_tempo_telas',
            'nome' => 'fk_tempo_inspecao',
            'sql' => 'ALTER TABLE `bbb_tempo_telas` 
                      ADD CONSTRAINT `fk_tempo_inspecao` 
                      FOREIGN KEY (`inspecao_id`) 
                      REFERENCES `bbb_inspecao_veiculo`(`id`) 
                      ON DELETE SET NULL'
        ],
    ];
    
    $resultados = [];
    $criados = 0;
    $ja_existiam = 0;
    $erros = 0;
    
    foreach ($foreignKeys as $fk) {
        try {
            // Verificar se a foreign key já existe
            $sqlVerificar = "
                SELECT COUNT(*) as total
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND CONSTRAINT_NAME = ?
                  AND REFERENCED_TABLE_NAME IS NOT NULL
            ";
            
            $stmtVerificar = $pdo->prepare($sqlVerificar);
            $stmtVerificar->execute([$fk['tabela'], $fk['nome']]);
            $existe = $stmtVerificar->fetch(PDO::FETCH_ASSOC)['total'] > 0;
            
            if ($existe) {
                $ja_existiam++;
                $resultados[] = [
                    'tabela' => $fk['tabela'],
                    'foreign_key' => $fk['nome'],
                    'status' => 'já_existia'
                ];
            } else {
                // Criar foreign key
                $pdo->exec($fk['sql']);
                $criados++;
                $resultados[] = [
                    'tabela' => $fk['tabela'],
                    'foreign_key' => $fk['nome'],
                    'status' => 'criado'
                ];
            }
        } catch (PDOException $e) {
            // Se o erro for "Duplicate key name" ou "Duplicate foreign key", já existe
            if (strpos($e->getMessage(), 'Duplicate') !== false || 
                strpos($e->getMessage(), 'already exists') !== false) {
                $ja_existiam++;
                $resultados[] = [
                    'tabela' => $fk['tabela'],
                    'foreign_key' => $fk['nome'],
                    'status' => 'já_existia'
                ];
            } else {
                $erros++;
                $resultados[] = [
                    'tabela' => $fk['tabela'],
                    'foreign_key' => $fk['nome'],
                    'status' => 'erro',
                    'mensagem' => $e->getMessage()
                ];
                error_log("Erro ao criar foreign key {$fk['nome']} em {$fk['tabela']}: " . $e->getMessage());
            }
        } catch (Exception $e) {
            $erros++;
            $resultados[] = [
                'tabela' => $fk['tabela'],
                'foreign_key' => $fk['nome'],
                'status' => 'erro',
                'mensagem' => $e->getMessage()
            ];
            error_log("Erro ao criar foreign key {$fk['nome']} em {$fk['tabela']}: " . $e->getMessage());
        }
    }
    
    ob_clean();
    http_response_code(200);
    
    $json = json_encode([
        'sucesso' => true,
        'mensagem' => 'Migração de foreign keys concluída',
        'resumo' => [
            'total' => count($foreignKeys),
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
    
    error_log("Erro em migration_add_foreign_keys.php: " . $e->getMessage());
}