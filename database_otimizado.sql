-- ============================================
-- SCHEMA OTIMIZADO - Checklist App
-- Data: 2025-12-18
-- Versão: 4.0.0 - Otimização de Database e APIs
-- ============================================

-- Otimizações aplicadas:
-- 1. Unificação de bbb_config_itens + bbb_config_itens_completo
-- 2. Remoção do campo usuario_nome (usar JOIN)
-- 3. Otimização de tipos de dados (nivel_combustivel, ENUMs)
-- 4. Redução de tamanho de fotos (LONGTEXT → MEDIUMTEXT)
-- 5. Índices otimizados

-- ============================================
-- 1. Tabela de Usuários (sem alterações)
-- ============================================
CREATE TABLE IF NOT EXISTS bbb_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'usuario', 'visualizador') DEFAULT 'usuario',
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. Tabela UNIFICADA de Configuração de Itens
-- NOVO: Unificação de bbb_config_itens + bbb_config_itens_completo
-- ============================================
CREATE TABLE IF NOT EXISTS bbb_config_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_checklist ENUM('simples', 'completo') NOT NULL COMMENT 'Tipo de checklist: simples ou completo',
    categoria VARCHAR(50) NOT NULL COMMENT 'MOTOR, ELETRICO, LIMPEZA, FERRAMENTA, PNEU, PARTE1_INTERNA, PARTE2_EQUIPAMENTOS, etc',
    nome_item VARCHAR(100) NOT NULL,
    habilitado TINYINT(1) DEFAULT 1,
    usuario_id INT NULL COMMENT 'ID do usuário que criou o item customizado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES bbb_usuario(id) ON DELETE SET NULL,
    INDEX idx_tipo_categoria (tipo_checklist, categoria),
    INDEX idx_habilitado (habilitado),
    INDEX idx_tipo_habilitado (tipo_checklist, habilitado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. Tabela de Inspeção Veicular (checklist simples)
-- OTIMIZADO: nivel_combustivel como TINYINT, status_geral como ENUM
-- ============================================
CREATE TABLE IF NOT EXISTS bbb_inspecao_veiculo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(20) NOT NULL,
    km_inicial INT NOT NULL,
    nivel_combustivel TINYINT COMMENT '0=0%, 1=25%, 2=50%, 3=75%, 4=100%',
    observacao_painel TEXT,
    data_realizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_geral ENUM('PENDENTE', 'APROVADO', 'REPROVADO') DEFAULT 'PENDENTE',
    usuario_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES bbb_usuario(id) ON DELETE RESTRICT,
    INDEX idx_placa (placa),
    INDEX idx_data_realizacao (data_realizacao),
    INDEX idx_usuario (usuario_id),
    INDEX idx_status (status_geral)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. Tabela de Itens de Inspeção
-- OTIMIZADO: status como ENUM, descricao com tamanho limitado
-- ============================================
CREATE TABLE IF NOT EXISTS bbb_inspecao_item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspecao_id INT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    item VARCHAR(100) NOT NULL,
    status ENUM('bom', 'ruim', 'pessima', 'satisfatoria', 'otimo', 'contem', 'nao_contem') NOT NULL,
    foto MEDIUMTEXT COMMENT 'Base64 da foto - MEDIUMTEXT suporta até 16MB',
    pressao DECIMAL(5,2) COMMENT 'Pressão do pneu (apenas para categoria PNEU)',
    foto_caneta MEDIUMTEXT COMMENT 'Foto com medidor de pressão',
    descricao VARCHAR(500) COMMENT 'Descrição adicional',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspecao_id) REFERENCES bbb_inspecao_veiculo(id) ON DELETE CASCADE,
    INDEX idx_inspecao (inspecao_id),
    INDEX idx_categoria (categoria),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. Tabela de Fotos da Inspeção
-- OTIMIZADO: foto como MEDIUMTEXT, tipo como ENUM
-- ============================================
CREATE TABLE IF NOT EXISTS bbb_inspecao_foto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspecao_id INT NOT NULL,
    tipo ENUM('PAINEL', 'FRONTAL', 'TRASEIRA', 'LATERAL_DIREITA', 'LATERAL_ESQUERDA') NOT NULL,
    foto MEDIUMTEXT NOT NULL COMMENT 'Base64 da foto - MEDIUMTEXT suporta até 16MB',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspecao_id) REFERENCES bbb_inspecao_veiculo(id) ON DELETE CASCADE,
    INDEX idx_inspecao (inspecao_id),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. Tabela de Checklist Completo
