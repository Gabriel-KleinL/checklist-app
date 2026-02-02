// Sistema de Checklist Veicular
// Banco de Dados: f137049_in9aut
// Gerado em: 2026-01-30

Project ChecklistVeicular {
  database_type: 'MySQL'
  Note: 'Sistema completo de checklist veicular com inspecao simplificada, completa e configuracao dinamica'
}

// ========================================
// MODULO: USUARIOS
// ========================================

Table checklist_usuario {
  id int [pk, increment]
  nome varchar(100) [not null, note: 'Nome completo do usuario']
  email varchar(100)
  ativo tinyint(1) [not null, default: 1, note: 'Status ativo/inativo']
  data_criacao timestamp [not null, default: `CURRENT_TIMESTAMP`]
  
  indexes {
    ativo
  }
  
  Note: 'Usuarios do sistema de checklist'
}

// ========================================
// MODULO: TIPOS DE VEICULOS
// ========================================

Table checklist_tipos_veiculo {
  id int [pk, increment]
  nome varchar(50) [not null, unique, note: 'Carro, Moto, Caminhao, Van, Patinete, Bicicleta']
  ativo tinyint(1) [not null, default: 1]
  icone varchar(50) [note: 'Nome do icone Ionic']
  data_criacao timestamp [not null, default: `CURRENT_TIMESTAMP`]
  
  indexes {
    ativo
  }
  
  Note: 'Tipos de veiculos disponiveis no sistema'
}

// ========================================
// MODULO: INSPECAO SIMPLIFICADA
// ========================================

Table checklist_inspecao_veiculo {
  id int [pk, increment]
  usuario_id int [ref: > checklist_usuario.id, note: 'Usuario que realizou (NULL = anonimo)']
  tipo_veiculo_id int [ref: > checklist_tipos_veiculo.id, not null, default: 1]
  dados_inspecao json [note: 'Campos dinamicos: placa, local, km_inicial, nivel_combustivel, observacao_painel, status_geral']
  placa varchar(10) [ref: > Vehicles.LicensePlate, note: 'Extraido automaticamente do JSON via VIRTUAL']
  data_realizacao timestamp [default: `CURRENT_TIMESTAMP`]
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  
  indexes {
    placa
    data_realizacao
    usuario_id
    tipo_veiculo_id
    (usuario_id, data_realizacao)
  }
  
  Note: 'Inspecao simplificada do veiculo (campos configurados pelo admin)'
}

Table checklist_inspecao_item {
  id int [pk, increment]
  inspecao_id int [ref: > checklist_inspecao_veiculo.id, not null]
  categoria varchar(50) [not null, note: 'MOTOR, ELETRICO, LIMPEZA, FERRAMENTA, PNEU']
  item varchar(50) [not null]
  status varchar(50) [not null, note: 'bom, ruim, pessima, satisfatoria, otimo, contem, nao_contem']
  foto mediumtext [note: 'Base64 ou caminho de arquivo']
  observacao varchar(255)
  pressao decimal(5,1) [note: 'Pressao do pneu']
  foto_caneta mediumtext [note: 'Foto com anotacoes']
  descricao text
  
  indexes {
    inspecao_id
    categoria
  }
  
  Note: 'Itens verificados na inspecao (motor, pneus, limpeza, etc)'
}

Table checklist_inspecao_foto {
  id int [pk, increment]
  inspecao_id int [ref: > checklist_inspecao_veiculo.id, not null]
  tipo varchar(50) [not null, note: 'PAINEL, FRONTAL, TRASEIRA, LATERAL_DIREITA, LATERAL_ESQUERDA']
  foto mediumtext [not null, note: 'Base64 ou caminho de arquivo']
  data_upload datetime [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    inspecao_id
    tipo
  }
  
  Note: 'Fotos gerais do veiculo (5 angulos)'
}

// ========================================
// MODULO: CHECKLIST COMPLETO (5 PARTES)
// ========================================

