# Banco de Dados

## Arquivos

- **`dump_completo.sql`** - Estrutura + dados das tabelas do checklist. Para subir o banco:
  ```bash
  mysql -u root -p nome_do_banco < dump_completo.sql
  ```

- **`DBDIAGRAM_EXPORT.sql`** - Formato DBML para colar no https://dbdiagram.io

## Regra de Alteracoes

Toda alteracao de banco de dados deve ser refletida nestes dois arquivos acima.
**Nao criar novos arquivos SQL.** Apenas modificar `dump_completo.sql` e `DBDIAGRAM_EXPORT.sql`.

## Tabela Vehicles

A tabela `Vehicles` ja existe em producao (outro sistema) e **nao deve ser alterada**.
O checklist usa apenas o campo `LicensePlate` para buscar placas.
Por isso ela nao esta no dump, apenas no diagrama.
