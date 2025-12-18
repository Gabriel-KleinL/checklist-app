-- ============================================
-- SCRIPT DE MIGRAÇÃO - Versão 4.0.0
-- Data: 2025-12-18
-- Descrição: Migra database existente para versão otimizada
-- ATENÇÃO: Faz backup antes de executar!
-- ============================================

-- Define delimitador para procedures
DELIMITER $$

-- Variável para controle de erros
SET @erro_migracao = 0;

-- ============================================
-- ETAPA 1: Backup das Tabelas Antigas
-- ============================================

DROP TABLE IF EXISTS bbb_config_itens_backup_v3;
DROP TABLE IF EXISTS bbb_config_itens_completo_backup_v3;

CREATE TABLE bbb_config_itens_backup_v3 AS SELECT * FROM bbb_config_itens;
CREATE TABLE bbb_config_itens_completo_backup_v3 AS SELECT * FROM bbb_config_itens_completo;

SELECT '✅ Etapa 1: Backup criado' as status;

-- ============================================
-- ETAPA 2: Criar Nova Tabela Unificada
-- ============================================

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

SELECT '✅ Etapa 2: Tabela unificada criada' as status;

-- ============================================
-- ETAPA 3: Migrar Dados para Tabela Unificada
-- ============================================

-- Migra dados da tabela simples (removendo campo usuario_nome)
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

-- Migra dados da tabela completo (removendo campo usuario_nome)
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

SELECT CONCAT('✅ Etapa 3: ',
    (SELECT COUNT(*) FROM bbb_config_itens_nova WHERE tipo_checklist='simples'),
    ' itens simples + ',
    (SELECT COUNT(*) FROM bbb_config_itens_nova WHERE tipo_checklist='completo'),
    ' itens completos migrados') as status;

-- ============================================
-- ETAPA 4: Substituir Tabela Antiga pela Nova
-- ============================================

DROP TABLE IF EXISTS bbb_config_itens_old;
DROP TABLE IF EXISTS bbb_config_itens_completo_old;

RENAME TABLE bbb_config_itens TO bbb_config_itens_old;
RENAME TABLE bbb_config_itens_completo TO bbb_config_itens_completo_old;
RENAME TABLE bbb_config_itens_nova TO bbb_config_itens;

SELECT '✅ Etapa 4: Tabelas substituídas' as status;

-- ============================================
-- ETAPA 5: Otimizar bbb_inspecao_veiculo
-- ============================================

-- Adiciona coluna temporária para nivel_combustivel
ALTER TABLE bbb_inspecao_veiculo
ADD COLUMN nivel_combustivel_temp TINYINT DEFAULT 0 COMMENT '0=0%, 1=25%, 2=50%, 3=75%, 4=100%';

-- Converte valores existentes
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

-- Remove coluna antiga e renomeia a nova
ALTER TABLE bbb_inspecao_veiculo DROP COLUMN nivel_combustivel;
ALTER TABLE bbb_inspecao_veiculo CHANGE nivel_combustivel_temp nivel_combustivel TINYINT DEFAULT 0;

-- Altera status_geral para ENUM
ALTER TABLE bbb_inspecao_veiculo
MODIFY COLUMN status_geral ENUM('PENDENTE', 'APROVADO', 'REPROVADO') DEFAULT 'PENDENTE';

SELECT '✅ Etapa 5: bbb_inspecao_veiculo otimizada' as status;

-- ============================================
-- ETAPA 6: Otimizar bbb_checklist_completo
-- ============================================

-- Adiciona coluna temporária para nivel_combustivel
ALTER TABLE bbb_checklist_completo
ADD COLUMN nivel_combustivel_temp TINYINT DEFAULT 0;

-- Converte valores existentes
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

-- Remove coluna antiga e renomeia a nova
ALTER TABLE bbb_checklist_completo DROP COLUMN nivel_combustivel;
ALTER TABLE bbb_checklist_completo CHANGE nivel_combustivel_temp nivel_combustivel TINYINT DEFAULT 0;

-- Altera fotos de LONGTEXT para MEDIUMTEXT
ALTER TABLE bbb_checklist_completo MODIFY COLUMN foto_painel MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte1_interna MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte2_equipamentos MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte3_dianteira MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte4_traseira MEDIUMTEXT;
ALTER TABLE bbb_checklist_completo MODIFY COLUMN parte5_especial MEDIUMTEXT;

SELECT '✅ Etapa 6: bbb_checklist_completo otimizada' as status;

-- ============================================
-- ETAPA 7: Otimizar bbb_inspecao_item
-- ============================================

-- Altera status para ENUM
ALTER TABLE bbb_inspecao_item
MODIFY COLUMN status ENUM('bom', 'ruim', 'pessima', 'satisfatoria', 'otimo', 'contem', 'nao_contem') NOT NULL;

-- Altera fotos para MEDIUMTEXT
ALTER TABLE bbb_inspecao_item MODIFY COLUMN foto MEDIUMTEXT;
ALTER TABLE bbb_inspecao_item MODIFY COLUMN foto_caneta MEDIUMTEXT;

-- Adiciona descrição se não existir
ALTER TABLE bbb_inspecao_item
ADD COLUMN IF NOT EXISTS descricao VARCHAR(500) COMMENT 'Descrição adicional';

SELECT '✅ Etapa 7: bbb_inspecao_item otimizada' as status;

-- ============================================
-- ETAPA 8: Otimizar bbb_inspecao_foto
-- ============================================

-- Altera tipo para ENUM
ALTER TABLE bbb_inspecao_foto
MODIFY COLUMN tipo ENUM('PAINEL', 'FRONTAL', 'TRASEIRA', 'LATERAL_DIREITA', 'LATERAL_ESQUERDA') NOT NULL;

