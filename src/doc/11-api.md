# 🔌 API - Endpoints e Integração

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

Documentação completa de todos os endpoints da API PHP, incluindo parâmetros, respostas e exemplos de uso.

**Base URL:** `https://floripa.in9automacao.com.br`

**Tecnologia:** PHP + PDO + MySQL/MariaDB

---

## 🔐 Autenticação

### Login
**Endpoint:** `POST /b_veicular_auth.php`

**Parâmetros:**
```json
{
  "acao": "login",
  "nome": "string",
  "senha": "string"
}
```

**Resposta de Sucesso:**
```json
{
  "sucesso": true,
  "mensagem": "Login realizado com sucesso",
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "tipo": "admin",
    "tutorial_concluido": true
  },
  "token": "abc123..."
}
```

**Resposta de Erro:**
```json
{
  "sucesso": false,
  "mensagem": "Usuário ou senha incorretos"
}
```

---

### Definir Senha (Primeiro Acesso)
**Endpoint:** `POST /b_veicular_auth.php`

**Parâmetros:**
```json
{
  "acao": "definir_senha",
  "usuario_id": 1,
  "nova_senha": "string"
}
```

---

## 📋 Checklists Simples

### Criar Checklist
**Endpoint:** `POST /b_veicular_set.php`

**Parâmetros:**
```json
{
  "placa": "ABC-1234",
  "km_inicial": 50000,
  "nivel_combustivel": "50%",
  "foto_painel": "data:image/jpeg;base64,...",
  "observacao_painel": "Observações",
  "usuario_id": 1,
  "usuario_nome": "João Silva"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "id": 456,
  "mensagem": "Inspeção criada com sucesso"
}
```

---

### Atualizar Checklist
**Endpoint:** `POST /b_veicular_update.php`

**Parâmetros:**
```json
{
  "id": 456,
  "itens_inspecao": [
    {
      "categoria": "MOTOR",
      "item": "Água do Radiador",
      "status": "bom",
      "foto": "data:image/jpeg;base64,...",
      "descricao": "Opcional"
    }
  ],
  "foto_frontal": "data:image/jpeg;base64,...",
  "foto_traseira": "data:image/jpeg;base64,...",
  "foto_lateral_direita": "data:image/jpeg;base64,...",
  "foto_lateral_esquerda": "data:image/jpeg;base64,...",
  "itens_pneus": [
    {
      "nome": "Dianteira Direita",
      "valor": "bom",
      "pressao": 32,
      "foto": "data:image/jpeg;base64,...",
      "descricao": "Opcional"
    }
  ],
  "status_geral": "aprovado"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Inspeção atualizada"
}
```

---

### Buscar Checklists
**Endpoint:** `GET /b_veicular_get.php`

**Parâmetros de Query:**
```
?acao=todos
&limite=50
&placa=ABC-1234         (opcional)
&data_inicio=2025-01-01 (opcional)
&data_fim=2025-12-31    (opcional)
&status=aprovado        (opcional)
```

**Resposta:**
```json
{
  "sucesso": true,
  "checklists": [
    {
      "id": 456,
      "placa": "ABC-1234",
      "km_inicial": 50000,
      "nivel_combustivel": "50%",
      "data_realizacao": "2025-12-19 10:30:00",
      "status_geral": "aprovado",
      "usuario_nome": "João Silva"
    }
  ]
}
```

---

### Buscar Checklist Específico (Completo)
**Endpoint:** `GET /b_veicular_get.php?acao=completo&id=456`

**Resposta:**
```json
{
  "sucesso": true,
  "checklist": {
    "id": 456,
    "placa": "ABC-1234",
    "km_inicial": 50000,
    "nivel_combustivel": "50%",
    "foto_painel": "data:image/jpeg;base64,...",
    "observacao_painel": "...",
    "data_realizacao": "2025-12-19 10:30:00",
    "status_geral": "aprovado",
    "usuario_id": 1,
    "usuario_nome": "João Silva",
    "itens_inspecao": [...],
    "fotos": [...],
    "itens_pneus": [...]
  }
}
```

---

## 📋 Checklists Completos

### Criar Checklist Completo
**Endpoint:** `POST /b_checklist_completo_set.php`

**Parâmetros:**
```json
{
  "placa": "ABC-1234",
  "km_inicial": 50000,
  "nivel_combustivel": "50%",
  "foto_painel": "data:image/jpeg;base64,...",
  "observacao_painel": "...",
  "usuario_id": 1,
  "usuario_nome": "João Silva",
  "parte1": {
    "buzina": { "status": "bom", "foto": null, "descricao": "" },
    "cintos": { "status": "bom", "foto": null, "descricao": "" }
  },
  "parte2": {...},
  "parte3": {...},
  "parte4": {...},
  "parte5": {...}
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "id": 789,
  "mensagem": "Checklist completo criado"
}
```

---

### Buscar Checklists Completos
**Endpoint:** `GET /b_checklist_completo_get.php`

**Parâmetros:** (similares ao checklist simples)

---

## ⚙️ Configuração de Itens

### Buscar Todos os Itens
**Endpoint:** `GET /b_veicular_config_itens.php?acao=todos`

