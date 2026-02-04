# Regras do Projeto

## Banco de Dados

Toda alteracao de banco de dados (criar tabela, alterar coluna, adicionar dados, etc.) deve ser refletida nos dois arquivos existentes em `database/`:

1. **`database/dump_completo.sql`** - Atualizar com a estrutura e dados completos
2. **`database/DBDIAGRAM_EXPORT.sql`** - Atualizar o diagrama DBML

**Nao criar novos arquivos SQL.** Apenas modificar os dois arquivos acima.
