# DOCUMENTAÇÃO COMPLETA - ENDPOINTS E BANCO DE DADOS

Sistema de Checklist Veicular - Backend PHP + MySQL

**Base URL**: `https://floripa.in9automacao.com.br`

**Última atualização**: 2026-01-05

---

## ÍNDICE

1. [Endpoints - Anomalias](#1-endpoints---anomalias)
2. [Endpoints - Configuração de Itens Simples](#2-endpoints---configuração-de-itens-simples)
3. [Endpoints - Configuração de Itens Completo](#3-endpoints---configuração-de-itens-completo)
4. [Endpoints - Checklists](#4-endpoints---checklists)
5. [Endpoints - Tempo de Telas](#5-endpoints---tempo-de-telas)
6. [Estrutura do Banco de Dados](#6-estrutura-do-banco-de-dados)

---

## 1. ENDPOINTS - ANOMALIAS

### 1.1 Buscar Anomalias

**Arquivo PHP**: `b_veicular_anomalias.php`

**URL Completa**: `https://floripa.in9automacao.com.br/b_veicular_anomalias.php`

**Método**: `GET`

**Parâmetros Query**:
- `tipo` (string, opcional): `"ativas"` ou `"finalizadas"` (padrão: "ativas")

**Exemplos de URLs**:
```
https://floripa.in9automacao.com.br/b_veicular_anomalias.php?tipo=ativas
https://floripa.in9automacao.com.br/b_veicular_anomalias.php?tipo=finalizadas
```

**Resposta** (JSON):
```json
[
  {
    "placa": "ABC1234",
    "total_problemas": 3,
    "total_inspecoes_com_problema": 2,
    "data_ultima_inspecao": "2025-12-29 10:30:00",
    "anomalias": [
      {
        "inspecao_id": 123,
        "inspecoes_ids": [123, 124],
        "data_realizacao": "2025-12-29 10:30:00",
        "km_inicial": 10000,
        "categoria": "MOTOR",
        "item": "Óleo do motor",
        "status": "Ruim",
        "statuses": ["Ruim", "Crítico"],
        "foto": "data:image/jpeg;base64,...",
        "usuario_nome": "João Silva",
        "usuarios": ["João Silva", "Maria Santos"],
        "total_ocorrencias": 2,
        "status_anomalia": "pendente",
        "data_aprovacao": null,
        "data_finalizacao": null,
        "observacao": null,
        "usuario_aprovador_id": null,
        "usuario_aprovador_nome": null
      }
    ]
  }
]
```

**Status de Anomalias**:
- `pendente`: Anomalia detectada, aguardando ação (padrão)
- `aprovado`: Anomalia confirmada pelo admin
- `reprovado`: Falso positivo, anomalia rejeitada (não aparece na listagem de ativas)
- `finalizado`: Problema resolvido

**Tabela do Banco**: `bbb_anomalia_status`

---

### 1.2 Atualizar Status de Anomalia

**Arquivo PHP**: `b_anomalia_status.php`

**URL Completa**: `https://floripa.in9automacao.com.br/b_anomalia_status.php`

**Método**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "placa": "ABC1234",
  "categoria": "MOTOR",
  "item": "Óleo do motor",
  "acao": "aprovar",
  "usuario_id": 1,
  "observacao": "Necessita troca urgente"
}
```

**Parâmetros Body**:
- `placa` (string, obrigatório): Placa do veículo em maiúsculas
- `categoria` (string, obrigatório): MOTOR, ELETRICO, LIMPEZA, FERRAMENTA, PNEU
- `item` (string, obrigatório): Nome exato do item
- `acao` (string, obrigatório): "aprovar", "reprovar" ou "finalizar"
- `usuario_id` (number, opcional): ID do usuário que está fazendo a ação
- `observacao` (string, opcional): Observações sobre a ação

**Ações Disponíveis**:
1. **aprovar**: Confirma que a anomalia é real
   - Define `status_anomalia = 'aprovado'`
   - Registra `data_aprovacao = NOW()`
   - Registra `usuario_aprovador_id`

2. **reprovar**: Marca como falso positivo
   - Define `status_anomalia = 'reprovado'`
   - Remove da listagem de anomalias ativas

3. **finalizar**: Marca como resolvida
   - Define `status_anomalia = 'finalizado'`
   - Registra `data_finalizacao = NOW()`
   - Move para listagem de finalizadas

**Resposta** (JSON):
```json
{
  "sucesso": true,
  "mensagem": "Status atualizado com sucesso",
  "novo_status": "aprovado"
}
```

**Tabela do Banco**: `bbb_anomalia_status`

---

### 1.3 Buscar Status de Anomalia Específica

**Arquivo PHP**: `b_anomalia_status.php`

**URL Completa**: `https://floripa.in9automacao.com.br/b_anomalia_status.php`

**Método**: `GET`

**Parâmetros Query**:
- `placa` (string, obrigatório)
- `categoria` (string, obrigatório)
- `item` (string, obrigatório)

**Exemplo**:
```
https://floripa.in9automacao.com.br/b_anomalia_status.php?placa=ABC1234&categoria=MOTOR&item=Óleo do motor
```

**Resposta** (JSON):
```json
{
  "id": 1,
  "placa": "ABC1234",
  "categoria": "MOTOR",
  "item": "Óleo do motor",
  "status_anomalia": "aprovado",
  "data_aprovacao": "2025-12-29 10:30:00",
  "data_finalizacao": null,
  "usuario_aprovador_id": 1,
  "observacao": "Necessita troca urgente"
}
```

Se não encontrar, retorna:
```json
{
  "status_anomalia": "pendente"
}
```

---

## 2. ENDPOINTS - CONFIGURAÇÃO DE ITENS SIMPLES

**Arquivo PHP**: `b_veicular_config_itens.php`

**URL Base**: `https://floripa.in9automacao.com.br/b_veicular_config_itens.php`

**Tabela do Banco**: `bbb_config_itens`

**Categorias Válidas**:
- `MOTOR`
- `ELETRICO`
- `LIMPEZA`
- `FERRAMENTA`
- `PNEU`

---

### 2.1 Buscar Todos os Itens

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_veicular_config_itens.php?acao=todos
```

**Resposta** (JSON):
```json
[
  {
    "id": 1,
    "categoria": "MOTOR",
    "nome_item": "Óleo do motor",
    "habilitado": 1,
    "usuario_id": 1,
    "usuario_nome": "Admin",
    "data_criacao": "2025-12-01 00:00:00",
    "data_atualizacao": "2025-12-29 10:00:00"
  }
]
```

---

### 2.2 Buscar Itens por Categoria

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_veicular_config_itens.php?acao=categoria&categoria=MOTOR
```

**Parâmetros Query**:
- `acao` = "categoria"
- `categoria` = MOTOR | ELETRICO | LIMPEZA | FERRAMENTA | PNEU

**Resposta**: Array de itens (mesmo formato do "todos")

---

### 2.3 Buscar Apenas Itens Habilitados

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_veicular_config_itens.php?acao=habilitados
https://floripa.in9automacao.com.br/b_veicular_config_itens.php?acao=habilitados&categoria=MOTOR
```

**Parâmetros Query**:
- `acao` = "habilitados"
- `categoria` (opcional) = MOTOR | ELETRICO | LIMPEZA | FERRAMENTA | PNEU

**Resposta**: Array de itens habilitados (habilitado = 1)

---

### 2.4 Atualizar Item (Habilitar/Desabilitar)

**Método**: `POST`

**URL**: `https://floripa.in9automacao.com.br/b_veicular_config_itens.php`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "acao": "atualizar_item",
  "id": 1,
  "habilitado": false
}
```

**Parâmetros**:
- `acao` = "atualizar_item"
- `id` (number, obrigatório)
- `habilitado` (boolean, obrigatório): true ou false

**Resposta**:
```json
{
  "sucesso": true,
  "mensagem": "Item atualizado com sucesso",
  "linhas_afetadas": 1
}
```

---

### 2.5 Atualizar Múltiplos Itens

**Método**: `POST`

**URL**: `https://floripa.in9automacao.com.br/b_veicular_config_itens.php`

**Body** (JSON):
```json
{
  "acao": "atualizar_multiplos",
  "itens": [
    { "id": 1, "habilitado": true },
    { "id": 2, "habilitado": false },
    { "id": 3, "habilitado": true }
  ]
}
```

**Resposta**:
```json
{
  "sucesso": true,
  "mensagem": "3 itens atualizados com sucesso"
}
```

---

### 2.6 Adicionar Novo Item

**Método**: `POST`

**URL**: `https://floripa.in9automacao.com.br/b_veicular_config_itens.php`

**Body** (JSON):
```json
{
  "acao": "adicionar_item",
  "categoria": "MOTOR",
  "nome_item": "Filtro de ar",
  "habilitado": true,
  "usuario_id": 1,
  "usuario_nome": "Admin"
}
```

**Parâmetros**:
- `acao` = "adicionar_item"
- `categoria` (string, obrigatório): MOTOR | ELETRICO | LIMPEZA | FERRAMENTA | PNEU
- `nome_item` (string, obrigatório)
- `habilitado` (boolean, opcional): padrão = true
- `usuario_id` (number, opcional)
- `usuario_nome` (string, opcional)

**Resposta**:
```json
{
  "sucesso": true,
  "mensagem": "Item adicionado com sucesso",
  "id": 15
}
```

---

### 2.7 Remover Item

**Método**: `DELETE`

**URL**: `https://floripa.in9automacao.com.br/b_veicular_config_itens.php`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "id": 15
}
```

**Resposta** (sucesso):
```json
{
  "sucesso": true,
  "mensagem": "Item removido com sucesso"
}
```

**Resposta** (não encontrado):
```json
{
  "sucesso": false,
  "mensagem": "Item não encontrado"
}
```

---

## 3. ENDPOINTS - CONFIGURAÇÃO DE ITENS COMPLETO

**Arquivo PHP**: `b_checklist_completo_config_itens.php`

**URL Base**: `https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php`

**Tabela do Banco**: `bbb_config_itens_completo`

**Categorias Válidas**:
- `PARTE1_INTERNA` - Parte interna do veículo
- `PARTE2_EQUIPAMENTOS` - Equipamentos obrigatórios
- `PARTE3_DIANTEIRA` - Parte dianteira
- `PARTE4_TRASEIRA` - Parte traseira
- `PARTE5_ESPECIAL` - Veículos pesados/especiais

---

### 3.1 Buscar Todos os Itens (Completo)

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php?acao=todos
```

**Resposta** (JSON):
```json
[
  {
    "id": 1,
    "categoria": "PARTE1_INTERNA",
    "nome_item": "Painel de instrumentos",
    "habilitado": 1,
    "usuario_id": 1,
    "usuario_nome": "Admin"
  }
]
```

---

### 3.2 Buscar por Categoria (Completo)

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php?acao=categoria&categoria=PARTE1_INTERNA
```

---

### 3.3 Buscar Apenas Habilitados (Completo)

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php?acao=habilitados
https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php?acao=habilitados&categoria=PARTE1_INTERNA
```

---

### 3.4 Buscar Agrupados por Parte

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php?acao=por_parte
```

**Resposta** (JSON):
```json
{
  "PARTE1_INTERNA": [
    { "id": 1, "nome_item": "Painel", "habilitado": 1 }
  ],
  "PARTE2_EQUIPAMENTOS": [
    { "id": 5, "nome_item": "Extintor", "habilitado": 1 }
  ],
  "PARTE3_DIANTEIRA": [...],
  "PARTE4_TRASEIRA": [...],
  "PARTE5_ESPECIAL": [...]
}
```

---

### 3.5 Atualizar/Adicionar/Remover (Completo)

Os métodos são **idênticos** aos do checklist simples, apenas muda a URL e as categorias válidas.

**Atualizar**:
```json
POST https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php
{
  "acao": "atualizar_item",
  "id": 1,
  "habilitado": false
}
```

**Adicionar**:
```json
POST https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php
{
  "acao": "adicionar_item",
  "categoria": "PARTE1_INTERNA",
  "nome_item": "Ar condicionado",
  "habilitado": true
}
```

**Remover**:
```json
DELETE https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php
{
  "id": 25
}
```

---

## 4. ENDPOINTS - CHECKLISTS

### 4.1 Buscar Checklist por ID

**Arquivo PHP**: `b_veicular_get.php`

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_veicular_get.php?acao=id&id=123
```

**Resposta** (JSON):
```json
{
  "inspecao": {
    "id": 123,
    "placa": "ABC1234",
    "local": "Metropolitana - Serra",
    "data_realizacao": "2025-12-29 10:30:00",
    "km_inicial": 10000,
    "nivel_combustivel": "75%",
    "observacao_painel": "Painel ok",
    "status_geral": "APROVADO",
    "usuario_id": 1
  },
  "fotos": [
    { "tipo": "PAINEL", "foto": "data:image/jpeg;base64,..." },
    { "tipo": "FRONTAL", "foto": "data:image/jpeg;base64,..." }
  ],
  "itens": [
    {
      "categoria": "MOTOR",
      "item": "Óleo do motor",
      "status": "Bom",
      "foto": "data:image/jpeg;base64,..."
    }
  ]
}
```

**Tabelas do Banco**:
- `bbb_inspecao_veiculo` (inspeção principal)
- `bbb_inspecao_foto` (fotos)
- `bbb_inspecao_item` (itens inspecionados)

---

### 4.2 Validar Placa

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_veicular_get.php?acao=validar_placa&placa=ABC1234
```

**Resposta** (placa existe):
```json
{
  "sucesso": true,
  "placa": "ABC1234"
}
```

**Resposta** (placa não existe):
```json
{
  "sucesso": false,
  "erro": "Placa não encontrada no cadastro de veículos"
}
```

**Tabela do Banco**: `Vehicles` (tabela de cadastro de veículos)

---

## 5. ENDPOINTS - TEMPO DE TELAS

**Arquivo PHP**: `b_veicular_tempotelas.php`

**URL Base**: `https://floripa.in9automacao.com.br/b_veicular_tempotelas.php`

**Tabela do Banco**: `bbb_tempo_telas`

---

### 5.1 Salvar Tempo de Tela

**Método**: `POST`

**URL**: `https://floripa.in9automacao.com.br/b_veicular_tempotelas.php`

**Body** (JSON):
```json
{
  "inspecao_id": 123,
  "usuario_id": 1,
  "tela": "inspecao-inicial",
  "tempo_segundos": 45,
  "data_hora_inicio": "2025-12-29 10:30:00",
  "data_hora_fim": "2025-12-29 10:30:45"
}
```

**Parâmetros**:
- `inspecao_id` (number, opcional): ID da inspeção (pode ser null durante o preenchimento)
- `usuario_id` (number, opcional): ID do usuário
- `tela` (string, obrigatório): Nome da tela
- `tempo_segundos` (number, obrigatório): Tempo em segundos
- `data_hora_inicio` (datetime, obrigatório)
- `data_hora_fim` (datetime, obrigatório)

**Resposta**:
```json
{
  "sucesso": true,
  "id": 456,
  "mensagem": "Tempo de tela registrado com sucesso"
}
```

---

### 5.2 Atualizar Registros com ID da Inspeção

**Método**: `PUT`

**URL**: `https://floripa.in9automacao.com.br/b_veicular_tempotelas.php`

**Body** (JSON):
```json
{
  "inspecao_id": 123,
  "usuario_id": 1
}
```

**Descrição**: Atualiza todos os registros de tempo que foram salvos sem `inspecao_id` (durante o preenchimento) para associá-los à inspeção finalizada.

**Resposta**:
```json
{
  "sucesso": true,
  "mensagem": "Registros de tempo atualizados com sucesso",
  "linhas_afetadas": 5
}
```

---

### 5.3 Buscar Tempos por Inspeção

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_veicular_tempotelas.php?acao=inspecao&inspecao_id=123
```

**Resposta** (JSON):
```json
[
  {
    "id": 1,
    "inspecao_id": 123,
    "usuario_id": 1,
    "tela": "inspecao-inicial",
    "tempo_segundos": 45,
    "data_hora_inicio": "2025-12-29 10:30:00",
    "data_hora_fim": "2025-12-29 10:30:45",
    "data_criacao": "2025-12-29 10:30:45"
  }
]
```

---

### 5.4 Buscar Tempos por Usuário

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_veicular_tempotelas.php?acao=usuario&usuario_id=1
```

**Resposta**: Array de registros de tempo (últimos 100)

---

### 5.5 Buscar Estatísticas de Tempo

**Método**: `GET`

**URL**:
```
https://floripa.in9automacao.com.br/b_veicular_tempotelas.php?acao=estatisticas
```

**Resposta** (JSON):
```json
[
  {
    "tela": "inspecao-inicial",
    "total_registros": 150,
    "tempo_medio_segundos": 45.5,
    "tempo_minimo_segundos": 20,
    "tempo_maximo_segundos": 120,
    "tempo_total_segundos": 6825
  }
]
```

---

## 6. ESTRUTURA DO BANCO DE DADOS

### 6.1 Tabela: bbb_inspecao_veiculo

**Descrição**: Armazena as inspeções principais

**Prefixo**: `bbb_` (produção) ou `aaa_` (desenvolvimento)

```sql
CREATE TABLE `bbb_inspecao_veiculo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `placa` varchar(10) NOT NULL,
  `local` varchar(100) DEFAULT NULL,
  `data_realizacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `km_inicial` int(11) NOT NULL,
  `nivel_combustivel` enum('0%','25%','50%','75%','100%') NOT NULL,
  `observacao_painel` text,
  `status_geral` enum('APROVADO','REPROVADO','PENDENTE') DEFAULT 'PENDENTE',
  `usuario_id` int(11) NOT NULL,
  `observacoes` text,
  PRIMARY KEY (`id`),
  KEY `idx_placa` (`placa`),
  KEY `idx_local` (`local`),
  KEY `idx_data` (`data_realizacao`),
  KEY `idx_usuario` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Campos**:
- `id`: Chave primária (auto incremento)
- `placa`: Placa do veículo (10 caracteres)
- `local`: Local onde a inspeção foi realizada (100 caracteres, opcional)
- `data_realizacao`: Data e hora da inspeção
- `km_inicial`: Quilometragem inicial
- `nivel_combustivel`: Nível de combustível (0%, 25%, 50%, 75%, 100%)
- `observacao_painel`: Observações sobre o painel
- `status_geral`: Status da inspeção (APROVADO, REPROVADO, PENDENTE)
- `usuario_id`: ID do usuário que realizou
- `observacoes`: Observações gerais

---

### 6.2 Tabela: bbb_inspecao_item

**Descrição**: Armazena os itens inspecionados

```sql
CREATE TABLE `bbb_inspecao_item` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inspecao_id` int(11) NOT NULL,
  `categoria` enum('MOTOR','ELETRICO','LIMPEZA','FERRAMENTA','PNEU') NOT NULL,
  `item` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL,
  `foto` longtext,
  `observacao` varchar(255) DEFAULT NULL,
  `pressao` decimal(5,1) DEFAULT NULL,
  `foto_caneta` longtext,
  PRIMARY KEY (`id`),
  KEY `idx_inspecao` (`inspecao_id`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_item_inspecao` FOREIGN KEY (`inspecao_id`)
    REFERENCES `bbb_inspecao_veiculo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Campos**:
- `id`: Chave primária
- `inspecao_id`: FK para bbb_inspecao_veiculo
- `categoria`: Categoria do item (MOTOR, ELETRICO, LIMPEZA, FERRAMENTA, PNEU)
- `item`: Nome do item inspecionado
- `status`: Status do item (Bom, Ruim, Regular, etc.)
- `foto`: Foto em base64 (longtext)
- `observacao`: Observações sobre o item
- `pressao`: Pressão (para pneus)
- `foto_caneta`: Foto adicional

**Valores de Status Considerados RUINS** (geram anomalias):
- Qualquer valor que **NÃO** seja: "bom", "ótimo", "otimo", "contem", "contém", "satisfatória", "satisfatório", "satisfatoria", "satisfatorio"

---

### 6.3 Tabela: bbb_inspecao_foto

**Descrição**: Armazena as fotos do veículo

```sql
CREATE TABLE `bbb_inspecao_foto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inspecao_id` int(11) NOT NULL,
  `tipo` enum('PAINEL','FRONTAL','TRASEIRA','LATERAL_DIREITA','LATERAL_ESQUERDA') NOT NULL,
  `foto` longtext NOT NULL,
  `data_upload` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inspecao` (`inspecao_id`),
  KEY `idx_tipo` (`tipo`),
  CONSTRAINT `fk_foto_inspecao` FOREIGN KEY (`inspecao_id`)
    REFERENCES `bbb_inspecao_veiculo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Campos**:
- `id`: Chave primária
- `inspecao_id`: FK para bbb_inspecao_veiculo
- `tipo`: Tipo da foto (PAINEL, FRONTAL, TRASEIRA, LATERAL_DIREITA, LATERAL_ESQUERDA)
- `foto`: Imagem em base64 (longtext)
- `data_upload`: Data do upload

---

### 6.4 Tabela: bbb_anomalia_status

**Descrição**: Controla o status de aprovação/reprovação de anomalias

```sql
CREATE TABLE `bbb_anomalia_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `placa` varchar(10) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `item` varchar(100) NOT NULL,
  `status_anomalia` enum('pendente','aprovado','reprovado','finalizado') DEFAULT 'pendente',
  `data_aprovacao` datetime DEFAULT NULL,
  `data_finalizacao` datetime DEFAULT NULL,
  `usuario_aprovador_id` int(11) DEFAULT NULL,
  `observacao` text,
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_anomalia` (`placa`,`categoria`,`item`),
  KEY `idx_status` (`status_anomalia`),
  KEY `idx_placa` (`placa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Campos**:
- `id`: Chave primária
- `placa`: Placa do veículo
- `categoria`: Categoria do item
- `item`: Nome do item
- `status_anomalia`: pendente, aprovado, reprovado, finalizado
- `data_aprovacao`: Data de aprovação
- `data_finalizacao`: Data de finalização
- `usuario_aprovador_id`: ID do usuário que aprovou
- `observacao`: Observações sobre a resolução
- `data_criacao`: Data de criação do registro

**Constraint UNIQUE**: Cada combinação de (placa, categoria, item) é única

---

### 6.5 Tabela: bbb_config_itens

**Descrição**: Configuração de itens para checklist simples

```sql
CREATE TABLE `bbb_config_itens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `categoria` enum('MOTOR','ELETRICO','LIMPEZA','FERRAMENTA','PNEU') NOT NULL,
  `nome_item` varchar(100) NOT NULL,
  `habilitado` tinyint(1) DEFAULT '1',
  `usuario_id` int(11) DEFAULT NULL,
  `usuario_nome` varchar(100) DEFAULT NULL,
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_habilitado` (`habilitado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Campos**:
- `id`: Chave primária
- `categoria`: Categoria do item
- `nome_item`: Nome do item
- `habilitado`: 1 = habilitado, 0 = desabilitado
- `usuario_id`: ID do usuário que criou
- `usuario_nome`: Nome do usuário que criou
- `data_criacao`: Data de criação
- `data_atualizacao`: Atualiza automaticamente

---

### 6.6 Tabela: bbb_config_itens_completo

**Descrição**: Configuração de itens para checklist completo

```sql
CREATE TABLE `bbb_config_itens_completo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `categoria` enum('PARTE1_INTERNA','PARTE2_EQUIPAMENTOS','PARTE3_DIANTEIRA','PARTE4_TRASEIRA','PARTE5_ESPECIAL') NOT NULL,
  `nome_item` varchar(100) NOT NULL,
  `habilitado` tinyint(1) DEFAULT '1',
  `usuario_id` int(11) DEFAULT NULL,
  `usuario_nome` varchar(100) DEFAULT NULL,
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_habilitado` (`habilitado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Categorias**:
- `PARTE1_INTERNA`: Parte interna do veículo
- `PARTE2_EQUIPAMENTOS`: Equipamentos obrigatórios
- `PARTE3_DIANTEIRA`: Parte dianteira
- `PARTE4_TRASEIRA`: Parte traseira
- `PARTE5_ESPECIAL`: Veículos pesados/especiais

---

### 6.7 Tabela: bbb_tempo_telas

**Descrição**: Registra o tempo gasto em cada tela

```sql
CREATE TABLE `bbb_tempo_telas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inspecao_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `tela` varchar(50) NOT NULL,
  `tempo_segundos` int(11) NOT NULL,
  `data_hora_inicio` datetime NOT NULL,
  `data_hora_fim` datetime NOT NULL,
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inspecao_id` (`inspecao_id`),
  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_tela` (`tela`),
  CONSTRAINT `fk_tempo_telas_inspecao` FOREIGN KEY (`inspecao_id`)
    REFERENCES `bbb_inspecao_veiculo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tempo_telas_usuario` FOREIGN KEY (`usuario_id`)
    REFERENCES `bbb_usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Campos**:
- `id`: Chave primária
- `inspecao_id`: FK para bbb_inspecao_veiculo (pode ser NULL durante preenchimento)
- `usuario_id`: FK para bbb_usuario
- `tela`: Nome da tela (ex: "inspecao-inicial", "inspecao-veiculo")
- `tempo_segundos`: Tempo em segundos
- `data_hora_inicio`: Início
- `data_hora_fim`: Fim
- `data_criacao`: Timestamp de criação

---

### 6.8 Tabela: bbb_usuario

**Descrição**: Usuários do sistema

```sql
CREATE TABLE `bbb_usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `tipo_usuario` enum('admin','comum') NOT NULL DEFAULT 'comum',
  `tutorial_concluido` tinyint(1) NOT NULL DEFAULT '0',
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_nome` (`nome`),
  KEY `idx_tipo` (`tipo_usuario`),
  KEY `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Campos**:
- `id`: Chave primária
- `nome`: Nome do usuário (único)
- `senha`: Senha hash
- `ativo`: 1 = ativo, 0 = inativo
- `tipo_usuario`: "admin" ou "comum"
- `tutorial_concluido`: 0 = não, 1 = sim
- `data_criacao`: Data de criação

---

## 7. RESUMO DE ARQUIVOS PHP

| Arquivo | Descrição | Métodos |
|---------|-----------|---------|
| `b_veicular_anomalias.php` | Busca anomalias (ativas/finalizadas) | GET |
| `b_anomalia_status.php` | Gerencia status de anomalias | GET, POST |
| `b_veicular_config_itens.php` | Config itens simples | GET, POST, DELETE |
| `b_checklist_completo_config_itens.php` | Config itens completo | GET, POST, DELETE |
| `b_veicular_get.php` | Busca checklists | GET |
| `b_veicular_set.php` | Salva checklist simples | POST |
| `b_checklist_completo_set.php` | Salva checklist completo | POST |
| `b_veicular_update.php` | Atualiza checklist | POST |
| `b_veicular_tempotelas.php` | Gerencia tempo de telas | GET, POST, PUT |
| `b_veicular_auth.php` | Autenticação | POST |
| `b_buscar_placas.php` | Busca placas autocomplete | GET |

---

## 8. OBSERVAÇÕES IMPORTANTES

### 8.1 Prefixos de Tabelas

- **Desenvolvimento**: `aaa_` (ex: `aaa_inspecao_veiculo`)
- **Produção**: `bbb_` (ex: `bbb_inspecao_veiculo`)

### 8.2 Normalização de Dados

Os endpoints normalizam automaticamente:
- **Placas**: Convertidas para MAIÚSCULAS e trim()
- **Categorias**: Convertidas para MAIÚSCULAS e trim()
- **Itens**: trim() aplicado

### 8.3 CORS

Todos os endpoints têm CORS habilitado para permitir requisições do frontend.

### 8.4 Formato de Imagens

Todas as fotos são armazenadas em formato **base64** no banco de dados (campo `longtext`).

### 8.5 Relacionamentos

- `bbb_inspecao_item` → CASCADE em `inspecao_id` (se deletar inspeção, deleta itens)
- `bbb_inspecao_foto` → CASCADE em `inspecao_id` (se deletar inspeção, deleta fotos)
- `bbb_tempo_telas` → CASCADE em `inspecao_id`, SET NULL em `usuario_id`

---

**Fim da Documentação**
