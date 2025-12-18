# 🚨 Instruções de Migração - v4.0.0

## ⚠️ Problema com phpMyAdmin

O script original (`migracao_v4.sql`) não funciona no phpMyAdmin porque ele não executa múltiplos statements SQL de uma vez.

---

## ✅ SOLUÇÃO 1: Usar Linha de Comando (RECOMENDADO)

### **Passo 1: Fazer Backup**
```bash
mysqldump -u seu_usuario -p checklist_db > backup_antes_v4_$(date +%Y%m%d_%H%M%S).sql
```

### **Passo 2: Executar Migração via CLI**
```bash
mysql -u seu_usuario -p checklist_db < migracao_v4_simplificada.sql
```

### **Passo 3: Verificar se funcionou**
```bash
mysql -u seu_usuario -p checklist_db -e "
SELECT 'Migração concluída!' as status;
SELECT COUNT(*) as total_itens,
       SUM(CASE WHEN tipo_checklist='simples' THEN 1 ELSE 0 END) as simples,
       SUM(CASE WHEN tipo_checklist='completo' THEN 1 ELSE 0 END) as completo
FROM bbb_config_itens;
"
```

---

## ✅ SOLUÇÃO 2: Usar phpMyAdmin (Passo a Passo)

Se você **precisa** usar o phpMyAdmin, execute os comandos **UM POR VEZ** na ordem abaixo:

### **ETAPA 1: Backup**
```sql
DROP TABLE IF EXISTS bbb_config_itens_backup_v3;
```
Execute ↑, depois:
```sql
CREATE TABLE bbb_config_itens_backup_v3 AS SELECT * FROM bbb_config_itens;
```
Execute ↑, depois:
```sql
DROP TABLE IF EXISTS bbb_config_itens_completo_backup_v3;
```
Execute ↑, depois:
```sql
CREATE TABLE bbb_config_itens_completo_backup_v3 AS SELECT * FROM bbb_config_itens_completo;
```

### **ETAPA 2: Criar Tabela Nova**
```sql
DROP TABLE IF EXISTS bbb_config_itens_nova;
```
Execute ↑, depois:
```sql
CREATE TABLE bbb_config_itens_nova (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_checklist ENUM('simples', 'completo') NOT NULL COMMENT 'Tipo de checklist',
    categoria VARCHAR(50) NOT NULL,
    nome_item VARCHAR(100) NOT NULL,
    habilitado TINYINT(1) DEFAULT 1,
    usuario_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES bbb_usuario(id) ON DELETE SET NULL,
    INDEX idx_tipo_categoria (tipo_checklist, categoria),
    INDEX idx_habilitado (habilitado),
    INDEX idx_tipo_habilitado (tipo_checklist, habilitado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### **ETAPA 3: Migrar Dados**
```sql
INSERT INTO bbb_config_itens_nova (tipo_checklist, categoria, nome_item, habilitado, usuario_id, created_at, updated_at)
SELECT
    'simples' as tipo_checklist,
    categoria,
    nome_item,
    habilitado,
    usuario_id,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM bbb_config_itens_backup_v3;
```
Execute ↑, depois:
```sql
INSERT INTO bbb_config_itens_nova (tipo_checklist, categoria, nome_item, habilitado, usuario_id, created_at, updated_at)
SELECT
    'completo' as tipo_checklist,
    categoria,
    nome_item,
    habilitado,
    usuario_id,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM bbb_config_itens_completo_backup_v3;
```

### **ETAPA 4: Substituir Tabelas**
```sql
RENAME TABLE bbb_config_itens TO bbb_config_itens_old;
```
Execute ↑, depois:
```sql
RENAME TABLE bbb_config_itens_completo TO bbb_config_itens_completo_old;
```
Execute ↑, depois:
```sql
RENAME TABLE bbb_config_itens_nova TO bbb_config_itens;
```

### **ETAPA 5: Otimizar nivel_combustivel em bbb_inspecao_veiculo**
```sql
ALTER TABLE bbb_inspecao_veiculo ADD COLUMN nivel_combustivel_temp TINYINT DEFAULT 0;
```
Execute ↑, depois:
```sql
UPDATE bbb_inspecao_veiculo SET nivel_combustivel_temp =
    CASE nivel_combustivel
        WHEN '0%' THEN 0
        WHEN 'vazio' THEN 0
        WHEN 'Vazio' THEN 0
        WHEN '25%' THEN 1
        WHEN '1/4' THEN 1
        WHEN '50%' THEN 2
        WHEN '1/2' THEN 2
        WHEN '75%' THEN 3
        WHEN '3/4' THEN 3
        WHEN '100%' THEN 4
        WHEN 'cheio' THEN 4
        WHEN 'Cheio' THEN 4
        ELSE 0
    END;
