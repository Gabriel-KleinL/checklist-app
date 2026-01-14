const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Importar configuração de banco (isso inicializa o ambiente)
const { getEnvironment } = require('./config/database');

// Importar rotas
const veicularRoutes = require('./routes/veicular');
const tiposVeiculoRoutes = require('./routes/tipos-veiculo');
const authRoutes = require('./routes/auth');

// TODO: Criar essas rotas
// const checklistRoutes = require('./routes/checklist');
// const configRoutes = require('./routes/config');
// const anomaliasRoutes = require('./routes/anomalias');

const app = express();
const PORT = process.env.PORT || 8000;
const ENVIRONMENT = getEnvironment();

// Middlewares
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos (página de teste)
app.use(express.static(path.join(__dirname, 'public')));

// Servir uploads (fotos) estaticamente
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '../api/uploads');
app.use('/uploads', express.static(uploadsDir));

// Log de requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}${req.query && Object.keys(req.query).length > 0 ? '?' + new URLSearchParams(req.query).toString() : ''}`);
  next();
});

// Rotas - API RESTful e compatibilidade com nomes PHP

// API RESTful
app.use('/api/veicular', veicularRoutes);
app.use('/api/tipos-veiculo', tiposVeiculoRoutes);
app.use('/api/auth', authRoutes);

// Compatibilidade com nomes de arquivos PHP (para transição gradual)
// Redireciona b_veicular_set.php para o endpoint Node.js
app.post('/b_veicular_set.php', (req, res, next) => {
  req.url = '/api/veicular/set';
  veicularRoutes(req, res, next);
});

app.get('/b_veicular_get.php', (req, res, next) => {
  req.url = '/api/veicular/get';
  veicularRoutes(req, res, next);
});

app.get('/b_tipos_veiculo.php', (req, res, next) => {
  req.url = '/api/tipos-veiculo';
  tiposVeiculoRoutes(req, res, next);
});

app.post('/b_veicular_auth.php', (req, res, next) => {
  req.url = '/api/auth/login';
  authRoutes(req, res, next);
});

// TODO: Adicionar outras rotas conforme forem sendo criadas
// app.get('/b_checklist_get.php', ...)
// app.post('/b_checklist_set.php', ...)
// etc.

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Node.js rodando' });
});

// Rota raiz - informações do backend
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend Node.js - Checklist App',
    version: '2.0.0',
    ambiente: ENVIRONMENT,
    port: PORT,
    database: process.env.DB_NAME || 'checklist_app_local',
    api: {
      veicular: {
        post_set: '/api/veicular/set',
        get: '/api/veicular/get'
      },
      auth: {
        post_login: '/api/auth/login',
        get_usuarios: '/api/auth/usuarios'
      },
      tipos_veiculo: {
        get_list: '/api/tipos-veiculo',
        get_by_id: '/api/tipos-veiculo/:id'
      }
    },
    compatibilidade_php: {
      veicular_set: '/b_veicular_set.php -> /api/veicular/set',
      veicular_get: '/b_veicular_get.php -> /api/veicular/get',
      tipos_veiculo: '/b_tipos_veiculo.php -> /api/tipos-veiculo',
      auth: '/b_veicular_auth.php -> /api/auth/login'
    },
    health: '/health'
  });
});

// 404 para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ erro: 'Endpoint não encontrado', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({
    erro: 'Erro interno do servidor',
    mensagem: err.message
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log(`🚀 Backend Node.js - Checklist App v2.0.0`);
  console.log('='.repeat(60));
  console.log(`🌍 Ambiente: ${ENVIRONMENT.toUpperCase()}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🗄️  Banco: ${process.env.DB_NAME || 'checklist_app_local'}`);
  console.log(`📡 CORS: ${corsOrigin}`);
  console.log('='.repeat(60));
  console.log('');
});