-- OTIMIZADO: nivel_combustivel como TINYINT, fotos como MEDIUMTEXT
-- ============================================
CREATE TABLE IF NOT EXISTS bbb_checklist_completo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(20) NOT NULL,
    km_inicial INT NOT NULL,
    nivel_combustivel TINYINT COMMENT '0=0%, 1=25%, 2=50%, 3=75%, 4=100%',
    foto_painel MEDIUMTEXT COMMENT 'Base64 da foto do painel',
    observacao_painel TEXT,
    data_realizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL,
    parte1_interna MEDIUMTEXT COMMENT 'JSON com itens da parte 1',
    parte2_equipamentos MEDIUMTEXT COMMENT 'JSON com itens da parte 2',
    parte3_dianteira MEDIUMTEXT COMMENT 'JSON com itens da parte 3',
    parte4_traseira MEDIUMTEXT COMMENT 'JSON com itens da parte 4',
    parte5_especial MEDIUMTEXT COMMENT 'JSON com itens da parte 5',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES bbb_usuario(id) ON DELETE RESTRICT,
    INDEX idx_placa (placa),
    INDEX idx_data_realizacao (data_realizacao),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. Tabela de Tempo nas Telas (sem alterações significativas)
-- ============================================
CREATE TABLE IF NOT EXISTS bbb_tempo_telas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tela VARCHAR(100) NOT NULL,
    tempo_segundos INT NOT NULL COMMENT 'Tempo em segundos',
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES bbb_usuario(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_tela (tela),
    INDEX idx_data (data_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. Tabela de Status de Anomalias (sem alterações)
-- ============================================
CREATE TABLE IF NOT EXISTS bbb_anomalia_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspecao_id INT NOT NULL,
    descricao TEXT NOT NULL,
    status ENUM('pendente', 'em_analise', 'resolvido', 'ignorado') DEFAULT 'pendente',
    usuario_criacao_id INT NOT NULL COMMENT 'Usuário que reportou',
    usuario_responsavel_id INT NULL COMMENT 'Usuário responsável pela resolução',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_resolucao TIMESTAMP NULL,
    observacoes TEXT,
    FOREIGN KEY (inspecao_id) REFERENCES bbb_inspecao_veiculo(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_criacao_id) REFERENCES bbb_usuario(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_responsavel_id) REFERENCES bbb_usuario(id) ON DELETE SET NULL,
    INDEX idx_inspecao (inspecao_id),
    INDEX idx_status (status),
    INDEX idx_usuario_criacao (usuario_criacao_id),
    INDEX idx_usuario_responsavel (usuario_responsavel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VIEWS AUXILIARES
-- ============================================

-- View para facilitar consultas de inspeções com nome do usuário
CREATE OR REPLACE VIEW v_inspecao_veiculo_completa AS
SELECT
    i.*,
    u.nome as usuario_nome,
    u.email as usuario_email
FROM bbb_inspecao_veiculo i
LEFT JOIN bbb_usuario u ON i.usuario_id = u.id;

-- View para facilitar consultas de checklists completos com nome do usuário
CREATE OR REPLACE VIEW v_checklist_completo_detalhado AS
SELECT
    c.*,
    u.nome as usuario_nome,
    u.email as usuario_email
FROM bbb_checklist_completo c
LEFT JOIN bbb_usuario u ON c.usuario_id = u.id;

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para converter nível de combustível de TINYINT para string
DELIMITER //
CREATE FUNCTION IF NOT EXISTS fn_nivel_combustivel_texto(nivel TINYINT)
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
END//
DELIMITER ;

-- Função para converter string de combustível para TINYINT
DELIMITER //
CREATE FUNCTION IF NOT EXISTS fn_nivel_combustivel_numero(nivel VARCHAR(10))
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
END//
DELIMITER ;

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

-- Tabelas: 8 (antes: 9)
-- Redução: 11%

-- Otimizações de storage:
-- - nivel_combustivel: VARCHAR(10) → TINYINT (economiza ~9 bytes por registro)
-- - status fields: VARCHAR → ENUM (economiza ~10-20 bytes por registro)
-- - fotos: LONGTEXT → MEDIUMTEXT (limite de 16MB é suficiente para fotos comprimidas)
-- - usuario_nome removido das tabelas de configuração (usar JOIN)

-- Índices otimizados:
-- - Índices compostos para queries frequentes
-- - Remoção de índices redundantes
-- - Uso de ENUM para melhor performance

-- Integridade referencial:
-- - ON DELETE CASCADE para dados dependentes
-- - ON DELETE RESTRICT para dados críticos
-- - ON DELETE SET NULL para referências opcionais
