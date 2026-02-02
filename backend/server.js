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
const checklistRoutes = require('./routes/checklist');
const configRoutes = require('./routes/config');
const anomaliasRoutes = require('./routes/anomalias');
const tempoTelasRoutes = require('./routes/tempo-telas');
const buscarPlacasRoutes = require('./routes/buscar-placas');
const configCamposInspecaoRoutes = require('./routes/config-campos-inspecao');

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

// Log de requisições detalhado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const queryString = req.query && Object.keys(req.query).length > 0 
    ? '?' + new URLSearchParams(req.query).toString() 
    : '';
  const bodySize = req.body ? JSON.stringify(req.body).length : 0;
  
  console.log(`[${timestamp}] ${req.method} ${req.path}${queryString}${bodySize > 0 ? ` (body: ${bodySize} bytes)` : ''}`);
  
  // Log body para POST/PUT (limitado a 500 chars)
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    const bodyStr = JSON.stringify(req.body);
    if (bodyStr.length <= 500) {
      console.log(`  Body: ${bodyStr}`);
    } else {
      console.log(`  Body: ${bodyStr.substring(0, 500)}... (truncado)`);
    }
  }
  
  next();
});

// Rotas - API RESTful e compatibilidade com nomes PHP

// API RESTful
app.use('/api/veicular', veicularRoutes);
app.use('/api/tipos-veiculo', tiposVeiculoRoutes);
app.use('/api/auth', authRoutes);
// checklist/config/anomalias/tempo-telas são funções simples; criamos rotas REST explícitas

// Checklist
app.get('/api/checklist', (req, res, next) => checklistRoutes.get(req, res, next));
app.post('/api/checklist', (req, res, next) => checklistRoutes.set(req, res, next));
app.get('/api/checklist/completo', (req, res, next) => checklistRoutes.getCompleto(req, res, next));
app.post('/api/checklist/completo', (req, res, next) => checklistRoutes.setCompleto(req, res, next));

// Config
app.get('/api/config/itens', (req, res, next) => configRoutes.getItens(req, res, next));
app.post('/api/config/itens', (req, res, next) => configRoutes.setItens(req, res, next));
app.get('/api/config/itens-completo', (req, res, next) => configRoutes.getItensCompleto(req, res, next));

// Anomalias
app.get('/api/anomalias', (req, res, next) => anomaliasRoutes.get(req, res, next));
app.get('/api/anomalias/status', (req, res, next) => anomaliasRoutes.updateStatus(req, res, next));
app.post('/api/anomalias/status', (req, res, next) => anomaliasRoutes.updateStatus(req, res, next));

// Tempo de telas
app.get('/api/tempo-telas', (req, res, next) => tempoTelasRoutes.handle(req, res, next));
app.post('/api/tempo-telas', (req, res, next) => tempoTelasRoutes.handle(req, res, next));
app.put('/api/tempo-telas', (req, res, next) => tempoTelasRoutes.handle(req, res, next));

// Buscar placas
app.get('/api/buscar-placas', (req, res) => buscarPlacasRoutes.handle(req, res));

// Config campos inspeção inicial
app.use('/api/config/campos-inspecao', configCamposInspecaoRoutes);

// Compatibilidade com nomes de arquivos PHP (para transição gradual)
// Redireciona b_veicular_set.php para o endpoint Node.js
app.post('/b_veicular_set.php', (req, res, next) => {
  // veicularRoutes já está montado em /api/veicular, então aqui devemos
  // apontar apenas para a rota interna do router.
  req.url = '/set';
  veicularRoutes(req, res, next);
});

app.get('/b_veicular_get.php', (req, res, next) => {
  req.url = '/get';
  veicularRoutes(req, res, next);
});

app.post('/b_veicular_update.php', (req, res, next) => {
  req.url = '/update';
  veicularRoutes(req, res, next);
});

app.get('/b_tipos_veiculo.php', (req, res, next) => {
  // tiposVeiculoRoutes já está montado em /api/tipos-veiculo
  req.url = '/';
  tiposVeiculoRoutes(req, res, next);
});

// Auth endpoint - suporta múltiplas ações via campo "acao" no body
app.post('/b_veicular_auth.php', async (req, res) => {
  // Cria um novo req com URL correta para o router
  const newReq = Object.create(req);
  newReq.url = '/login';
  newReq.path = '/login';
  newReq.method = 'POST';
  newReq.body = req.body;
  newReq.query = req.query;
  
  // Chama o router
  authRoutes(newReq, res, () => {
    // Se o router não processou, retorna 404
    res.status(404).json({ erro: 'Rota não encontrada' });
  });
});

// Checklist endpoints
app.get('/b_checklist_get.php', checklistRoutes.get);
app.post('/b_checklist_set.php', checklistRoutes.set);
app.get('/b_checklist_completo_get.php', checklistRoutes.getCompleto);
app.post('/b_checklist_completo_set.php', checklistRoutes.setCompleto);

// Config endpoints
app.get('/b_config_itens.php', configRoutes.getItens);
app.post('/b_config_itens.php', configRoutes.setItens);
app.get('/b_checklist_completo_config_itens.php', configRoutes.getItensCompleto);

// Anomalias endpoints
app.get('/b_veicular_anomalias.php', anomaliasRoutes.get);
app.get('/b_anomalia_status.php', anomaliasRoutes.updateStatus);
app.post('/b_anomalia_status.php', anomaliasRoutes.updateStatus);

// Tempo de telas endpoints (suporta GET, POST, PUT)
app.get('/b_veicular_tempotelas.php', tempoTelasRoutes.handle);
app.post('/b_veicular_tempotelas.php', tempoTelasRoutes.handle);
app.put('/b_veicular_tempotelas.php', tempoTelasRoutes.handle);

// Buscar placas
app.get('/b_buscar_placas.php', buscarPlacasRoutes.handle);

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

// Error handler com logs detalhados
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error('');
  console.error('='.repeat(60));
  console.error(`[${timestamp}] ❌ ERRO NO SERVIDOR`);
  console.error('='.repeat(60));
  console.error(`Método: ${req.method}`);
  console.error(`Path: ${req.path}`);
  console.error(`Query:`, req.query);
  console.error(`Body:`, req.body);
  console.error(`Erro:`, err.message);
  console.error(`Stack:`, err.stack);
  console.error('='.repeat(60));
  console.error('');
  
  res.status(500).json({
    erro: 'Erro interno do servidor',
    mensagem: err.message,
    path: req.path,
    timestamp: timestamp
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
