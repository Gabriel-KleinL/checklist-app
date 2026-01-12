# Guia do Ambiente de Homologação (Staging)

## 📍 URLs do Ambiente

- **Frontend Staging**: `https://floripa.in9automacao.com.br/staging/`
- **API Staging**: `https://floripa.in9automacao.com.br/hml_*.php` (arquivos com prefixo `hml_`)
- **Frontend Produção**: `https://floripa.in9automacao.com.br/`
- **API Produção**: `https://floripa.in9automacao.com.br/b_*.php` (arquivos com prefixo `b_`)

---

## ⚠️ Características do Ambiente Staging

### Banco de Dados
- ⚠️ **Usa o MESMO banco de produção**
- 🔒 **Modo SOMENTE LEITURA (READ-ONLY)**
- 🚫 **INSERT/UPDATE/DELETE bloqueados automaticamente**
- ✅ **SELECT permitido** (leituras funcionam normalmente)

### Segurança
- Wrapper PDO bloqueia operações de escrita
- Logs detalhados de todas tentativas de escrita
- Identificação clara do ambiente nos logs (`🟡 STAGING`)

---

## 🚀 Como Usar

### 1. Desenvolver Localmente
```bash
# Fazer alterações no código
# Testar localmente
npm start
```

### 2. Build para Staging
```bash
# Build otimizado com environment.staging.ts
npm run build:staging

# Ou comando direto
ng build --configuration staging --output-path www-staging
```

### 3. Deploy para Servidor
Fazer upload dos arquivos para o servidor:

**Frontend Staging:**
- Upload: `www-staging/*` → servidor `/www-staging/`

**Backend Staging (se alterou PHPs):**
- Upload: `api/hml_*.php` → servidor `/api/` (mesma pasta da produção, mas com prefixo `hml_`)

### 4. Testar em Staging
Acessar: `https://floripa.in9automacao.com.br/staging/`

- ✅ Testar leitura de dados (checklists, anomalias, etc.)
- ✅ Testar navegação e interface
- ❌ **Não é possível** criar/editar dados (bloqueado)

### 5. Se Tudo OK, Deploy em Produção
```bash
# Build produção
npm run build

# Upload para /www/
```

---

## 🔧 Comandos Úteis

```bash
# Servir staging localmente
npm run serve:staging

# Build staging
npm run build:staging

# Build produção
npm run build

# Sincronizar código api → api (arquivos hml_*.php) (se criou script)
./sync-staging.sh
```

---

## 📊 Limitações do Staging

### ✅ O que FUNCIONA:
- Login (autenticação)
- Listar checklists (todos os tipos)
- Ver detalhes de inspeções
- Ver anomalias
- Visualizar gráficos e métricas
- Buscar placas
- Ver histórico

### ❌ O que NÃO FUNCIONA:
- Criar novo checklist
- Editar checklist existente
- Deletar dados
- Aprovar/reprovar anomalias
- Criar usuários
- Atualizar configurações
- Executar migrations

---

## 🧪 Para Testar Funcionalidades de Escrita

**Opção 1: Ambiente Local com Banco de Teste**
- Configure um banco de dados local
- Teste todas funcionalidades sem restrições

**Opção 2: Desabilitar READ-ONLY Temporariamente** (⚠️ **CUIDADO**)
```php
// Em api/hml_veicular_config.php
define('READ_ONLY_MODE', false); // ⚠️ PERMITE escritas

// ⚠️ ATENÇÃO: Isso afetará dados de produção!
// ⚠️ Reverter imediatamente após o teste!
```

---

## 🔍 Como Identificar o Ambiente

### No Frontend:
- URL termina com `/staging/`
- Console mostra `environment.production: false`
- DevTools → Network → Chamadas vão para `hml_*.php` (com prefixo hml_)

### No Backend:
- Logs mostram `🟡 STAGING: Requisição recebida`
- Tentativas de escrita: `⛔ STAGING BLOQUEOU`