-- Altera foto para MEDIUMTEXT
ALTER TABLE bbb_inspecao_foto MODIFY COLUMN foto MEDIUMTEXT NOT NULL;

SELECT '✅ Etapa 8: bbb_inspecao_foto otimizada' as status;

-- ============================================
-- ETAPA 9: Criar Views Auxiliares
-- ============================================

-- View para inspeções com nome do usuário
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

-- View para checklists completos com nome do usuário
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

SELECT '✅ Etapa 9: Views auxiliares criadas' as status;

-- ============================================
-- ETAPA 10: Criar Funções de Conversão
-- ============================================

-- Função para converter TINYINT para texto
DROP FUNCTION IF EXISTS fn_nivel_combustivel_texto;
CREATE FUNCTION fn_nivel_combustivel_texto(nivel TINYINT)
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
    CASE nivel
        WHEN 0 THEN RETURN '0%';
        WHEN 1 THEN RETURN '25%';
        WHEN 2 THEN RETURN '50%';
        WHEN 3 THEN RETURN '75%';
        WHEN 4 THEN RETURN '100%';
        ELSE RETURN '0%';
    END CASE;
END$$

-- Função para converter texto para TINYINT
DROP FUNCTION IF EXISTS fn_nivel_combustivel_numero;
CREATE FUNCTION fn_nivel_combustivel_numero(nivel VARCHAR(10))
RETURNS TINYINT
DETERMINISTIC
BEGIN
    CASE nivel
        WHEN '0%', 'vazio', 'Vazio' THEN RETURN 0;
        WHEN '25%', '1/4' THEN RETURN 1;
        WHEN '50%', '1/2' THEN RETURN 2;
        WHEN '75%', '3/4' THEN RETURN 3;
        WHEN '100%', 'cheio', 'Cheio' THEN RETURN 4;
        ELSE RETURN 0;
    END CASE;
END$$

DELIMITER ;

SELECT '✅ Etapa 10: Funções de conversão criadas' as status;

-- ============================================
-- ETAPA 11: Otimizar Índices
-- ============================================

-- Remove índices redundantes se existirem
-- (MySQL vai ignorar se não existirem)

-- Otimiza índices de bbb_inspecao_veiculo
DROP INDEX IF EXISTS idx_usuario_nome ON bbb_inspecao_veiculo;

-- Otimiza índices de bbb_checklist_completo
DROP INDEX IF EXISTS idx_usuario_nome ON bbb_checklist_completo;

SELECT '✅ Etapa 11: Índices otimizados' as status;

-- ============================================
-- ETAPA 12: Análise e Otimização Final
-- ============================================

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

SELECT '✅ Etapa 12: Tabelas analisadas e otimizadas' as status;

-- ============================================
-- RESUMO DA MIGRAÇÃO
-- ============================================

SELECT '=====================================' as '';
SELECT '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as '';
SELECT '=====================================' as '';
SELECT '' as '';
SELECT 'Estatísticas:' as '';
SELECT CONCAT('  • Itens config simples: ', (SELECT COUNT(*) FROM bbb_config_itens WHERE tipo_checklist='simples')) as '';
SELECT CONCAT('  • Itens config completo: ', (SELECT COUNT(*) FROM bbb_config_itens WHERE tipo_checklist='completo')) as '';
SELECT CONCAT('  • Total inspeções: ', (SELECT COUNT(*) FROM bbb_inspecao_veiculo)) as '';
SELECT CONCAT('  • Total checklists completos: ', (SELECT COUNT(*) FROM bbb_checklist_completo)) as '';
SELECT '' as '';
SELECT 'Próximos passos:' as '';
SELECT '  1. Testar as novas APIs unificadas' as '';
SELECT '  2. Atualizar frontend (api.service.ts)' as '';
SELECT '  3. Validar funcionalidades' as '';
SELECT '  4. Se tudo OK, remover tabelas backup:' as '';
SELECT '     DROP TABLE bbb_config_itens_old;' as '';
SELECT '     DROP TABLE bbb_config_itens_completo_old;' as '';
SELECT '     DROP TABLE bbb_config_itens_backup_v3;' as '';
SELECT '     DROP TABLE bbb_config_itens_completo_backup_v3;' as '';
SELECT '' as '';
SELECT 'Rollback (se necessário):' as '';
SELECT '  Restaurar backup: mysql < backup_antes_v4_*.sql' as '';
SELECT '=====================================' as '';

-- ============================================
-- SCRIPT PARA VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ============================================

-- Descomente para executar verificações:

-- SELECT 'Verificando integridade...' as status;

-- SELECT
--     'bbb_config_itens' as tabela,
--     COUNT(*) as total_registros,
--     SUM(CASE WHEN tipo_checklist='simples' THEN 1 ELSE 0 END) as simples,
--     SUM(CASE WHEN tipo_checklist='completo' THEN 1 ELSE 0 END) as completo
-- FROM bbb_config_itens;

-- SELECT
--     'bbb_inspecao_veiculo' as tabela,
--     COUNT(*) as total_registros,
--     COUNT(DISTINCT placa) as placas_unicas,
--     MIN(nivel_combustivel) as min_combustivel,
--     MAX(nivel_combustivel) as max_combustivel
-- FROM bbb_inspecao_veiculo;

-- SELECT
--     'bbb_checklist_completo' as tabela,
--     COUNT(*) as total_registros,
--     COUNT(DISTINCT placa) as placas_unicas,
--     MIN(nivel_combustivel) as min_combustivel,
--     MAX(nivel_combustivel) as max_combustivel
-- FROM bbb_checklist_completo;