**Resposta:**
```json
{
  "sucesso": true,
  "itens": [
    {
      "id": 1,
      "categoria": "MOTOR",
      "nome_item": "Água do Radiador",
      "habilitado": true,
      "usuario_id": 1,
      "usuario_nome": "Admin",
      "data_criacao": "2025-01-01 00:00:00"
    }
  ]
}
```

---

### Buscar Itens Habilitados
**Endpoint:** `GET /b_veicular_config_itens.php?acao=habilitados`

**Resposta:** (apenas itens com `habilitado: true`)

---

### Adicionar Item
**Endpoint:** `POST /b_config_itens.php`

**Parâmetros:**
```json
{
  "acao": "add",
  "categoria": "MOTOR",
  "nome_item": "Novo Item",
  "habilitado": 1,
  "usuario_id": 1
}
```

---

### Atualizar Item
**Endpoint:** `POST /b_config_itens.php`

**Parâmetros:**
```json
{
  "acao": "update",
  "id": 1,
  "nome_item": "Nome Atualizado",
  "habilitado": 1
}
```

---

### Habilitar/Desabilitar Item
**Endpoint:** `POST /b_config_itens.php`

**Parâmetros:**
```json
{
  "acao": "toggle",
  "id": 1,
  "habilitado": 0
}
```

---

### Remover Item
**Endpoint:** `POST /b_config_itens.php`

**Parâmetros:**
```json
{
  "acao": "delete",
  "id": 1
}
```

---

## ⚠️ Anomalias

### Buscar Anomalias Ativas
**Endpoint:** `GET /b_veicular_anomalias.php?acao=ativas`

**Resposta:**
```json
{
  "sucesso": true,
  "anomalias": [
    {
      "id": 1,
      "placa": "ABC-1234",
      "categoria": "MOTOR",
      "item": "Água do Radiador",
      "status": "ruim",
      "status_anomalia": "ativo",
      "foto": "data:image/jpeg;base64,...",
      "descricao": "Vazamento detectado",
      "data_registro": "2025-12-19 10:30:00",
      "usuario_registro": "João Silva"
    }
  ]
}
```

---

### Buscar Anomalias Finalizadas
**Endpoint:** `GET /b_veicular_anomalias.php?acao=finalizadas`

---

### Aprovar Anomalia
**Endpoint:** `POST /b_anomalia_status.php`

**Parâmetros:**
```json
{
  "acao": "aprovar",
  "id": 1,
  "observacao": "Anomalia confirmada",
  "usuario_resolucao": "Admin"
}
```

---

### Reprovar Anomalia
**Endpoint:** `POST /b_anomalia_status.php`

**Parâmetros:**
```json
{
  "acao": "reprovar",
  "id": 1,
  "observacao": "Falso positivo",
  "usuario_resolucao": "Admin"
}
```

---

### Finalizar Anomalia
**Endpoint:** `POST /b_anomalia_status.php`

**Parâmetros:**
```json
{
  "acao": "finalizar",
  "id": 1,
  "observacao": "Problema resolvido",
  "usuario_resolucao": "Admin",
  "data_resolucao": "2025-12-19 15:00:00"
}
```

---

## 🔍 Utilitários

### Buscar Placas (Autocomplete)
**Endpoint:** `GET /b_buscar_placas.php`

**Parâmetros:**
```
?termo=ABC
&limite=5
```

**Resposta:**
```json
{
  "sucesso": true,
  "placas": [
    "ABC-1234",
    "ABC-5678",
    "ABC-9012"
  ]
}
```

---

### Registrar Tempo de Tela
**Endpoint:** `POST /b_veicular_tempotelas.php`

**Parâmetros:**
```json
{
  "usuario_id": 1,
  "tela": "inspecao_inicial",
  "tempo_segundos": 45.5,
  "data": "2025-12-19 10:30:00"
}
```

---

## 📊 Métricas

### Buscar Métricas Gerais
**Endpoint:** `GET /b_veicular_metricas.php`

**Parâmetros de Query (opcionais):**
```
?data_inicio=2025-01-01
&data_fim=2025-12-31
&categoria=MOTOR
```

**Resposta:**
```json
{
  "sucesso": true,
  "metricas": {
    "totalInspecoes": 150,
    "anomaliasAtivas": 5,
    "anomaliasFinalizadas": 45,
    "totalVeiculos": 30,
    "inspecoesHoje": 3,
    "inspecoesSemana": 12,
    "taxaAprovacao": 85.5,
    "topVeiculosProblemas": [
      { "placa": "ABC-1234", "total": 5 },
      { "placa": "DEF-5678", "total": 3 }
    ],
    "categoriasProblemas": [
      { "categoria": "MOTOR", "total": 10 },
      { "categoria": "ELETRICO", "total": 7 }
    ]
  }
}
```

---

## 🔒 Autenticação e Segurança

### Headers Necessários
```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}` // se implementado
};
```

### Tratamento de Erros Padrão
```json
{
  "sucesso": false,
  "erro": "Código do erro",
  "mensagem": "Descrição legível do erro"
}
```

**Códigos HTTP:**
- `200` - Sucesso
- `400` - Requisição inválida
- `401` - Não autorizado
- `404` - Recurso não encontrado
- `500` - Erro no servidor

---

## 🔗 Links Relacionados

- [Fluxo de Dados](./10-fluxo-dados.md)
- [Modelos](./12-modelos.md)
- [Serviços](./13-servicos.md)

---

[← Voltar ao Índice](./index.md)
