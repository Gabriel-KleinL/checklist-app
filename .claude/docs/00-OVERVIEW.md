# Checklist App - Visão Geral do Projeto

## Descrição
Aplicativo Ionic/Angular para inspeção veicular completa com backend PHP e MySQL.

## Estrutura do Projeto

```
checklist-app/
├── src/                          # Frontend Angular/Ionic
│   ├── app/
│   │   ├── home/                 # Página inicial com seleção de tipo de veículo
│   │   ├── admin/                # Painel administrativo (2180 linhas)
│   │   ├── inspecao-inicial/     # Primeira etapa do checklist
│   │   ├── inspecao-veiculo/     # Inspeção detalhada
│   │   ├── fotos-veiculo/        # Captura de fotos
│   │   ├── pneus/                # Inspeção de pneus
│   │   ├── services/             # Serviços (API, LocalStorage, etc)
│   │   └── models/               # Modelos TypeScript
│   └── assets/                   # Imagens, ícones, etc
│
├── api/                          # Backend PHP (Produção)
│   ├── b_*.php                   # Endpoints principais
│   ├── .env                      # Credenciais (NÃO versionado)
│   └── .env.example              # Template de configuração
│
├── api-staging/                  # Backend PHP (Staging - READ-ONLY)
│   ├── hml_*.php                 # Mesmos endpoints com prefixo hml_
│   └── .env                      # Credenciais staging (NÃO versionado)
│
├── .claude/
│   ├── plans/                    # Planos de implementação
│   └── docs/                     # Documentação técnica (ESTA PASTA)
│
└── android/                      # Build Android (Capacitor)
```

## Stack Tecnológico

### Frontend
- **Framework**: Angular 20.0.0
- **UI**: Ionic 8.0.0
- **Linguagem**: TypeScript 5.8.0
- **Gráficos**: Chart.js 4.5.1
- **PDF**: jsPDF 3.0.3
- **Mobile**: Capacitor 7.4.4

### Backend
- **Linguagem**: PHP 5.6+ (sem composer, sem frameworks)
- **Banco de Dados**: MySQL 5.7+
- **Arquitetura**: API REST procedural

### Banco de Dados
- **Host**: 187.49.226.10:3306
- **Database**: f137049_in9aut
- **Principais Tabelas**:
  - `bbb_inspecao_veiculo` - Checklists simples
  - `bbb_checklist_completo` - Checklists expandidos
  - `bbb_inspecao_item` - Itens de inspeção
  - `bbb_inspecao_foto` - Fotos (⚠️ base64, problema de performance)
  - `bbb_tipos_veiculo` - Tipos de veículos (Carro, Moto, Caminhão)
  - `bbb_anomalia_status` - Controle de anomalias

## Fluxo de Dados

```
[Frontend] → HTTP → [api/b_*.php] → PDO → [MySQL] → JSON → [Frontend]
```

## Ambientes

### Produção (api/)
- URLs: `api/b_*.php`
- Modo: READ + WRITE
- Usado por: Aplicativo em produção

### Staging (api-staging/)
- URLs: `api-staging/hml_*.php`
- Modo: **READ-ONLY** (wrapper de segurança)
- Usado por: Testes e desenvolvimento
- ⚠️ Conecta ao MESMO banco de produção

## Segurança

### ✅ Implementado
- Prepared statements (proteção SQL Injection)
- Headers CORS configurados
- Wrapper READ-ONLY em staging
- Credenciais em .env (desde 13/01/2026)

### ⚠️ Pendente
- Autenticação de usuários em endpoints
- Rate limiting
- Logs de auditoria
- Migração de fotos base64 para filesystem

## Métricas Atuais

| Métrica | Valor |
|---------|-------|
| Linhas PHP (total) | ~10.365 |
| Arquivos PHP | 69 (44 prod + 25 staging) |
| Duplicação PHP | ~40% entre ambientes |
| Linhas TypeScript | ~15.000+ |
| Componentes Angular | 15+ páginas |
| Serviços TypeScript | 12+ |

## Status do Projeto

**Última Atualização**: 13 de Janeiro de 2026

### Funcionalidades Principais
- ✅ Seleção de tipo de veículo
- ✅ Inspeção inicial (placa, KM, combustível)
- ✅ Inspeção detalhada por categoria
- ✅ Captura e armazenamento de fotos
- ✅ Inspeção de pneus
- ✅ Painel administrativo
- ✅ Relatórios e gráficos
- ✅ Controle de anomalias

### Em Desenvolvimento
- 🔄 Limpeza de código (Plano em execução)
- 🔄 Otimização de performance
- 🔄 Migração de fotos para filesystem

## Acesso Rápido

- **Plano de Limpeza**: `/Users/gabrielkleinlima/.claude/plans/melodic-yawning-koala.md`
- **Frontend Local**: http://localhost:4200
- **API Produção**: `/api/b_*.php`
- **API Staging**: `/api-staging/hml_*.php`

## Documentação Adicional

Navegue pelos outros arquivos nesta pasta:
- `01-SECURITY.md` - Segurança e credenciais
- `02-CLEANUP-PLAN.md` - Plano de limpeza em execução
- `03-DATABASE.md` - Estrutura do banco
- `04-API-ENDPOINTS.md` - Documentação de APIs
