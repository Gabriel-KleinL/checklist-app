# 📚 Documentação do Checklist App

Bem-vindo à documentação técnica! Esta pasta contém toda informação necessária para trabalhar no projeto.

## 🚀 Início Rápido

**Novo no projeto?** Leia nesta ordem:
1. `00-OVERVIEW.md` - Entenda a estrutura geral
2. `01-SECURITY.md` - Segurança e credenciais
3. `02-CLEANUP-PLAN.md` - Plano de melhorias em andamento

## 📁 Arquivos Disponíveis

### 00-OVERVIEW.md
**O que é**: Visão geral completa do projeto
**Quando usar**: Primeira leitura, onboarding de novos devs
**Conteúdo**:
- Estrutura de pastas
- Stack tecnológico
- Fluxo de dados
- Métricas do projeto

### 01-SECURITY.md
**O que é**: Guia de segurança e credenciais
**Quando usar**: Antes de mexer com banco de dados ou deploy
**Conteúdo**:
- Como usar arquivos .env
- Vulnerabilidades conhecidas
- Checklist de segurança
- Contatos de emergência

### 02-CLEANUP-PLAN.md
**O que é**: Plano de limpeza de código em execução
**Quando usar**: Antes de implementar melhorias ou refatorações
**Conteúdo**:
- Status atual das fases
- Próximas 5 fases detalhadas
- Recomendações de próximos passos
- Avisos importantes

### 03-IMPLEMENTACOES-RECENTES.md
**O que é**: Registro completo de todas as implementações recentes
**Quando usar**: Para entender o que foi feito recentemente no projeto
**Conteúdo**:
- Backend Node.js para ambiente local
- Migração de Fotos (em progresso)
- Sistema Multi-Veículo
- Migração de Prefixo
- Ambientes de desenvolvimento

## 🎯 Acessos Rápidos

### Para Claude
```
Quando for trabalhar no projeto:
1. Ler 02-CLEANUP-PLAN.md para saber o que fazer próximo
2. Consultar 01-SECURITY.md antes de mexer com credenciais
3. Atualizar 02-CLEANUP-PLAN.md com progresso
```

### Para Desenvolvedores
```bash
# Ver documentação
cd .claude/docs
ls -la

# Plano completo de limpeza
cat ../../.claude/plans/melodic-yawning-koala.md

# Verificar credenciais estão protegidas
git status | grep ".env"  # Não deve aparecer nada
```

## ✅ Status Atual (Janeiro 2026)

| Item | Status |
|------|--------|
| Credenciais em .env | ✅ PROTEGIDO |
| Arquivos TS vazios | ✅ REMOVIDOS |
| Imports não usados | ✅ LIMPO |
| ESLint configurado | ✅ OK |
| Backend Node.js Local | ✅ COMPLETO |
| Sistema Multi-Veículo | ✅ COMPLETO |
| Migração Prefixo | ✅ COMPLETO |
| Migração de Fotos | 🔄 EM PROGRESSO |
| Consolidação PHP | ⏳ Planejado |

## 🔗 Links Importantes

- **Plano Completo**: `../../.claude/plans/melodic-yawning-koala.md`
- **Frontend (local)**: http://localhost:4200
- **API local (Node)**: `http://localhost:8000/api/...` (com compat `/b_*.php`)
- **Git Status**: Fase 1 completa, Fase 2 próxima

## 💡 Dicas

### Antes de Implementar Algo
1. ✅ Ler `02-CLEANUP-PLAN.md` - Pode já estar planejado
2. ✅ Verificar `01-SECURITY.md` - Não vazar credenciais
3. ✅ Consultar `00-OVERVIEW.md` - Entender estrutura

### Ao Fazer Mudanças
1. ✅ Criar TODOs para tarefas complexas
2. ✅ Atualizar `02-CLEANUP-PLAN.md` com progresso
3. ✅ Fazer backup antes de mexer no banco
4. ✅ Testar em staging primeiro

### Ao Finalizar
1. ✅ Atualizar documentação relevante
2. ✅ Marcar tarefas como completas
3. ✅ Adicionar data de última edição

## 📝 Contribuindo

Ao adicionar nova documentação aqui:
- Use numeração (03-, 04-, etc)
- Mantenha formato Markdown
- Adicione link neste README
- Use linguagem clara e objetiva

## 🆘 Precisa de Ajuda?

1. **Problema de segurança**: Leia `01-SECURITY.md`
2. **Não sei o que fazer**: Leia `02-CLEANUP-PLAN.md`
3. **Entender estrutura**: Leia `00-OVERVIEW.md`
4. **Plano completo**: `../../.claude/plans/melodic-yawning-koala.md`

---

**Mantido por**: Claude Sonnet 4.5
**Última atualização**: 13 de Janeiro de 2026
**Próxima revisão**: Após Fase 2
