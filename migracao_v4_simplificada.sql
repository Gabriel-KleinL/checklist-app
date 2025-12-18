-- ============================================
-- SCRIPT DE MIGRAÇÃO SIMPLIFICADO - Versão 4.0.0
-- Data: 2025-12-18
-- ATENÇÃO: Execute este script via linha de comando MySQL
-- Comando: mysql -u [usuario] -p checklist_db < migracao_v4_simplificada.sql
-- ============================================

-- ETAPA 1: Backup das Tabelas Antigas
DROP TABLE IF EXISTS bbb_config_itens_backup_v3;
CREATE TABLE bbb_config_itens_backup_v3 AS SELECT * FROM bbb_config_itens;

DROP TABLE IF EXISTS bbb_config_itens_completo_backup_v3;
CREATE TABLE bbb_config_itens_completo_backup_v3 AS SELECT * FROM bbb_config_itens_completo;

-- ETAPA 2: Criar Nova Tabela Unificada
DROP TABLE IF EXISTS bbb_config_itens_nova;

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

-- ETAPA 3: Migrar Dados para Tabela Unificada
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

-- ETAPA 4: Substituir Tabela Antiga pela Nova
DROP TABLE IF EXISTS bbb_config_itens_old;
DROP TABLE IF EXISTS bbb_config_itens_completo_old;

RENAME TABLE bbb_config_itens TO bbb_config_itens_old;
RENAME TABLE bbb_config_itens_completo TO bbb_config_itens_completo_old;
RENAME TABLE bbb_config_itens_nova TO bbb_config_itens;

-- ETAPA 5: Otimizar bbb_inspecao_veiculo
ALTER TABLE bbb_inspecao_veiculo ADD COLUMN nivel_combustivel_temp TINYINT DEFAULT 0;

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

ALTER TABLE bbb_inspecao_veiculo DROP COLUMN nivel_combustivel;
ALTER TABLE bbb_inspecao_veiculo CHANGE nivel_combustivel_temp nivel_combustivel TINYINT DEFAULT 0;

ALTER TABLE bbb_inspecao_veiculo MODIFY COLUMN status_geral ENUM('PENDENTE', 'APROVADO', 'REPROVADO') DEFAULT 'PENDENTE';

-- ETAPA 6: Otimizar bbb_checklist_completo
ALTER TABLE bbb_checklist_completo ADD COLUMN nivel_combustivel_temp TINYINT DEFAULT 0;

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

ALTER TABLE bbb_checklist_completo DROP COLUMN nivel_combustivel;
ALTER TABLE bbb_checklist_completo CHANGE nivel_combustivel_temp nivel_combustivel TINYINT DEFAULT 0;

ALTER TABLE bbb_checklist_completo MODIFY COLUMN foto_painel MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte1_interna MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte2_equipamentos MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte3_dianteira MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte4_traseira MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte5_especial MEDIUMTEXT;

-- ETAPA 7: Otimizar bbb_inspecao_item
ALTER TABLE bbb_inspecao_item MODIFY COLUMN status ENUM('bom', 'ruim', 'pessima', 'satisfatoria', 'otimo', 'contem', 'nao_contem') NOT NULL;
ALTER TABLE bbb_inspecao_item MODIFY COLUMN foto MEDIUMTEXT;
ALTER TABLE bbb_inspecao_item MODIFY COLUMN foto_caneta MEDIUMTEXT;

-- ETAPA 8: Otimizar bbb_inspecao_foto
ALTER TABLE bbb_inspecao_foto MODIFY COLUMN tipo ENUM('PAINEL', 'FRONTAL', 'TRASEIRA', 'LATERAL_DIREITA', 'LATERAL_ESQUERDA') NOT NULL;
ALTER TABLE bbb_inspecao_foto MODIFY COLUMN foto MEDIUMTEXT NOT NULL;

-- ETAPA 9: Criar Views Auxiliares
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

-- ETAPA 10: Otimizar Tabelas
ANALYZE TABLE bbb_config_itens;
ANALYZE TABLE bbb_inspecao_veiculo;
ANALYZE TABLE bbb_inspecao_item;
ANALYZE TABLE bbb_inspecao_foto;
ANALYZE TABLE bbb_checklist_completo;

OPTIMIZE TABLE bbb_config_itens;
OPTIMIZE TABLE bbb_inspecao_veiculo;
OPTIMIZE TABLE bbb_inspecao_item;
OPTIMIZE TABLE bbb_inspecao_foto;
OPTIMIZE TABLE bbb_checklist_completo;