```
Execute ↑, depois:
```sql
ALTER TABLE bbb_inspecao_veiculo DROP COLUMN nivel_combustivel;
```
Execute ↑, depois:
```sql
ALTER TABLE bbb_inspecao_veiculo CHANGE nivel_combustivel_temp nivel_combustivel TINYINT DEFAULT 0;
```
Execute ↑, depois:
```sql
ALTER TABLE bbb_inspecao_veiculo MODIFY COLUMN status_geral ENUM('PENDENTE', 'APROVADO', 'REPROVADO') DEFAULT 'PENDENTE';
```

### **ETAPA 6: Otimizar nivel_combustivel em bbb_checklist_completo**
```sql
ALTER TABLE bbb_checklist_completo ADD COLUMN nivel_combustivel_temp TINYINT DEFAULT 0;
```
Execute ↑, depois:
```sql
UPDATE bbb_checklist_completo SET nivel_combustivel_temp =
    CASE nivel_combustivel
        WHEN '0%' THEN 0
        WHEN 'vazio' THEN 0
        WHEN 'Vazio' THEN 0
        WHEN '25%' THEN 1
        WHEN '1/4' THEN 1
        WHEN '50%' THEN 2
        WHEN '1/2' THEN 2
        WHEN '75%' THEN 3
        WHEN '3/4' THEN 3
        WHEN '100%' THEN 4
        WHEN 'cheio' THEN 4
        WHEN 'Cheio' THEN 4
        ELSE 0
    END;
```
Execute ↑, depois:
```sql
ALTER TABLE bbb_checklist_completo DROP COLUMN nivel_combustivel;
```
Execute ↑, depois:
```sql
ALTER TABLE bbb_checklist_completo CHANGE nivel_combustivel_temp nivel_combustivel TINYINT DEFAULT 0;
```

### **ETAPA 7: Otimizar fotos em bbb_checklist_completo**
```sql
ALTER TABLE bbb_checklist_completo MODIFY COLUMN foto_painel MEDIUMTEXT;
```
Execute ↑, depois cada uma destas:
```sql
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte1_interna MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte2_equipamentos MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte3_dianteira MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte4_traseira MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte5_especial MEDIUMTEXT;
```

### **ETAPA 8: Otimizar bbb_inspecao_item**
```sql
ALTER TABLE bbb_inspecao_item MODIFY COLUMN status ENUM('bom', 'ruim', 'pessima', 'satisfatoria', 'otimo', 'contem', 'nao_contem') NOT NULL;
```
Execute ↑, depois:
```sql
ALTER TABLE bbb_inspecao_item MODIFY COLUMN foto MEDIUMTEXT;
```
Execute ↑, depois:
```sql
ALTER TABLE bbb_inspecao_item MODIFY COLUMN foto_caneta MEDIUMTEXT;
```

### **ETAPA 9: Otimizar bbb_inspecao_foto**
```sql
ALTER TABLE bbb_inspecao_foto MODIFY COLUMN tipo ENUM('PAINEL', 'FRONTAL', 'TRASEIRA', 'LATERAL_DIREITA', 'LATERAL_ESQUERDA') NOT NULL;
```
Execute ↑, depois:
```sql
ALTER TABLE bbb_inspecao_foto MODIFY COLUMN foto MEDIUMTEXT NOT NULL;
```

### **ETAPA 10: Criar Views**
```sql
CREATE OR REPLACE VIEW v_inspecao_veiculo_completa AS
SELECT
    i.*,
    u.nome as usuario_nome,
    u.email as usuario_email,
    CASE i.nivel_combustivel
        WHEN 0 THEN '0%'
        WHEN 1 THEN '25%'
        WHEN 2 THEN '50%'
        WHEN 3 THEN '75%'
        WHEN 4 THEN '100%'
        ELSE '0%'
    END as nivel_combustivel_texto
FROM bbb_inspecao_veiculo i
LEFT JOIN bbb_usuario u ON i.usuario_id = u.id;
```
Execute ↑, depois:
```sql
CREATE OR REPLACE VIEW v_checklist_completo_detalhado AS
SELECT
    c.*,
    u.nome as usuario_nome,
    u.email as usuario_email,
    CASE c.nivel_combustivel
        WHEN 0 THEN '0%'
        WHEN 1 THEN '25%'
        WHEN 2 THEN '50%'
        WHEN 3 THEN '75%'
        WHEN 4 THEN '100%'
        ELSE '0%'
    END as nivel_combustivel_texto
FROM bbb_checklist_completo c
LEFT JOIN bbb_usuario u ON c.usuario_id = u.id;
```

### **ETAPA 11: Otimizar Tabelas**
```sql
OPTIMIZE TABLE bbb_config_itens;
OPTIMIZE TABLE bbb_inspecao_veiculo;
OPTIMIZE TABLE bbb_inspecao_item;
OPTIMIZE TABLE bbb_inspecao_foto;
OPTIMIZE TABLE bbb_checklist_completo;
```

---

## ✅ Verificar se Funcionou

Execute no phpMyAdmin ou CLI:
```sql
SELECT
    'bbb_config_itens' as tabela,
    COUNT(*) as total,
    SUM(CASE WHEN tipo_checklist='simples' THEN 1 ELSE 0 END) as simples,
    SUM(CASE WHEN tipo_checklist='completo' THEN 1 ELSE 0 END) as completo
FROM bbb_config_itens;
```

Resultado esperado:
- **total** = soma de itens simples + completo
- **simples** = quantidade original de `bbb_config_itens`
- **completo** = quantidade original de `bbb_config_itens_completo`

---

## 🔄 Rollback (Se der problema)

```sql
-- Restaurar tabelas originais
DROP TABLE bbb_config_itens;
RENAME TABLE bbb_config_itens_old TO bbb_config_itens;
RENAME TABLE bbb_config_itens_completo_old TO bbb_config_itens_completo;

-- Ou restaurar do backup SQL
-- mysql -u seu_usuario -p checklist_db < backup_antes_v4_*.sql
```

---

## 📞 Dúvidas?

Consulte o arquivo `MIGRACAO_V4.md` para documentação completa!
