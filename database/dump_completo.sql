SET NAMES utf8mb4;


DROP TABLE IF EXISTS `checklist_anomalia_status`;
CREATE TABLE `checklist_anomalia_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `placa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `item` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_anomalia` enum('pendente','aprovado','reprovado','finalizado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pendente',
  `data_criacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_aprovacao` timestamp NULL DEFAULT NULL,
  `data_finalizacao` timestamp NULL DEFAULT NULL,
  `usuario_aprovador_id` int DEFAULT NULL,
  `observacao` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_anomalia_placa` (`placa`),
  KEY `idx_anomalia_status` (`status_anomalia`),
  KEY `idx_anomalia_categoria_item` (`categoria`,`item`),
  KEY `idx_anomalia_usuario_aprovador` (`usuario_aprovador_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_anomalia_status` VALUES (1,'XYZ5678','FERRAMENTA','Extintor','pendente','2026-01-10 15:12:24',NULL,NULL,NULL,'Extintor vencido, necessita substituição'),(2,'XYZ5678','PNEU','Pneu traseiro direito','pendente','2026-01-10 15:12:24',NULL,NULL,NULL,'Desgaste excessivo, troca urgente'),(3,'GHI3456','MOTOR','Óleo do motor','aprovado','2026-01-12 15:12:24','2026-01-12 15:12:24',NULL,1,'Vazamento aprovado para correção'),(4,'GHI3456','ELETRICO','Bateria','reprovado','2026-01-12 15:12:24','2026-01-12 15:12:24',NULL,1,'Bateria não precisa ser trocada'),(5,'VWX4567','ELETRICO','Faróis','finalizado','2026-01-07 15:12:24','2026-01-08 15:12:24','2026-01-09 15:12:24',1,'Problema elétrico corrigido');
DROP TABLE IF EXISTS `checklist_completo`;
CREATE TABLE `checklist_completo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `placa` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `km_inicial` int DEFAULT NULL,
  `data_realizacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `parte1_interna` json DEFAULT NULL,
  `parte2_externa` json DEFAULT NULL,
  `parte3_acessorios` json DEFAULT NULL,
  `parte4_lataria` json DEFAULT NULL,
  `parte5_especial` json DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `tipo_veiculo_id` int NOT NULL DEFAULT '1',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'completo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_checklist_completo_placa` (`placa`),
  KEY `idx_checklist_completo_data` (`data_realizacao`),
  KEY `idx_checklist_completo_usuario` (`usuario_id`),
  KEY `idx_checklist_completo_tipo` (`tipo_veiculo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_completo` VALUES (1,'ABC1234',50000,'2026-01-08 15:12:24','{\"cinto\": true, \"bancos\": true, \"pedais\": true, \"volante\": true}','{\"portas\": true, \"parabrisa\": true, \"retrovisores\": true}','{\"radio\": true, \"ar_condicionado\": true}','{\"pintura\": true, \"amassados\": false}','{\"documentacao\": true}',2,1,'completo','2026-01-08 15:12:24'),(2,'XYZ5678',75000,'2026-01-10 15:12:24','{\"cinto\": true, \"bancos\": true, \"pedais\": false, \"volante\": true}','{\"portas\": false, \"parabrisa\": true, \"retrovisores\": true}','{\"radio\": false, \"ar_condicionado\": true}','{\"pintura\": false, \"amassados\": true}','{\"documentacao\": true}',3,1,'completo','2026-01-10 15:12:24'),(3,'DEF9012',30000,'2026-01-11 15:12:24','{\"cinto\": true, \"bancos\": true, \"pedais\": true, \"volante\": true}','{\"portas\": true, \"parabrisa\": true, \"retrovisores\": true}','{\"radio\": true, \"ar_condicionado\": true}','{\"pintura\": true, \"amassados\": false}','{\"documentacao\": true}',2,2,'completo','2026-01-11 15:12:24');
DROP TABLE IF EXISTS `checklist_config_campos_inspecao`;
CREATE TABLE `checklist_config_campos_inspecao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome_campo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_campo` enum('text','number','select','textarea') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `opcoes` text COLLATE utf8mb4_unicode_ci,
  `obrigatorio` tinyint(1) NOT NULL DEFAULT '0',
  `tem_foto` tinyint(1) NOT NULL DEFAULT '0',
  `habilitado` tinyint(1) NOT NULL DEFAULT '1',
  `ordem` int DEFAULT NULL,
  `tipo_veiculo_id` int DEFAULT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_campo_tipo_veiculo` (`nome_campo`,`tipo_veiculo_id`),
  KEY `idx_config_campo_nome` (`nome_campo`),
  KEY `idx_config_campo_habilitado` (`habilitado`),
  KEY `idx_config_campo_tipo_veiculo` (`tipo_veiculo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_config_campos_inspecao` VALUES (1,'placa','Placa do Veículo','text',NULL,1,0,1,1,NULL,'2026-01-16 10:24:05'),(2,'local','Local','text',NULL,0,0,1,2,NULL,'2026-01-16 10:24:05'),(3,'km_inicial','Km Inicial','number',NULL,0,0,1,3,NULL,'2026-01-16 10:24:05'),(4,'nivel_combustivel','Nível de Combustível','select','[\"Vazio\",\"1/4\",\"1/2\",\"3/4\",\"Cheio\"]',0,0,1,4,NULL,'2026-01-16 10:24:05'),(5,'observacao_painel','Observação do Painel','textarea',NULL,0,1,1,5,NULL,'2026-01-16 10:24:05'),(6,'status_geral','Status Geral','select','[\"Bom\",\"Regular\",\"Ruim\"]',0,0,0,6,NULL,'2026-01-16 10:24:05');
DROP TABLE IF EXISTS `checklist_config_itens`;
CREATE TABLE `checklist_config_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_checklist` enum('simplificado','completo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'simplificado',
  `categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_item` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `habilitado` tinyint(1) NOT NULL DEFAULT '1',
  `tem_foto` tinyint(1) NOT NULL DEFAULT '0',
  `obrigatorio` tinyint(1) NOT NULL DEFAULT '0',
  `tipo_resposta` enum('conforme_nao_conforme','texto','numero','lista_opcoes') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'conforme_nao_conforme',
  `opcoes_resposta` text COLLATE utf8mb4_unicode_ci,
  `ordem` int DEFAULT NULL,
  `tipo_veiculo_id` int DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_config_tipo_categoria` (`tipo_checklist`,`categoria`),
  KEY `idx_config_habilitado` (`habilitado`),
  KEY `idx_config_tipo_veiculo` (`tipo_veiculo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_config_itens` VALUES (1,'simplificado','MOTOR','Óleo do motor',1,0,0,'conforme_nao_conforme',NULL,1,1,1),(2,'simplificado','MOTOR','Água do radiador',1,0,0,'conforme_nao_conforme',NULL,2,1,1),(3,'simplificado','MOTOR','Correia dentada',1,0,0,'conforme_nao_conforme',NULL,3,1,1),(4,'simplificado','ELETRICO','Bateria',1,0,0,'conforme_nao_conforme',NULL,1,NULL,1),(5,'simplificado','ELETRICO','Faróis',1,0,0,'conforme_nao_conforme',NULL,2,NULL,1),(6,'simplificado','ELETRICO','Luzes de freio',1,0,0,'conforme_nao_conforme',NULL,3,NULL,1),(7,'simplificado','LIMPEZA','Lavagem externa',1,0,0,'conforme_nao_conforme',NULL,1,NULL,1),(8,'simplificado','LIMPEZA','Lavagem interna',1,0,0,'conforme_nao_conforme',NULL,2,NULL,1),(9,'simplificado','FERRAMENTA','Macaco',1,0,0,'conforme_nao_conforme',NULL,1,NULL,1),(10,'simplificado','FERRAMENTA','Chave de roda',1,0,0,'conforme_nao_conforme',NULL,2,NULL,1),(11,'simplificado','FERRAMENTA','Extintor',1,0,0,'conforme_nao_conforme',NULL,3,NULL,1),(12,'simplificado','PNEU','Pneu dianteiro direito',1,0,0,'conforme_nao_conforme',NULL,1,NULL,1),(13,'simplificado','PNEU','Pneu dianteiro esquerdo',1,0,0,'conforme_nao_conforme',NULL,2,NULL,1),(14,'simplificado','PNEU','Pneu traseiro direito',1,0,0,'conforme_nao_conforme',NULL,3,NULL,1),(15,'simplificado','PNEU','Pneu traseiro esquerdo',1,0,0,'conforme_nao_conforme',NULL,4,NULL,1),(16,'simplificado','PNEU','Estepe',1,0,0,'conforme_nao_conforme',NULL,5,NULL,1),(17,'simplificado','FERRAMENTA','Capacete',1,0,0,'conforme_nao_conforme',NULL,10,2,1),(18,'simplificado','MOTOR','Carenagem',1,0,0,'conforme_nao_conforme',NULL,10,2,1),(19,'simplificado','MOTOR','Corrente/transmissão',1,0,0,'conforme_nao_conforme',NULL,11,2,1),(20,'simplificado','ELETRICO','Tacógrafo',1,0,0,'conforme_nao_conforme',NULL,10,NULL,1),(21,'simplificado','FERRAMENTA','Extintor adicional',1,0,0,'conforme_nao_conforme',NULL,10,NULL,1),(22,'simplificado','FERRAMENTA','Cinto 3 pontos',1,0,0,'conforme_nao_conforme',NULL,11,NULL,1),(23,'simplificado','PNEU','Pneu traseiro interno direito',1,0,0,'conforme_nao_conforme',NULL,10,3,1),(24,'simplificado','PNEU','Pneu traseiro interno esquerdo',1,0,0,'conforme_nao_conforme',NULL,11,3,1),(25,'simplificado','PNEU','Pneu traseiro interno direito',1,0,0,'conforme_nao_conforme',NULL,10,4,1),(26,'simplificado','PNEU','Pneu traseiro interno esquerdo',1,0,0,'conforme_nao_conforme',NULL,11,4,1),(27,'simplificado','PNEU','Pneu dianteiro',1,0,0,'conforme_nao_conforme',NULL,1,2,1),(28,'simplificado','PNEU','Pneu traseiro',1,0,0,'conforme_nao_conforme',NULL,2,2,1),(29,'simplificado','PNEU','Vareta de óleo',1,0,0,'conforme_nao_conforme',NULL,NULL,1,2),(30,'simplificado','PNEU','Caneta',1,1,1,'numero',NULL,NULL,1,2);
DROP TABLE IF EXISTS `checklist_config_itens_completo`;
CREATE TABLE `checklist_config_itens_completo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categoria` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_item` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `habilitado` tinyint(1) NOT NULL DEFAULT '1',
  `tem_foto` tinyint(1) NOT NULL DEFAULT '0',
  `obrigatorio` tinyint(1) NOT NULL DEFAULT '0',
  `ordem` int DEFAULT NULL,
  `tipo_veiculo_id` int DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_config_completo_categoria` (`categoria`),
  KEY `idx_config_completo_habilitado` (`habilitado`),
  KEY `idx_config_completo_tipo_veiculo` (`tipo_veiculo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_config_itens_completo` VALUES (1,'INTERNA','Volante',1,0,0,1,NULL,1),(2,'INTERNA','Pedais',1,0,0,2,NULL,1),(3,'INTERNA','Bancos',1,0,0,3,NULL,1),(4,'INTERNA','Cinto de segurança',1,0,0,4,NULL,1),(5,'EXTERNA','Para-brisa',1,0,0,1,NULL,1),(6,'EXTERNA','Retrovisores',1,0,0,2,NULL,1),(7,'EXTERNA','Portas',1,0,0,3,NULL,1),(8,'ACESSORIOS','Rádio',1,0,0,1,NULL,1),(9,'ACESSORIOS','Ar condicionado',1,0,0,2,NULL,1),(10,'LATARIA','Pintura',1,0,0,1,NULL,1),(11,'LATARIA','Amassados',1,0,0,2,NULL,1),(12,'ESPECIAL','Documentação',1,0,0,1,NULL,1);
DROP TABLE IF EXISTS `checklist_config_itens_completo_tipos_veiculo`;
CREATE TABLE `checklist_config_itens_completo_tipos_veiculo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_item_id` int NOT NULL,
  `tipo_veiculo_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_completo_tipo` (`config_item_id`,`tipo_veiculo_id`),
  KEY `fk_tipo_veiculo_completo` (`tipo_veiculo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
DROP TABLE IF EXISTS `checklist_config_itens_tipos_veiculo`;
CREATE TABLE `checklist_config_itens_tipos_veiculo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_item_id` int NOT NULL,
  `tipo_veiculo_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_tipo` (`config_item_id`,`tipo_veiculo_id`),
  KEY `fk_tipo_veiculo` (`tipo_veiculo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_config_itens_tipos_veiculo` VALUES (1,4,1),(2,4,2),(3,4,3),(4,4,4),(5,4,5),(6,5,1),(7,5,2),(8,5,3),(9,5,4),(10,5,5),(11,6,1),(12,6,2),(13,6,3),(14,6,4),(15,6,5),(16,7,1),(17,7,3),(18,7,4),(19,7,5),(20,8,1),(21,8,3),(22,8,4),(23,8,5),(24,9,1),(25,9,3),(26,9,4),(27,9,5),(28,10,1),(29,10,3),(30,10,4),(31,10,5),(32,11,1),(33,11,2),(34,11,3),(35,11,4),(36,11,5),(37,12,1),(39,12,3),(40,12,4),(41,12,5),(42,13,1),(44,13,3),(45,13,4),(46,13,5),(47,14,1),(49,14,3),(50,14,4),(51,14,5),(52,15,1),(54,15,3),(55,15,4),(56,15,5),(57,16,1),(58,16,3),(59,16,4),(60,16,5),(61,17,2),(62,18,2),(63,19,2),(64,20,3),(65,20,4),(66,21,3),(67,21,4),(68,22,3),(69,22,4),(70,23,3),(71,24,3),(72,25,4),(73,26,4),(74,27,2),(75,28,2);
DROP TABLE IF EXISTS `checklist_inspecao_foto`;
CREATE TABLE `checklist_inspecao_foto` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inspecao_id` int NOT NULL,
  `tipo` enum('PAINEL','FRONTAL','TRASEIRA','LATERAL_DIREITA','LATERAL_ESQUERDA') NOT NULL,
  `foto` mediumtext NOT NULL,
  `data_upload` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inspecao_foto_inspecao_id` (`inspecao_id`),
  KEY `idx_foto_tipo` (`tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_inspecao_foto` VALUES (1,1,'PAINEL','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','2026-01-13 18:12:24'),(2,1,'FRONTAL','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','2026-01-13 18:12:24'),(3,2,'PAINEL','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','2026-01-13 18:12:24'),(4,3,'FRONTAL','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','2026-01-13 18:12:24'),(5,5,'PAINEL','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','2026-01-13 18:12:24'),(6,13,'PAINEL','fotos/2026/01/13_inspecao_painel_02a6d459909dd443.png','2026-01-14 15:07:41'),(7,14,'PAINEL','fotos/2026/01/14_inspecao_painel_b92751fe7d7499fa.png','2026-01-14 15:17:37'),(8,14,'FRONTAL','fotos/2026/01/14_update_frontal_9990f54e37e73c9d.png','2026-01-14 15:20:03'),(9,14,'TRASEIRA','fotos/2026/01/14_update_traseira_cf37bcff537ef0f4.png','2026-01-14 15:20:03'),(10,14,'LATERAL_DIREITA','fotos/2026/01/14_update_lateral_direita_e9632585461e1e6c.png','2026-01-14 15:20:03'),(11,14,'LATERAL_ESQUERDA','fotos/2026/01/14_update_lateral_esquerda_c1e9ffaa02d99f76.png','2026-01-14 15:20:03'),(12,15,'PAINEL','fotos/2026/01/15_inspecao_painel_65d78b901017d092.png','2026-01-14 15:31:10'),(13,15,'FRONTAL','fotos/2026/01/15_update_frontal_ace09b71c4d21aec.png','2026-01-14 15:31:13'),(14,15,'TRASEIRA','fotos/2026/01/15_update_traseira_feab9fab3b3a39a8.png','2026-01-14 15:31:13'),(15,15,'LATERAL_DIREITA','fotos/2026/01/15_update_lateral_direita_01b570f7f908aa2c.png','2026-01-14 15:31:13'),(16,15,'LATERAL_ESQUERDA','fotos/2026/01/15_update_lateral_esquerda_3f94af74ddb23e0b.png','2026-01-14 15:31:13');
DROP TABLE IF EXISTS `checklist_inspecao_item`;
CREATE TABLE `checklist_inspecao_item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inspecao_id` int NOT NULL,
  `categoria` enum('MOTOR','ELETRICO','LIMPEZA','FERRAMENTA','PNEU') NOT NULL,
  `item` varchar(50) NOT NULL,
  `status` enum('bom','ruim','pessima','satisfatoria','otimo','contem','nao_contem') NOT NULL,
  `foto` mediumtext,
  `observacao` varchar(255) DEFAULT NULL,
  `pressao` decimal(5,1) DEFAULT NULL,
  `foto_caneta` mediumtext,
  `descricao` text,
  PRIMARY KEY (`id`),
  KEY `idx_inspecao_item_inspecao_id` (`inspecao_id`),
  KEY `idx_item_categoria` (`categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_inspecao_item` VALUES (1,1,'MOTOR','Óleo do motor','bom',NULL,'Nível adequado',NULL,NULL,NULL),(2,1,'MOTOR','Água do radiador','bom',NULL,'Nível correto',NULL,NULL,NULL),(3,1,'ELETRICO','Bateria','otimo',NULL,'Bateria nova',NULL,NULL,NULL),(4,1,'PNEU','Pneu dianteiro direito','bom',NULL,'Pressão OK',32.0,NULL,NULL),(5,1,'PNEU','Pneu dianteiro esquerdo','bom',NULL,'Pressão OK',32.0,NULL,NULL),(6,2,'MOTOR','Óleo do motor','satisfatoria',NULL,'Necessita troca em breve',NULL,NULL,NULL),(7,2,'FERRAMENTA','Extintor','ruim',NULL,'Vencido',NULL,NULL,NULL),(8,2,'PNEU','Pneu traseiro direito','pessima',NULL,'Desgaste excessivo',28.0,NULL,NULL),(9,3,'ELETRICO','Faróis','otimo',NULL,'Funcionando perfeitamente',NULL,NULL,NULL),(10,3,'PNEU','Estepe','bom',NULL,'Pressão adequada',35.0,NULL,NULL),(11,4,'MOTOR','Óleo do motor','ruim',NULL,'Vazamento detectado',NULL,NULL,NULL),(12,4,'ELETRICO','Bateria','ruim',NULL,'Bateria descarregada',NULL,NULL,NULL),(13,5,'LIMPEZA','Lavagem externa','otimo',NULL,'Veículo limpo',NULL,NULL,NULL),(14,5,'FERRAMENTA','Macaco','bom',NULL,'Presente e funcional',NULL,NULL,NULL),(15,6,'PNEU','Pneu dianteiro direito','ruim',NULL,'Necessita troca',25.0,NULL,NULL),(16,6,'PNEU','Pneu dianteiro esquerdo','ruim',NULL,'Necessita troca',25.0,NULL,NULL),(17,12,'MOTOR','Óleo do motor','bom',NULL,'Nível adequado',NULL,NULL,NULL),(18,12,'ELETRICO','Bateria','otimo',NULL,'Bateria nova',NULL,NULL,NULL),(19,12,'PNEU','Pneu dianteiro direito','bom',NULL,'Pressão OK',32.0,NULL,NULL),(20,14,'MOTOR','Água do radiador','ruim','fotos/2026/01/14_item_Água_do_radiador_fbbe95cd3fce6614.png',NULL,NULL,NULL,'asasassa'),(21,14,'MOTOR','Correia dentada','bom',NULL,NULL,NULL,NULL,NULL),(22,14,'MOTOR','Óleo do motor','bom',NULL,NULL,NULL,NULL,NULL),(23,14,'ELETRICO','Bateria','bom',NULL,NULL,NULL,NULL,NULL),(24,14,'ELETRICO','Faróis','bom',NULL,NULL,NULL,NULL,NULL),(25,14,'ELETRICO','Luzes de freio','bom',NULL,NULL,NULL,NULL,NULL),(26,14,'LIMPEZA','Lavagem externa','satisfatoria',NULL,NULL,NULL,NULL,NULL),(27,14,'LIMPEZA','Lavagem interna','otimo',NULL,NULL,NULL,NULL,NULL),(28,14,'FERRAMENTA','Chave de roda','contem',NULL,NULL,NULL,NULL,NULL),(29,14,'FERRAMENTA','Extintor','contem',NULL,NULL,NULL,NULL,NULL),(30,14,'FERRAMENTA','Macaco','contem',NULL,NULL,NULL,NULL,NULL),(31,15,'MOTOR','Água do radiador','ruim','fotos/2026/01/15_item_Água_do_radiador_80fa6311e456fbb6.png',NULL,NULL,NULL,'asasassa'),(32,15,'MOTOR','Correia dentada','bom',NULL,NULL,NULL,NULL,NULL),(33,15,'MOTOR','Óleo do motor','bom',NULL,NULL,NULL,NULL,NULL),(34,15,'ELETRICO','Bateria','bom',NULL,NULL,NULL,NULL,NULL),(35,15,'ELETRICO','Faróis','bom',NULL,NULL,NULL,NULL,NULL),(36,15,'ELETRICO','Luzes de freio','bom',NULL,NULL,NULL,NULL,NULL),(37,15,'LIMPEZA','Lavagem externa','satisfatoria',NULL,NULL,NULL,NULL,NULL),(38,15,'LIMPEZA','Lavagem interna','otimo',NULL,NULL,NULL,NULL,NULL),(39,15,'FERRAMENTA','Chave de roda','contem',NULL,NULL,NULL,NULL,NULL),(40,15,'FERRAMENTA','Extintor','contem',NULL,NULL,NULL,NULL,NULL),(41,15,'FERRAMENTA','Macaco','contem',NULL,NULL,NULL,NULL,NULL),(42,15,'PNEU','Bateria','bom','fotos/2026/01/15_pneu_Bateria_b3bb003a6522e382.png',NULL,NULL,NULL,NULL),(43,15,'PNEU','Faróis','bom',NULL,NULL,NULL,NULL,NULL),(44,15,'PNEU','Luzes de freio','bom',NULL,NULL,NULL,NULL,NULL),(45,15,'PNEU','Chave de roda','bom',NULL,NULL,NULL,NULL,NULL),(46,15,'PNEU','Extintor','bom',NULL,NULL,NULL,NULL,NULL),(47,15,'PNEU','Macaco','bom',NULL,NULL,NULL,NULL,NULL),(48,15,'PNEU','Lavagem externa','bom',NULL,NULL,NULL,NULL,NULL),(49,15,'PNEU','Lavagem interna','bom',NULL,NULL,NULL,NULL,NULL),(50,15,'PNEU','Água do radiador','bom',NULL,NULL,NULL,NULL,NULL),(51,15,'PNEU','Correia dentada','bom',NULL,NULL,NULL,NULL,NULL),(52,15,'PNEU','Óleo do motor','bom',NULL,NULL,NULL,NULL,NULL),(53,15,'PNEU','Estepe','bom',NULL,NULL,NULL,NULL,NULL),(54,15,'PNEU','Pneu dianteiro direito','bom',NULL,NULL,NULL,NULL,NULL),(55,15,'PNEU','Pneu dianteiro esquerdo','bom',NULL,NULL,NULL,NULL,NULL),(56,15,'PNEU','Pneu traseiro direito','bom',NULL,NULL,NULL,NULL,NULL),(57,15,'PNEU','Pneu traseiro esquerdo','bom',NULL,NULL,NULL,NULL,NULL);
DROP TABLE IF EXISTS `checklist_inspecao_veiculo`;
CREATE TABLE `checklist_inspecao_veiculo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `tipo_veiculo_id` int NOT NULL DEFAULT '1',
  `dados_inspecao` json DEFAULT NULL,
  `data_realizacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `placa` varchar(10) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (json_unquote(json_extract(`dados_inspecao`,_utf8mb4'$.placa'))) VIRTUAL,
  PRIMARY KEY (`id`),
  KEY `idx_inspecao_data` (`data_realizacao`),
  KEY `idx_inspecao_usuario` (`usuario_id`),
  KEY `idx_inspecao_tipo_veiculo` (`tipo_veiculo_id`),
  KEY `idx_inspecao_usuario_data` (`usuario_id`,`data_realizacao`),
  KEY `idx_inspecao_placa` (`placa`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_inspecao_veiculo` (`id`, `usuario_id`, `tipo_veiculo_id`, `dados_inspecao`, `data_realizacao`, `created_at`) VALUES (1,2,1,'{\"local\": \"Garagem Central\", \"placa\": \"ABC1234\", \"km_inicial\": 50000, \"status_geral\": \"aprovado\", \"nivel_combustivel\": \"3\", \"observacao_painel\": \"Veículo em bom estado geral\"}','2026-01-08 15:12:24','2026-01-08 15:12:24'),(2,3,1,'{\"local\": \"Pátio Norte\", \"placa\": \"XYZ5678\", \"km_inicial\": 75000, \"status_geral\": \"reprovado\", \"nivel_combustivel\": \"2\", \"observacao_painel\": \"Necessita revisão de freios\"}','2026-01-10 15:12:24','2026-01-10 15:12:24'),(3,2,2,'{\"local\": \"Garagem Sul\", \"placa\": \"DEF9012\", \"km_inicial\": 30000, \"status_geral\": \"aprovado\", \"nivel_combustivel\": \"4\", \"observacao_painel\": \"Veículo novo, sem problemas\"}','2026-01-11 15:12:24','2026-01-11 15:12:24'),(4,4,3,'{\"local\": \"Pátio Leste\", \"placa\": \"GHI3456\", \"km_inicial\": 120000, \"status_geral\": \"reprovado\", \"nivel_combustivel\": \"1\", \"observacao_painel\": \"Veículo com muitos problemas\"}','2026-01-12 15:12:24','2026-01-12 15:12:24'),(5,3,1,'{\"local\": \"Garagem Oeste\", \"placa\": \"JKL7890\", \"km_inicial\": 45000, \"status_geral\": \"aprovado\", \"nivel_combustivel\": \"3\", \"observacao_painel\": \"Estado satisfatório\"}','2026-01-13 15:12:24','2026-01-13 15:12:24'),(6,2,4,'{\"local\": \"Pátio Central\", \"placa\": \"MNO2345\", \"km_inicial\": 90000, \"status_geral\": \"pendente\", \"nivel_combustivel\": \"2\", \"observacao_painel\": \"Necessita troca de pneus\"}','2026-01-13 15:12:24','2026-01-13 15:12:24'),(7,4,1,'{\"local\": \"Garagem Norte\", \"placa\": \"PQR6789\", \"km_inicial\": 60000, \"status_geral\": \"aprovado\", \"nivel_combustivel\": \"4\", \"observacao_painel\": \"Veículo em excelente estado\"}','2026-01-06 15:12:24','2026-01-06 15:12:24'),(8,3,5,'{\"local\": \"Pátio Sul\", \"placa\": \"STU0123\", \"km_inicial\": 85000, \"status_geral\": \"aprovado\", \"nivel_combustivel\": \"3\", \"observacao_painel\": \"Revisão preventiva realizada\"}','2026-01-09 15:12:24','2026-01-09 15:12:24'),(9,2,2,'{\"local\": \"Garagem Leste\", \"placa\": \"VWX4567\", \"km_inicial\": 55000, \"status_geral\": \"reprovado\", \"nivel_combustivel\": \"2\", \"observacao_painel\": \"Problemas elétricos detectados\"}','2026-01-07 15:12:24','2026-01-07 15:12:24'),(10,4,3,'{\"local\": \"Pátio Oeste\", \"placa\": \"YZA8901\", \"km_inicial\": 110000, \"status_geral\": \"pendente\", \"nivel_combustivel\": \"1\", \"observacao_painel\": \"Veículo antigo, necessita manutenção\"}','2026-01-13 15:12:24','2026-01-13 15:12:24'),(11,2,1,'{\"local\": \"Teste Local\", \"placa\": \"TEST123\", \"km_inicial\": 50000, \"status_geral\": \"PENDENTE\", \"nivel_combustivel\": \"50%\", \"observacao_painel\": \"Teste backend Node.js\"}','2026-01-14 12:09:34','2026-01-14 12:09:34'),(12,1,1,'{\"local\": \"Garagem Central\", \"placa\": \"ABC1D23\", \"km_inicial\": 35000, \"status_geral\": \"aprovado\", \"nivel_combustivel\": \"3\", \"observacao_painel\": \"Veículo de teste - ABC1D23\"}','2026-01-14 14:20:13','2026-01-14 14:20:13'),(13,1,1,'{\"local\": \"Santa Tereza\", \"placa\": \"ABC1D23\", \"km_inicial\": 1234, \"status_geral\": \"PENDENTE\", \"nivel_combustivel\": \"50%\", \"observacao_painel\": \"\"}','2026-01-14 15:07:42','2026-01-14 15:07:41'),(14,1,1,'{\"local\": \"Santa Tereza\", \"placa\": \"ABC1D23\", \"km_inicial\": 1234, \"status_geral\": \"PENDENTE\", \"nivel_combustivel\": \"50%\", \"observacao_painel\": \"\"}','2026-01-14 15:17:37','2026-01-14 15:17:37'),(15,1,1,'{\"local\": \"Santa Tereza\", \"placa\": \"ABC1D23\", \"km_inicial\": 1234, \"status_geral\": \"PENDENTE\", \"nivel_combustivel\": \"50%\", \"observacao_painel\": \"\"}','2026-01-14 15:31:10','2026-01-14 15:31:10');
DROP TABLE IF EXISTS `checklist_tempo_telas`;
CREATE TABLE `checklist_tempo_telas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inspecao_id` int DEFAULT NULL,
  `tela` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tempo_segundos` int NOT NULL,
  `data_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tempo_inspecao` (`inspecao_id`),
  KEY `idx_tempo_tela` (`tela`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_tempo_telas` VALUES (1,1,'inspecao-inicial',45,'2026-01-08 15:12:24'),(2,1,'inspecao-veiculo',180,'2026-01-08 15:12:24'),(3,1,'fotos',120,'2026-01-08 15:12:24'),(4,2,'inspecao-inicial',60,'2026-01-10 15:12:24'),(5,2,'inspecao-veiculo',240,'2026-01-10 15:12:24'),(6,3,'inspecao-inicial',30,'2026-01-11 15:12:24'),(7,3,'inspecao-veiculo',150,'2026-01-11 15:12:24'),(8,NULL,'inspecao-inicial',120,'2026-01-14 15:14:12'),(9,NULL,'inspecao-inicial',0,'2026-01-14 15:17:35'),(10,14,'inspecao-veiculo',127,'2026-01-14 15:19:43'),(11,14,'fotos-veiculo',19,'2026-01-14 15:20:03'),(12,15,'inspecao-inicial',39,'2026-01-14 15:31:10'),(13,15,'inspecao-veiculo',2,'2026-01-14 15:31:12'),(14,15,'fotos-veiculo',1,'2026-01-14 15:31:13'),(15,15,'pneus',1,'2026-01-14 15:31:14'),(16,NULL,'inspecao-inicial',6,'2026-01-15 12:29:03');
DROP TABLE IF EXISTS `checklist_tipos_veiculo`;
CREATE TABLE `checklist_tipos_veiculo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `icone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_nome` (`nome`),
  KEY `idx_ativo` (`ativo`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_tipos_veiculo` VALUES (1,'Carro',1,'car-outline','2026-01-13 15:12:24'),(2,'Moto',0,'bicycle-outline','2026-01-13 15:12:24'),(3,'Caminhão',0,'cube-outline','2026-01-13 15:12:24'),(4,'Ônibus',0,'bus-outline','2026-01-13 15:12:24'),(5,'Van',0,'car-sport-outline','2026-01-13 15:12:24');
DROP TABLE IF EXISTS `checklist_usuario`;
CREATE TABLE `checklist_usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `tipo_usuario` enum('admin','comum') COLLATE utf8mb4_unicode_ci DEFAULT 'comum',
  `tutorial_concluido` tinyint(1) DEFAULT '0',
  `data_criacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_usuario_ativo` (`ativo`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `checklist_usuario` VALUES (1,'Admin Sistema','admin@checklist.local','admin123',1,'comum',1,'2026-01-13 15:12:24'),(2,'João Silva','joao.silva@checklist.local','joao123',1,'comum',1,'2026-01-13 15:12:24'),(3,'Maria Santos','maria.santos@checklist.local','maria123',1,'comum',0,'2026-01-13 15:12:24'),(4,'Pedro Oliveira','pedro.oliveira@checklist.local','pedro123',1,'comum',0,'2026-01-13 15:12:24'),(5,'Ana Costa','ana.costa@checklist.local','ana123',0,'comum',0,'2026-01-13 15:12:24'),(6,'teste','teste@checklist.local','teste123',1,'comum',0,'2026-01-14 11:40:01');

ALTER TABLE `checklist_anomalia_status` ADD CONSTRAINT `fk_anomalia_usuario_aprovador` FOREIGN KEY (`usuario_aprovador_id`) REFERENCES `checklist_usuario` (`id`) ON DELETE SET NULL;
ALTER TABLE `checklist_completo` ADD CONSTRAINT `fk_checklist_tipo_veiculo` FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `checklist_tipos_veiculo` (`id`) ON DELETE RESTRICT;
ALTER TABLE `checklist_completo` ADD CONSTRAINT `fk_checklist_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `checklist_usuario` (`id`) ON DELETE SET NULL;
ALTER TABLE `checklist_config_campos_inspecao` ADD CONSTRAINT `fk_config_campo_tipo_veiculo` FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `checklist_tipos_veiculo` (`id`) ON DELETE CASCADE;
ALTER TABLE `checklist_config_itens` ADD CONSTRAINT `fk_config_tipo_veiculo` FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `checklist_tipos_veiculo` (`id`) ON DELETE SET NULL;
ALTER TABLE `checklist_config_itens_completo` ADD CONSTRAINT `fk_config_completo_tipo_veiculo` FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `checklist_tipos_veiculo` (`id`) ON DELETE SET NULL;
ALTER TABLE `checklist_config_itens_completo_tipos_veiculo` ADD CONSTRAINT `fk_config_item_completo` FOREIGN KEY (`config_item_id`) REFERENCES `checklist_config_itens_completo` (`id`) ON DELETE CASCADE;
ALTER TABLE `checklist_config_itens_completo_tipos_veiculo` ADD CONSTRAINT `fk_tipo_veiculo_completo` FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `checklist_tipos_veiculo` (`id`) ON DELETE CASCADE;
ALTER TABLE `checklist_config_itens_tipos_veiculo` ADD CONSTRAINT `fk_config_item` FOREIGN KEY (`config_item_id`) REFERENCES `checklist_config_itens` (`id`) ON DELETE CASCADE;
ALTER TABLE `checklist_config_itens_tipos_veiculo` ADD CONSTRAINT `fk_tipo_veiculo` FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `checklist_tipos_veiculo` (`id`) ON DELETE CASCADE;
ALTER TABLE `checklist_inspecao_foto` ADD CONSTRAINT `fk_foto_inspecao` FOREIGN KEY (`inspecao_id`) REFERENCES `checklist_inspecao_veiculo` (`id`) ON DELETE CASCADE;
ALTER TABLE `checklist_inspecao_item` ADD CONSTRAINT `fk_item_inspecao` FOREIGN KEY (`inspecao_id`) REFERENCES `checklist_inspecao_veiculo` (`id`) ON DELETE CASCADE;
ALTER TABLE `checklist_inspecao_veiculo` ADD CONSTRAINT `fk_inspecao_tipo_veiculo` FOREIGN KEY (`tipo_veiculo_id`) REFERENCES `checklist_tipos_veiculo` (`id`) ON DELETE RESTRICT;
ALTER TABLE `checklist_inspecao_veiculo` ADD CONSTRAINT `fk_inspecao_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `checklist_usuario` (`id`) ON DELETE SET NULL;
ALTER TABLE `checklist_tempo_telas` ADD CONSTRAINT `fk_tempo_inspecao` FOREIGN KEY (`inspecao_id`) REFERENCES `checklist_inspecao_veiculo` (`id`) ON DELETE SET NULL;
