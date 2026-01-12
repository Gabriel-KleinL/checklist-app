<?php
// ==========================================
// AMBIENTE DE HOMOLOGAÇÃO (STAGING)
// ==========================================
// Este arquivo conecta ao MESMO banco de produção
// ⚠️ MODO SOMENTE LEITURA para segurança
// ==========================================

define('ENVIRONMENT', 'staging');
define('READ_ONLY_MODE', true); // Previne INSERT/UPDATE/DELETE acidental

// ==========================================
// Classe Wrapper READ-ONLY para PHP 5.6
// ==========================================
class ReadOnlyPDOWrapper {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function prepare($sql, $options = array()) {
        // Bloqueia INSERT/UPDATE/DELETE/ALTER/DROP em staging
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
            error_log("⛔ STAGING BLOQUEOU: " . substr($sql, 0, 100));
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

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// Identifica ambiente nos logs
error_log("🟡 STAGING: Requisição recebida - " . $_SERVER['REQUEST_URI']);

// Responde OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Configuração do banco (MESMA DE PRODUÇÃO)
$host = '187.49.226.10';
$port = '3306';
$dbname = 'f137049_in9aut';
$username = 'f137049_tool';
$password = 'In9@1234qwer';

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $options = array(
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    );

    $pdo = new PDO($dsn, $username, $password, $options);

    // ⚠️ SEGURANÇA: Wrapper para prevenir escritas em staging
    if (READ_ONLY_MODE) {
        $pdo = new ReadOnlyPDOWrapper($pdo);
    }

    error_log("✅ STAGING: Conectado ao banco (modo " . (READ_ONLY_MODE ? "READ-ONLY" : "FULL ACCESS") . ")");

} catch (PDOException $e) {
    error_log("❌ STAGING: Erro de conexão - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array(
        'erro' => 'Erro ao conectar ao banco de dados',
        'ambiente' => 'staging',
        'detalhes' => $e->getMessage()
    ));
    exit;
}
