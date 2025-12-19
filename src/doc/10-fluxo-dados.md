# 🔄 Fluxo de Dados e Workflow

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

Este documento descreve o fluxo completo de dados no aplicativo, desde a captura até o armazenamento final, incluindo estratégias de persistência local e sincronização com a API.

---

## 🔄 Fluxo de Inspeção Simples

### Visão Geral
```
┌──────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO                         │
└──────────────────────────────────────────────────────────┘

1. LOGIN
   └─> Autenticação
   └─> Salvar token e dados do usuário
   └─> Redirecionar por perfil

2. HOME
   └─> Verificar inspeções pendentes
   └─> Iniciar nova inspeção

3. INSPEÇÃO INICIAL
   └─> Coletar: placa, km, combustível, foto painel
   └─> Validar placa no banco
   └─> Criar registro na API (POST /b_veicular_set.php)
   └─> Salvar ID da inspeção
   └─> Armazenar localmente

4. INSPEÇÃO VEÍCULO
   └─> Carregar itens habilitados da API
   └─> Coletar status de cada item por categoria
   └─> Capturar fotos de itens ruins
   └─> Salvar localmente após cada alteração
   └─> Atualizar inspeção na API (POST /b_veicular_update.php)

5. FOTOS VEÍCULO
   └─> Capturar 4 fotos obrigatórias
   └─> Permitir marcação de defeitos (canvas)
   └─> Comprimir fotos
   └─> Salvar localmente
   └─> Atualizar inspeção na API

6. PNEUS
   └─> Carregar configuração de pneus
   └─> Avaliar condição e pressão
   └─> Capturar fotos se necessário
   └─> Finalizar inspeção (POST /b_veicular_update.php)
   └─> Limpar dados locais
   └─> Voltar para Home

7. DETECÇÃO DE ANOMALIAS (Automática)
   └─> Backend analisa itens "ruins"
   └─> Cria registros de anomalia
   └─> Disponibiliza no Dashboard Admin
```

---

## 💾 Estratégia de Armazenamento

### Local Storage (Capacitor Preferences)

**Usado para:**
- ✅ Dados de inspeção em andamento
- ✅ Credenciais (se "lembrar senha")
- ✅ Token de autenticação
- ✅ Configurações do usuário
- ✅ Cache de dados

**Estrutura:**
```typescript
// Chaves utilizadas
{
  "usuario_id": "123",
  "usuario_nome": "João Silva",
  "usuario_tipo": "inspetor",
  "token": "abc123...",
  "lembrar_senha": "true",
  "usuario_senha": "***",

  "inspecao_em_andamento": "{...}",
  "inspecao_id": "456",
  "inspecao_veiculo": "{...}",
  "inspecao_fotos": "{...}",
  "inspecao_pneus": "{...}",

  "tutorial_concluido": "true"
}
```

---

### API (Backend PHP + MySQL)

**Usado para:**
- ✅ Armazenamento permanente
- ✅ Sincronização entre dispositivos
- ✅ Consultas e relatórios
- ✅ Gestão de anomalias
- ✅ Configurações globais

**Momento de Sincronização:**
- Após cada etapa da inspeção (incremental)
- Ao finalizar checklist (completo)
- Ao aprovar/reprovar anomalias
- Ao alterar configurações

---

## 🔀 Sincronização de Dados

### Estratégia: Incremental + Final

**Incremental:**
```typescript
// A cada tela, atualizar API
Inspeção Inicial → POST /b_veicular_set.php
Inspeção Veículo → POST /b_veicular_update.php (parcial)
Fotos Veículo   → POST /b_veicular_update.php (parcial)
Pneus          → POST /b_veicular_update.php (final)
```

**Vantagens:**
- Menor perda de dados se app fechar
- Dados parciais disponíveis para admin
- Melhor performance (payloads menores)

---

### Tratamento de Falhas

```typescript
async salvarComRetry(payload: any, tentativas = 3) {
  for (let i = 0; i < tentativas; i++) {
    try {
      const response = await this.apiService.post(
        '/b_veicular_update.php',
        payload
      );

      if (response.sucesso) {
        return response;
      }
    } catch (erro) {
      console.error(`Tentativa ${i + 1} falhou`, erro);

      if (i === tentativas - 1) {
        // Última tentativa falhou
        this.salvarFilaSincronizacao(payload);
        throw erro;
      }

      // Aguardar antes de tentar novamente
      await this.aguardar(2000 * (i + 1)); // 2s, 4s, 6s
    }
  }
}

async salvarFilaSincronizacao(payload: any) {
  // Salvar em fila para tentar depois
  const fila = await this.getFilaSincronizacao();
  fila.push({
    payload,
    timestamp: Date.now()
  });

  await Preferences.set({
    key: 'fila_sincronizacao',
    value: JSON.stringify(fila)
  });
}
```

---

## 📡 Endpoints e Fluxo de Dados

### 1. Criar Inspeção
```
POST /b_veicular_set.php

Request:
{
  placa: "ABC-1234",
  km_inicial: 50000,
  nivel_combustivel: "50%",
  foto_painel: "data:image/jpeg;base64,...",
  usuario_id: 123
}

Response:
{
  sucesso: true,
  id: 456,
  mensagem: "Inspeção criada"
}

Storage Local:
inspecao_id = 456
```

---

