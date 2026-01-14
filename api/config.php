<?php
/**
 * Configuração Centralizada - Detecção Automática de Ambiente
 *
 * Este arquivo detecta automaticamente o ambiente (produção/staging)
 * baseado no diretório e aplica configurações apropriadas.
 *
 * Substitui:
 * - api/b_veicular_config.php
 * - api-staging/hml_veicular_config.php
 *
 * Versão: 1.0.0
 * Data: 2026-01-13
 */

// ==========================================
// DETECÇÃO AUTOMÁTICA DE AMBIENTE
// ==========================================
$currentDir = basename(dirname(__FILE__));
$isStaging = ($currentDir === 'api-staging');

define('ENVIRONMENT', $isStaging ? 'staging' : 'production');
define('READ_ONLY_MODE', $isStaging); // Staging é read-only por segurança

// Log de ambiente
if ($isStaging) {
    error_log("🟡 STAGING: Requisição recebida - " . $_SERVER['REQUEST_URI']);
} else {
    error_log("🟢 PRODUCTION: Requisição recebida - " . $_SERVER['REQUEST_URI']);
}

// ==========================================
// CLASSE WRAPPER READ-ONLY (PHP 5.6)
// ==========================================
/**
 * Wrapper PDO que bloqueia operações de escrita em staging
 */
class ReadOnlyPDOWrapper {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function prepare($sql, $options = array()) {
        // Bloqueia INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE/CREATE em staging
        $sql_upper = strtoupper(trim($sql));
        if (preg_match('/^(INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|CREATE)\s/i', $sql_upper)) {
            error_log("⛔ STAGING BLOQUEOU: Tentativa de executar query de escrita: " . substr($sql, 0, 100));
            throw new Exception("❌ Operações de escrita bloqueadas em STAGING. Use ambiente de produção.");
        }
        return $this->pdo->prepare($sql, $options);
    }

    public function query($sql) {
        $sql_upper = strtoupper(trim($sql));
        if (preg_match('/^(INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|CREATE)\s/i', $sql_upper)) {
            error_log("⛔ STAGING BLOQUEOU: query() - " . substr($sql, 0, 100));
            throw new Exception("❌ Operações de escrita bloqueadas em STAGING.");
        }

        // Passa argumentos variáveis para PHP 5.6
        $args = func_get_args();
        return call_user_func_array(array($this->pdo, 'query'), $args);
    }

    public function exec($sql) {
        error_log("⛔ STAGING BLOQUEOU: exec() - " . substr($sql, 0, 100));
        throw new Exception("❌ exec() bloqueado em STAGING.");
    }

    // Passa métodos seguros para o PDO original
    public function __call($method, $args) {
        return call_user_func_array(array($this->pdo, $method), $args);
    }

    public function __get($property) {
        return $this->pdo->$property;
    }
}

// ==========================================
// HEADERS CORS
// ==========================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // Cache preflight por 24 horas

// Responde requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// ==========================================
// CARREGAR VARIÁVEIS DE AMBIENTE (.env)
// ==========================================
// Prioridade: .env.local (desenvolvimento) > .env (produção/staging)
$envLocalFile = __DIR__ . '/.env.local';
$envFile = __DIR__ . '/.env';

// Carregar .env.local primeiro (se existir) para desenvolvimento local
if (file_exists($envLocalFile)) {
    $lines = file($envLocalFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignora comentários e linhas vazias
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
    error_log("📁 Carregado: .env.local (desenvolvimento)");
} elseif (file_exists($envFile)) {
    // Se .env.local não existir, usar .env (produção/staging)
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignora comentários e linhas vazias
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
    error_log("📁 Carregado: .env (" . ENVIRONMENT . ")");
}

// ==========================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// ==========================================
$host = getenv('DB_HOST') ?: '187.49.226.10';
$port = getenv('DB_PORT') ?: '3306';
$dbname = getenv('DB_NAME') ?: 'f137049_in9aut';
$username = getenv('DB_USER') ?: 'f137049_in9aut';
$password = getenv('DB_PASS') ?: '';

// ==========================================
// CONEXÃO COM O BANCO
// ==========================================
/**
 * Cria conexão PDO com o banco de dados
 * Em staging, retorna wrapper read-only
 * Em produção, retorna PDO normal
 */
function getConnection() {
    global $host, $port, $dbname, $username, $password;

    try {
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
        $options = array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        );

        $pdo = new PDO($dsn, $username, $password, $options);

        // Em staging, wrapa com ReadOnlyPDOWrapper
        if (READ_ONLY_MODE) {
            error_log("🔒 Conexão READ-ONLY ativada (staging)");
            return new ReadOnlyPDOWrapper($pdo);
        }

        error_log("✅ Conexão estabelecida (" . ENVIRONMENT . ")");
        return $pdo;

    } catch (PDOException $e) {
        error_log("❌ Erro de conexão: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(array(
            'erro' => 'Erro ao conectar ao banco de dados',
            'ambiente' => ENVIRONMENT
        ));
        exit;
    }
}

// Cria conexão global
$pdo = getConnection();

// ==========================================
// INFORMAÇÕES DE DEBUG (apenas em staging)
// ==========================================
if ($isStaging && isset($_GET['debug'])) {
    error_log("🐛 DEBUG ativado");
    error_log("Ambiente: " . ENVIRONMENT);
    error_log("Read-Only: " . (READ_ONLY_MODE ? 'SIM' : 'NÃO'));
    error_log("Host: " . $host);
    error_log("Database: " . $dbname);
}