### Verificar via curl:
```bash
# Testar autenticação staging
curl -X POST https://floripa.in9automacao.com.br/hml_veicular_auth.php \
  -H "Content-Type: application/json" \
  -d '{"acao":"login","email":"test@test.com","senha":"123"}'

# Testar autenticação produção
curl -X POST https://floripa.in9automacao.com.br/b_veicular_auth.php \
  -H "Content-Type: application/json" \
  -d '{"acao":"login","email":"test@test.com","senha":"123"}'
```

---

## 📁 Estrutura de Arquivos

### Localmente:
```
checklist-app/
├── api/                         # Pasta com TODOS os PHPs (produção e staging)
│   ├── b_veicular_get.php       # 🟢 Produção
│   ├── b_veicular_set.php       # 🟢 Produção
│   ├── hml_veicular_get.php     # 🟡 Staging
│   ├── hml_veicular_set.php     # 🟡 Staging
│   └── ...                      # Outros arquivos com prefixos b_ e hml_
├── www/                         # Build produção
├── www-staging/                 # Build staging (gerado por npm run build:staging)
├── src/
│   ├── environments/
│   │   ├── environment.ts          # Dev (usa b_*.php)
│   │   ├── environment.prod.ts     # Produção (usa b_*.php)
│   │   └── environment.staging.ts  # Staging (usa hml_*.php)
```

### No Servidor:
```
public_html/
├── api/                         # Pasta com TODOS os PHPs
│   ├── b_veicular_get.php       # 🟢 Produção
│   ├── hml_veicular_get.php     # 🟡 Staging (READ-ONLY)
│   └── ...                      # Ambos na mesma pasta
├── www/                         # 🟢 Frontend Produção
└── www-staging/                 # 🟡 Frontend Staging
```

---

## ⚙️ Configurações

### Environment Staging:
**Arquivo**: `src/environments/environment.staging.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://floripa.in9automacao.com.br',
  filePrefix: 'hml_'  // Prefixo automático para arquivos PHP
};
```

**Importante**: O `filePrefix` é usado automaticamente pelo `ApiService` para construir as URLs corretas:
- Produção: `https://floripa.in9automacao.com.br/b_veicular_get.php`
- Staging: `https://floripa.in9automacao.com.br/hml_veicular_get.php`

### Angular Config:
**Arquivo**: `angular.json`
- Configuração `staging` adicionada
- Substitui `environment.ts` por `environment.staging.ts` no build

### Package.json:
**Scripts adicionados**:
- `build:staging` - Build para staging
- `serve:staging` - Servir staging localmente

---

## 🚨 Troubleshooting

### Problema: API retorna 500
**Solução**: Verificar logs do servidor
```bash
tail -f /var/log/apache2/error.log | grep "STAGING"
```

### Problema: Frontend usa API de produção
**Solução**: Limpar cache e rebuild
```bash
rm -rf www-staging/
npm run build:staging
```

### Problema: Escritas não estão bloqueadas
**Solução**: Verificar `api/hml_veicular_config.php`
```php
define('READ_ONLY_MODE', true); // Deve ser true
```

### Problema: CORS error
**Causa**: Headers não configurados
**Solução**: Verificar `api/hml_veicular_config.php` headers CORS

---

## 📝 Checklist de Deploy

Antes de fazer deploy em staging:
- [ ] Código testado localmente
- [ ] Build staging executado sem erros
- [ ] Arquivos verificados em `www-staging/`

Após deploy em staging:
- [ ] URL staging acessível
- [ ] Login funciona
- [ ] Leitura de dados funciona
- [ ] Escritas são bloqueadas (esperado)

Antes de deploy em produção:
- [ ] Testes em staging OK
- [ ] Funcionalidades validadas
- [ ] Sem erros no console
- [ ] Performance aceitável

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do servidor
2. Verificar console do navegador (F12)
3. Verificar que está acessando URL correta
4. Verificar que build foi feito com configuração correta

---

## 🎯 Resumo Rápido

```bash
# Desenvolvimento
npm start                    # Dev local

# Staging
npm run build:staging        # Build staging
# → Upload www-staging/ para servidor
# → Testar em /staging/

# Produção
npm run build                # Build prod
# → Upload www/ para servidor
# → Publicar em /
```

**Fluxo**: Local → Staging → Produção ✅
