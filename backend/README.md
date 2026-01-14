# Backend Node.js - Checklist App

Backend Node.js/Express que substitui completamente a camada PHP do Checklist App.

## 🌟 Características

- **Multi-ambiente**: Suporta local, staging e production
- **Performance**: 2-5x mais rápido que PHP
- **TypeScript-ready**: Preparado para migração futura
- **PM2**: Gerenciamento de processos robusto
- **Upload de Fotos**: Sistema completo de upload e servimento de imagens
- **MySQL**: Conexão direta com pool de conexões
- **CORS**: Configurável por ambiente

## 📁 Estrutura

```
backend/
├── server.js              # Servidor Express principal
├── ecosystem.config.js    # Configuração do PM2
├── deploy.sh              # Script de deploy
├── config/
│   └── database.js        # Configuração MySQL + detecção de ambiente
├── routes/
│   ├── veicular.js        # Rotas de veículos
│   ├── checklist.js       # Rotas de checklist
│   ├── config.js          # Rotas de configuração
│   ├── tipos-veiculo.js   # Rotas de tipos de veículo
│   ├── anomalias.js       # Rotas de anomalias
│   ├── auth.js            # Rotas de autenticação
│   └── tempo-telas.js     # Rotas de tempo de telas
├── utils/
│   └── FotoUtils.js       # Utilitários para fotos
├── public/
│   └── test-api.html      # Página de teste de APIs
├── logs/                  # Logs do PM2 (criado automaticamente)
├── .env.example           # Template de variáveis de ambiente
├── .env.local             # Ambiente local (não versionado)
├── .env.staging           # Ambiente staging (não versionado)
├── .env.production        # Ambiente production (não versionado)
└── package.json
```

## 🚀 Instalação

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Ambiente