### 2. Atualizar Inspeção (Incremental)
```
POST /b_veicular_update.php

Request:
{
  id: 456,
  itens_inspecao: [
    {
      categoria: "MOTOR",
      item: "Água do Radiador",
      status: "bom"
    },
    ...
  ]
}

Response:
{
  sucesso: true,
  mensagem: "Inspeção atualizada"
}
```

---

### 3. Finalizar Inspeção
```
POST /b_veicular_update.php

Request:
{
  id: 456,
  itens_pneus: [...],
  status_geral: "aprovado"
}

Response:
{
  sucesso: true,
  mensagem: "Inspeção finalizada"
}

Ações:
1. Atualizar banco de dados
2. Criar anomalias (se houver itens ruins)
3. Retornar sucesso

Limpeza Local:
- Remover inspecao_em_andamento
- Remover inspecao_id
- Remover dados temporários
```

---

## 🔄 Detecção Automática de Anomalias

### Backend (PHP)
```php
// Ao salvar inspeção, verificar itens ruins
foreach ($itens_inspecao as $item) {
  if (in_array($item['status'], ['ruim', 'pessima', 'nao_contem'])) {
    // Criar anomalia
    $stmt = $pdo->prepare("
      INSERT INTO anomalias
      (placa, categoria, item, status, foto, descricao, status_anomalia)
      VALUES (?, ?, ?, ?, ?, ?, 'ativo')
    ");

    $stmt->execute([
      $inspecao['placa'],
      $item['categoria'],
      $item['item'],
      $item['status'],
      $item['foto'],
      $item['descricao']
    ]);
  }
}
```

### Ciclo de Vida da Anomalia
```
1. CRIAÇÃO (Automática)
   └─> Item detectado como "ruim" na inspeção
   └─> Status: "ativo"

2. ANÁLISE (Admin)
   └─> Admin revisa anomalia
   └─> Opções:
       ├─> Aprovar (confirma problema real)
       ├─> Reprovar (falso positivo)
       └─> Finalizar (problema resolvido)

3. FINALIZAÇÃO
   └─> Status: "finalizado"
   └─> Data de resolução registrada
   └─> Anomalia sai da lista ativa
```

---

## 📊 Fluxo de Métricas

### Coleta de Dados
```typescript
// Rastreamento de tempo por tela
ionViewDidEnter() {
  this.tempoInicio = Date.now();
}

async ionViewWillLeave() {
  const tempoGasto = Date.now() - this.tempoInicio;

  await this.tempoTelasService.registrar({
    usuario_id: this.usuarioId,
    tela: 'inspecao_inicial',
    tempo_segundos: tempoGasto / 1000,
    data: new Date().toISOString()
  });
}
```

### Agregação (Backend)
```sql
-- Tempo médio por tela
SELECT
  tela,
  AVG(tempo_segundos) as tempo_medio,
  COUNT(*) as total_acessos
FROM tempo_telas
WHERE data >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY tela;

-- Inspeções por dia
SELECT
  DATE(data_realizacao) as dia,
  COUNT(*) as total
FROM checklists
GROUP BY DATE(data_realizacao)
ORDER BY dia DESC
LIMIT 30;
```

---

## 🔐 Fluxo de Autenticação

### Login
```
1. Usuário digita credenciais
2. POST /b_veicular_auth.php
3. Backend valida usuário/senha
4. Retorna: { usuario: {...}, token: "..." }
5. App salva no Preferences:
   - usuario_id
   - usuario_nome
   - usuario_tipo
   - token
6. Redireciona por perfil
```

### Validação de Sessão
```typescript
async validarSessao(): Promise<boolean> {
  const token = await Preferences.get({ key: 'token' });

  if (!token.value) {
    return false;
  }

  try {
    const response = await this.apiService.post('/b_validar_token.php', {
      token: token.value
    });

    return response.valido;
  } catch {
    return false;
  }
}
```

---

## 📱 Trabalho Offline

### Estratégia
1. **Salvamento Local Prioritário**
   - Todos os dados salvos em Preferences primeiro
   - Sincronização com API em segundo plano

2. **Detecção de Conectividade**
```typescript
async verificarConexao(): Promise<boolean> {
  const status = await Network.getStatus();
  return status.connected;
}

async salvarDados(dados: any) {
  // 1. Salvar localmente sempre
  await this.salvarLocalmente(dados);

  // 2. Tentar sincronizar se online
  const online = await this.verificarConexao();

  if (online) {
    try {
      await this.sincronizarAPI(dados);
    } catch (erro) {
      console.log('Sem conexão, dados salvos localmente');
    }
  }
}
```

3. **Sincronização ao Reconectar**
```typescript
Network.addListener('networkStatusChange', async (status) => {
  if (status.connected) {
    await this.sincronizarFilaPendente();
  }
});

async sincronizarFilaPendente() {
  const fila = await this.getFilaSincronizacao();

  for (const item of fila) {
    try {
      await this.apiService.post(item.endpoint, item.payload);
      // Remover da fila após sucesso
      await this.removerDaFila(item);
    } catch (erro) {
      console.error('Erro ao sincronizar item', erro);
    }
  }
}
```

---

## 🔗 Links Relacionados

- [Visão Geral](./01-visao-geral.md)
- [API Completa](./11-api.md)
- [Modelos de Dados](./12-modelos.md)
- [Serviços](./13-servicos.md)

---

[← Voltar ao Índice](./index.md)
