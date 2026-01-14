-- Alteração necessária no banco LOCAL para compatibilidade com backend Node.js
-- O backend espera que nivel_combustivel seja VARCHAR para armazenar valores como "50%", "75%", etc.

USE checklist_app_local;

ALTER TABLE checklist_inspecao_veiculo 
MODIFY COLUMN nivel_combustivel VARCHAR(10);

-- Nota: Em produção (bbb_inspecao_veiculo) já é VARCHAR