Table checklist_completo {
  id int [pk, increment]
  placa varchar(10) [not null, ref: > Vehicles.LicensePlate]
  km_inicial int
  data_realizacao timestamp [default: `CURRENT_TIMESTAMP`]
  parte1_interna json [note: 'Dados da parte interna']
  parte2_externa json [note: 'Dados da parte externa']
  parte3_acessorios json [note: 'Dados dos acessorios']
  parte4_lataria json [note: 'Dados da lataria']
  parte5_especial json [note: 'Dados especiais']
  usuario_id int [ref: > checklist_usuario.id]
  tipo_veiculo_id int [ref: > checklist_tipos_veiculo.id, not null, default: 1]
  status varchar(20) [default: 'completo']
  created_at timestamp [not null, default: `CURRENT_TIMESTAMP`]
  
  indexes {
    placa
    data_realizacao
    usuario_id
    tipo_veiculo_id
  }
  
  Note: 'Checklist completo dividido em 5 partes (JSON)'
}

// ========================================
// MODULO: CONFIGURACAO SIMPLIFICADO
// ========================================

Table checklist_config_itens {
  id int [pk, increment]
  tipo_checklist varchar(50) [not null, default: 'simplificado', note: 'simplificado ou completo']
  categoria varchar(50) [not null, note: 'MOTOR, ELETRICO, LIMPEZA, FERRAMENTA, PNEU']
  nome_item varchar(100) [not null]
  habilitado tinyint(1) [not null, default: 1]
  tem_foto tinyint(1) [not null, default: 0, note: 'Item requer foto']
  obrigatorio tinyint(1) [not null, default: 0, note: 'Item obrigatorio']
  tipo_resposta enum('conforme_nao_conforme','texto','numero','lista_opcoes') [not null, default: 'conforme_nao_conforme', note: 'Tipo de input na tela de inspecao']
  opcoes_resposta text [note: 'JSON com opcoes para tipo lista_opcoes']
  ordem int
  tipo_veiculo_id int [ref: > checklist_tipos_veiculo.id, note: 'NULL = item geral (varios tipos) | valor = item especifico (um tipo)']
  usuario_id int
  
  indexes {
    (tipo_checklist, categoria)
    habilitado
    tipo_veiculo_id
  }
  
  Note: 'Configuracao de itens do checklist simplificado (arvore de heranca)'
}

Table checklist_config_itens_tipos_veiculo {
  id int [pk, increment]
  config_item_id int [ref: > checklist_config_itens.id, not null]
  tipo_veiculo_id int [ref: > checklist_tipos_veiculo.id, not null]
  
  indexes {
    (config_item_id, tipo_veiculo_id) [unique, name: 'uk_config_tipo']
  }
  
  Note: 'Associacao Many-to-Many: Itens Simplificados e Tipos de Veiculos'
}

Table checklist_config_campos_inspecao {
  id int [pk, increment]
  nome_campo varchar(50) [not null, note: 'Nome interno: placa, local, km_inicial, etc']
  label varchar(100) [not null, note: 'Label exibido na tela']
  tipo_campo varchar(20) [not null, default: 'text', note: 'text, number, select, textarea']
  opcoes text [note: 'JSON com opcoes para campos select']
  obrigatorio tinyint(1) [not null, default: 0]
  tem_foto tinyint(1) [not null, default: 0, note: 'Campo tem foto associada']
  habilitado tinyint(1) [not null, default: 1]
  ordem int
  tipo_veiculo_id int [ref: > checklist_tipos_veiculo.id, note: 'NULL = todos os tipos | valor = tipo especifico']
  data_criacao timestamp [not null, default: `CURRENT_TIMESTAMP`]
  
  indexes {
    (nome_campo, tipo_veiculo_id) [unique, name: 'uk_campo_tipo_veiculo']
    nome_campo
    habilitado
    tipo_veiculo_id
  }
  
  Note: 'Configuracao de campos da tela inicial (dinamica)'
}

// ========================================
// MODULO: CONFIGURACAO COMPLETO
// ========================================

Table checklist_config_itens_completo {
  id int [pk, increment]
  categoria varchar(50) [not null]
  nome_item varchar(100) [not null]
  habilitado tinyint(1) [not null, default: 1]
  ordem int
  tipo_veiculo_id int [ref: > checklist_tipos_veiculo.id]
  usuario_id int
  
  indexes {
    categoria
    habilitado
    tipo_veiculo_id
  }
  
  Note: 'Configuracao de itens do checklist completo'
}