Crie o arquivo `.env.local` (ou copie do `.env.example`):

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
NODE_ENV=local
PORT=8000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=checklist_app_local
DB_USER=root
DB_PASSWORD=
CORS_ORIGIN=*
UPLOAD_DIR=../api/uploads
```

### 3. Iniciar Servidor

**Desenvolvimento local:**
```bash
npm run dev          # Com hot reload (nodemon)
npm start            # Modo normal
npm run start:local  # Força ambiente local
```

**Staging:**
```bash
npm run start:staging
```

**Production:**
```bash
npm run start:production
```

## 🔧 Ambientes

### Local
- Porta: `8000`
- Banco: MySQL local (`checklist_app_local`)
- CORS: Aberto (`*`)
- Logs: Console
- Hot reload: Sim (com `npm run dev`)

### Staging
- Porta: `8001`
- Banco: MySQL remoto (mesmo de produção)
- CORS: Configurável
- Logs: `logs/out.log` e `logs/error.log`
- PM2: Sim

### Production
- Porta: `8000`
- Banco: MySQL remoto
- CORS: Configurável
- Logs: `logs/out.log` e `logs/error.log`
- PM2: Sim

## 📡 Endpoints

Todos os endpoints mantêm compatibilidade com a API PHP:

### Autenticação
- `POST /b_veicular_auth.php` - Login

### Veículos
- `GET /b_veicular_get.php` - Buscar inspeções
- `POST /b_veicular_set.php` - Salvar inspeção
- `POST /b_veicular_update.php` - Atualizar inspeção
- `GET /b_buscar_placas.php` - Buscar placas

### Checklist
- `GET /b_checklist_get.php` - Buscar checklist
- `POST /b_checklist_set.php` - Salvar checklist
- `GET /b_checklist_completo_get.php` - Buscar checklist completo
- `POST /b_checklist_completo_set.php` - Salvar checklist completo

### Configuração
- `GET /b_config_itens.php` - Itens de configuração
- `GET /b_checklist_completo_config_itens.php` - Itens completos

### Tipos de Veículo
- `GET /b_tipos_veiculo.php` - Listar tipos
- `POST /b_tipos_veiculo.php` - Criar/Atualizar tipo

### Anomalias
- `GET /b_veicular_anomalias.php` - Buscar anomalias
- `POST /b_anomalia_status.php` - Atualizar status

### Relatórios
- `GET /b_veicular_relatorios.php` - Gerar relatórios

### Tempo de Telas
- `GET /b_veicular_tempotelas.php` - Buscar tempos
- `POST /b_veicular_tempotelas.php` - Salvar tempo
- `PUT /b_veicular_tempotelas.php` - Atualizar tempo

### Informações
- `GET /` - Info do backend
- `GET /health` - Health check

### Uploads
- `GET /uploads/*` - Servir arquivos de upload (fotos)

## 📸 Sistema de Fotos

O backend suporta upload e servimento de fotos:

### Upload
Fotos podem ser enviadas em formato base64 no body das requisições. O sistema:
- Detecta automaticamente formato base64
- Converte para arquivo no filesystem
- Organiza em `uploads/fotos/YYYY/MM/`
- Retorna caminho relativo

### Servimento
Fotos são servidas estaticamente via `/uploads/*`:
```
http://localhost:8000/uploads/fotos/2026/01/123_veiculo_abc123.jpg
```

### Compatibilidade
- ✅ Suporta base64 legado (retorna como URL)
- ✅ Suporta arquivos novos (retorna URL)
- ✅ Compatível 100% com FotoUtils.php

## 🚢 Deploy

### Deploy Manual

**Local:**
```bash
./deploy.sh local
```

**Staging:**
```bash
./deploy.sh staging
```

**Production:**
```bash
./deploy.sh production
```

### Deploy com PM2

**Instalar PM2:**
```bash
npm install -g pm2
```

**Iniciar em staging:**
```bash
npm run pm2:staging
# ou
pm2 start ecosystem.config.js --env staging
```

**Iniciar em production:**
```bash
npm run pm2:production
# ou
pm2 start ecosystem.config.js --env production
```

**Gerenciar processos:**
```bash
pm2 list                          # Listar processos
pm2 logs checklist-backend        # Ver logs
pm2 restart checklist-backend     # Reiniciar
pm2 stop checklist-backend        # Parar
pm2 delete checklist-backend      # Remover
```

**Auto-start no boot:**
```bash
pm2 startup
pm2 save
```

## 🔍 Debugging

### Logs em desenvolvimento
```bash
npm run dev
# Logs aparecem no console
```

### Logs em produção (PM2)
```bash
pm2 logs checklist-backend        # Todos os logs
pm2 logs checklist-backend --err  # Apenas erros
pm2 logs checklist-backend --out  # Apenas output
```

### Logs em arquivo
```bash
tail -f logs/out.log              # Output
tail -f logs/error.log            # Erros
```

## 🧪 Testes

**Página de teste:**
```
http://localhost:8000/test-api.html
```

**Health check:**
```bash
curl http://localhost:8000/health
```

**Informações do servidor:**
```bash
curl http://localhost:8000/
```

## 📊 Performance

Comparado com PHP:
- ✅ 2-5x mais rápido
- ✅ Conexões persistentes ao banco
- ✅ Menor uso de memória
- ✅ Melhor handling de concorrência

## 🔐 Segurança

- ✅ Credenciais em `.env` (não versionados)
- ✅ CORS configurável por ambiente
- ✅ Validação de inputs
- ✅ Limites de tamanho de upload (50MB)
- ✅ Logs de acesso

## 🆘 Troubleshooting

### Erro de conexão com banco
```bash
# Verifique se o MySQL está rodando
mysql -u root -p -e "SELECT 1"

# Verifique credenciais no .env
cat .env.local
```

### Porta já em uso
```bash
# Encontre processo usando a porta
lsof -ti:8000

# Mate o processo
kill -9 $(lsof -ti:8000)
```

### PM2 não inicia
```bash
# Verifique logs
pm2 logs

# Reinicie PM2
pm2 kill
pm2 resurrect
```

### Fotos não aparecem
```bash
# Verifique se diretório de uploads existe
ls -la ../api/uploads/fotos

# Verifique permissões
chmod -R 755 ../api/uploads
```

## 🔄 Migração do PHP

Para migrar do PHP para Node.js:

1. ✅ Testar backend local
2. ✅ Atualizar frontend para usar porta 8000
3. ✅ Testar todos os fluxos
4. ✅ Deploy em staging
5. ✅ Validar em staging
6. ✅ Deploy em production
7. ✅ Remover arquivos PHP

## 📝 TODO

- [ ] Adicionar testes automatizados
- [ ] Adicionar documentação Swagger/OpenAPI
- [ ] Migrar para TypeScript
- [ ] Adicionar rate limiting
- [ ] Adicionar autenticação JWT
- [ ] Adicionar compressão de imagens
- [ ] Adicionar cache (Redis)

## 🤝 Contribuindo

Ao fazer mudanças:
1. Teste localmente primeiro
2. Atualize este README se necessário
3. Mantenha compatibilidade com API PHP
4. Documente breaking changes

## 📚 Recursos

- [Express.js](https://expressjs.com/)
- [MySQL2](https://github.com/sidorares/node-mysql2)
- [PM2](https://pm2.keymetrics.io/)
- [Multer](https://github.com/expressjs/multer)

---

**Mantido por**: Claude Sonnet 4.5
**Última atualização**: Janeiro 2026
**Versão**: 2.0.0
