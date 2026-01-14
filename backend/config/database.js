const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Detecta o ambiente atual (local, staging, production)
 */
function detectEnvironment() {
  // Prioridade: variável de ambiente > argumento CLI > padrão
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  // Verifica argumentos da linha de comando
  const args = process.argv.slice(2);
  const envArg = args.find(arg => arg.startsWith('--env='));
  if (envArg) {
    return envArg.split('=')[1];
  }

  return 'local';
}

/**
 * Carrega variáveis de ambiente do arquivo .env apropriado
 */
function loadEnv() {
  const environment = detectEnvironment();
  const backendDir = path.join(__dirname, '..');

  let envPath;

  // Tenta carregar .env específico do ambiente primeiro
  if (environment === 'local') {
    envPath = path.join(backendDir, '.env.local');

    // Fallback: tenta api/.env.local (compatibilidade)
    if (!fs.existsSync(envPath)) {
      envPath = path.join(__dirname, '../../api/.env.local');
    }
  } else if (environment === 'staging') {
    envPath = path.join(backendDir, '.env.staging');
  } else if (environment === 'production') {
    envPath = path.join(backendDir, '.env.production');
  }

  // Tenta carregar .env genérico se específico não existir
  if (!fs.existsSync(envPath)) {
    envPath = path.join(backendDir, '.env');
  }

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Carregado: ${envPath}`);
  } else {
    console.warn(`⚠️  Arquivo .env não encontrado. Usando configurações padrão.`);
  }

  return environment;
}

/**
 * Cria pool de conexões MySQL
 */
let pool = null;
let currentEnvironment = null;

function getPool() {
  if (!pool) {
    currentEnvironment = loadEnv();

    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'checklist_app_local',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    };

    pool = mysql.createPool(config);

    console.log(`🌍 Ambiente: ${currentEnvironment.toUpperCase()}`);
    console.log(`✅ MySQL: ${config.host}:${config.port}/${config.database}`);
  }

  return pool;
}

/**
 * Retorna o ambiente atual
 */
function getEnvironment() {
  if (!currentEnvironment) {
    currentEnvironment = detectEnvironment();
  }
  return currentEnvironment;
}

/**
 * Executa uma query e retorna o resultado
 * Usa o pool diretamente (não precisa de getConnection para queries simples)
 */
async function query(sql, params = []) {
  const pool = getPool();
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Erro na query:', sql, error);
    throw error;
  }
}

/**
 * Executa uma query e retorna apenas o primeiro resultado
 */
async function queryOne(sql, params = []) {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Retorna o prefixo de tabela baseado no ambiente
 * Local: checklist_
 * Staging/Production: bbb_
 */
function getTablePrefix() {
  const env = getEnvironment();
  return env === 'local' ? 'checklist_' : 'bbb_';
}

/**
 * Retorna nome completo da tabela com prefixo
 */
function table(name) {
  return `${getTablePrefix()}${name}`;
}

// Inicializa o pool imediatamente
const initializedPool = getPool();

module.exports = {
  pool: initializedPool,
  getPool,
  query,
  queryOne,
  getEnvironment,
  detectEnvironment,
  getTablePrefix,
  table
};