Table checklist_config_itens_completo_tipos_veiculo {
  id int [pk, increment]
  config_item_id int [ref: > checklist_config_itens_completo.id, not null]
  tipo_veiculo_id int [ref: > checklist_tipos_veiculo.id, not null]
  
  indexes {
    (config_item_id, tipo_veiculo_id) [unique, name: 'uk_config_completo_tipo']
  }
  
  Note: 'Associacao Many-to-Many: Itens Completos e Tipos de Veiculos'
}

// ========================================
// MODULO: ANOMALIAS E TRACKING
// ========================================

Table checklist_anomalia_status {
  id int [pk, increment]
  placa varchar(20) [not null, ref: > Vehicles.LicensePlate]
  categoria varchar(50) [not null]
  item varchar(100) [not null]
  status_anomalia varchar(20) [default: 'pendente', note: 'pendente, aprovado, reprovado, finalizado']
  data_criacao timestamp [not null, default: `CURRENT_TIMESTAMP`]
  data_aprovacao timestamp
  data_finalizacao timestamp
  usuario_aprovador_id int [ref: > checklist_usuario.id]
  observacao text
  
  indexes {
    placa
    status_anomalia
    (categoria, item)
    usuario_aprovador_id
  }
  
  Note: 'Rastreamento de anomalias encontradas nas inspecoes'
}

Table checklist_tempo_telas {
  id int [pk, increment]
  inspecao_id int [ref: > checklist_inspecao_veiculo.id, note: 'FK com ON DELETE SET NULL']
  tela varchar(50) [not null, note: 'login, home, inspecao-inicial, pneus, fotos, etc']
  tempo_segundos int [not null, note: 'Tempo gasto na tela em segundos']
  data_registro timestamp [not null, default: `CURRENT_TIMESTAMP`]
  
  indexes {
    inspecao_id
    tela
  }
  
  Note: 'Rastreamento de tempo de uso por tela (performance tracking)'
}

// ========================================
// GRUPOS DE TABELAS (organizacao visual)
// ========================================

TableGroup Usuarios {
  checklist_usuario
}

TableGroup TiposVeiculos {
  checklist_tipos_veiculo
}

TableGroup InspecaoSimplificada {
  checklist_inspecao_veiculo
  checklist_inspecao_item
  checklist_inspecao_foto
}

TableGroup ChecklistCompleto {
  checklist_completo
}

TableGroup ConfiguracaoSimplificado {
  checklist_config_itens
  checklist_config_itens_tipos_veiculo
  checklist_config_campos_inspecao
}

TableGroup ConfiguracaoCompleto {
  checklist_config_itens_completo
  checklist_config_itens_completo_tipos_veiculo
}

TableGroup AnomaliasTracking {
  checklist_anomalia_status
  checklist_tempo_telas
}

// ========================================
// TABELA EXTERNA (ja existe, nao alterar)
// ========================================

Table Vehicles {
  Id int [pk, increment]
  area_id int
  LicensePlate varchar(20) [not null, note: 'Placa do veiculo - usado pelo checklist para buscar placas']
  DriverId int
  IsWhitelisted tinyint(1) [not null, default: 0]
  EngineStatus varchar(50)
  IgnitionStatus varchar(50)
  LastLatitude varchar(255)
  LastLongitude varchar(255)
  LastAddress varchar(255)
  LastSpeed int
  VehicleName varchar(255) [not null]
  VehicleYear varchar(10) [not null]
  Renavam varchar(20) [not null]
  ChassisNumber varchar(50) [not null]
  EnginePower varchar(10) [not null]
  EngineDisplacement varchar(10) [not null]
  Color varchar(50)
  FuelType varchar(50)
  is_munck tinyint(1) [default: 0]
  checklist tinyint(1) [not null, default: 0]
  checklist_timestamp datetime
  Brand varchar(100)
  VehicleType varchar(50)
  EngineNumber varchar(50)
  Mileage int
  DocExpiration date
  DocStatus varchar(30) [default: 'Em dia']
  FipeValue decimal(12,2)
  IpvaCost decimal(10,2)
  InsuranceCost decimal(10,2)
  LicensingCost decimal(10,2)
  DepreciationValue decimal(12,2)
  TrackerCost decimal(10,2) [default: 65.25]

  Note: 'Tabela externa - NAO ALTERAR. O checklist usa apenas LicensePlate para buscar placas.'
}

TableGroup TabelaExterna {
  Vehicles
}
