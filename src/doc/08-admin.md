# 🔐 Dashboard Admin - Gestão Completa

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

O Dashboard Admin é a área administrativa completa do aplicativo, acessível apenas para usuários com perfil **Administrador**. Oferece 4 abas principais: Histórico, Anomalias, Configuração e Métricas.

**Rota:** `/admin`

**Arquivo:** `/home/user/checklist-app/src/app/admin/admin.page.ts`

**Acesso:** Apenas **Administradores**

---

## 🎯 Objetivo

Fornecer ferramentas completas de gestão, análise e configuração do sistema de inspeções.

---

## 📑 Estrutura de Abas

```
┌─────────────────────────────────────────────┐
│  [Sair]        ADMIN DASHBOARD              │
├──┬──────┬──────────┬──────────┬────────────┤
│ H│  A   │    C     │    M     │            │
│ i│  n   │    o     │    é     │            │
│ s│  o   │    n     │    t     │            │
│ t│  m   │    f     │    r     │            │
│ ó│  a   │    i     │    i     │            │
│ r│  l   │    g     │    c     │            │
│ i│  i   │          │    a     │            │
│ c│  a   │          │    s     │            │
│ o│  s   │          │          │            │
└──┴──────┴──────────┴──────────┴────────────┘
```

---

## 📊 ABA 1: HISTÓRICO

### Descrição
Visualização de todos os checklists realizados (simples e completos) com filtros e detalhes.

### Funcionalidades

#### 1. Lista de Checklists
```typescript
checklists: ChecklistSimples[] = [];

async carregarChecklists() {
  try {
    const response = await this.apiService.get('/b_veicular_get.php', {
      acao: 'todos',
      limite: 50
    });

    this.checklists = response.checklists;
  } catch (erro) {
    console.error('Erro ao carregar checklists', erro);
  }
}
```

**Campos Exibidos:**
- Placa do veículo
- Data e hora da realização
- Nome do inspetor
- Status geral (aprovado/reprovado/pendente)
- Tipo (simples/completo)

---

#### 2. Filtros
```typescript
filtros = {
  placa: '',
  dataInicio: '',
  dataFim: '',
  status: ''
};

async aplicarFiltros() {
  const response = await this.apiService.get('/b_veicular_get.php', {
    acao: 'todos',
    placa: this.filtros.placa,
    data_inicio: this.filtros.dataInicio,
    data_fim: this.filtros.dataFim,
    status: this.filtros.status
  });

  this.checklists = response.checklists;
}
```

**Filtros Disponíveis:**
- 🔍 Por placa
- 📅 Por período (data início/fim)
- ⚠️ Por status (aprovado/reprovado/pendente)

---

#### 3. Visualizar Detalhes
```typescript
async verDetalhes(checklistId: number) {
  const response = await this.apiService.get('/b_veicular_get.php', {
    acao: 'completo',
    id: checklistId
  });

  const modal = await this.modalController.create({
    component: DetalhesChecklistComponent,
    componentProps: {
      checklist: response.checklist
    }
  });

  await modal.present();
}
```

**Modal de Detalhes Exibe:**
- Todos os campos da inspeção inicial
- Todos os itens inspecionados por categoria
- Todas as fotos (com zoom)
- Dados dos pneus
- Tempo gasto por tela
- Histórico de alterações

---

#### 4. Estatísticas do Histórico
```typescript
estatisticas = {
  total: 0,
  hoje: 0,
  estaSemana: 0,
  aprovados: 0,
  reprovados: 0
};

calcularEstatisticas() {
  this.estatisticas.total = this.checklists.length;

  const hoje = new Date().toDateString();
  this.estatisticas.hoje = this.checklists.filter(
    c => new Date(c.data_realizacao).toDateString() === hoje
  ).length;

  // ... cálculos de semana, aprovados, reprovados
}
```

---

## ⚠️ ABA 2: ANOMALIAS

### Descrição
Gestão de anomalias detectadas nas inspeções, com fluxo de aprovação/reprovação/finalização.

### Funcionalidades

#### 1. Listar Anomalias
```typescript
anomaliasAtivas: Anomalia[] = [];
anomaliasFinalizadas: Anomalia[] = [];
cacheAnomalias: { data: any; timestamp: number } | null = null;
CACHE_DURACAO = 5 * 60 * 1000; // 5 minutos

async carregarAnomalias(tipo: 'ativas' | 'finalizadas') {
  // Verificar cache
  if (this.cacheAnomalias && this.isCacheValido()) {
    this.anomaliasAtivas = this.cacheAnomalias.data.ativas;
    this.anomaliasFinalizadas = this.cacheAnomalias.data.finalizadas;
    return;
  }

  try {
    const response = await this.apiService.get('/b_veicular_anomalias.php', {
      acao: tipo
    });

    if (tipo === 'ativas') {
      this.anomaliasAtivas = response.anomalias;
    } else {
      this.anomaliasFinalizadas = response.anomalias;
    }

    // Atualizar cache
    this.atualizarCache();

  } catch (erro) {
    console.error('Erro ao carregar anomalias', erro);
  }
}
```

**Status de Anomalias:**
- 🔴 **Ativo** - Anomalia detectada, aguardando ação
- ✅ **Aprovado** - Anomalia confirmada e aceita
- ❌ **Reprovado** - Anomalia rejeitada (falso positivo)
- 🏁 **Finalizado** - Anomalia resolvida

---

#### 2. Aprovar Anomalia
```typescript
async aprovarAnomalia(anomaliaId: number) {
  const alert = await this.alertController.create({
    header: 'Aprovar Anomalia',
    message: 'Confirma que esta anomalia é válida?',
    inputs: [
      {
        name: 'observacao',
        type: 'textarea',
        placeholder: 'Observações (opcional)'
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Aprovar',
        handler: async (data) => {
          try {
            await this.apiService.post('/b_anomalia_status.php', {
              acao: 'aprovar',
              id: anomaliaId,
              observacao: data.observacao,
              usuario_resolucao: this.usuarioNome
            });

            this.mostrarSucesso('Anomalia aprovada');
            this.carregarAnomalias('ativas');
          } catch (erro) {
            this.mostrarErro('Erro ao aprovar anomalia');
          }
        }
      }
    ]
  });

  await alert.present();
}
```

---

#### 3. Reprovar Anomalia
```typescript
async reprovarAnomalia(anomaliaId: number) {
  const alert = await this.alertController.create({
    header: 'Reprovar Anomalia',
    message: 'Informe o motivo da reprovação:',
    inputs: [
      {
        name: 'observacao',
        type: 'textarea',
        placeholder: 'Motivo da reprovação',
        attributes: {
          required: true
        }
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Reprovar',
        handler: async (data) => {
          if (!data.observacao) {
            this.mostrarErro('Observação obrigatória');
            return false;
          }

          try {
            await this.apiService.post('/b_anomalia_status.php', {
              acao: 'reprovar',
              id: anomaliaId,
              observacao: data.observacao,
              usuario_resolucao: this.usuarioNome
            });

            this.mostrarSucesso('Anomalia reprovada');
            this.carregarAnomalias('ativas');
          } catch (erro) {
            this.mostrarErro('Erro ao reprovar anomalia');
          }
        }
      }
    ]
  });

  await alert.present();
}
```

---

#### 4. Finalizar Anomalia
```typescript
async finalizarAnomalia(anomaliaId: number) {
  const alert = await this.alertController.create({
    header: 'Finalizar Anomalia',
    message: 'Confirma que esta anomalia foi resolvida?',
    inputs: [
      {
        name: 'observacao',
        type: 'textarea',
        placeholder: 'Como foi resolvida?'
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Finalizar',
        handler: async (data) => {
          try {
            await this.apiService.post('/b_anomalia_status.php', {
              acao: 'finalizar',
              id: anomaliaId,
              observacao: data.observacao,
              usuario_resolucao: this.usuarioNome,
              data_resolucao: new Date().toISOString()
            });

            this.mostrarSucesso('Anomalia finalizada');
            this.carregarAnomalias('ativas');
          } catch (erro) {
            this.mostrarErro('Erro ao finalizar anomalia');
          }
        }
      }
    ]
  });

  await alert.present();
}
```

---

## ⚙️ ABA 3: CONFIGURAÇÃO

### Descrição
Gerenciamento dinâmico dos itens de inspeção (habilitar/desabilitar/adicionar/remover).

### Funcionalidades

#### 1. Listar Itens de Configuração
```typescript
itensConfig: ConfigItem[] = [];
tipoChecklist: 'simples' | 'completo' = 'simples';

async carregarConfigItens() {
  const endpoint = this.tipoChecklist === 'simples'
    ? '/b_veicular_config_itens.php'
    : '/b_checklist_completo_config_itens.php';

  try {
    const response = await this.apiService.get(endpoint, {
      acao: 'todos'
    });

    this.itensConfig = response.itens;
    this.agruparPorCategoria();
  } catch (erro) {
    console.error('Erro ao carregar configuração', erro);
  }
}

agruparPorCategoria() {
  this.itensPorCategoria = {
    MOTOR: this.itensConfig.filter(i => i.categoria === 'MOTOR'),
    ELETRICO: this.itensConfig.filter(i => i.categoria === 'ELETRICO'),
    LIMPEZA: this.itensConfig.filter(i => i.categoria === 'LIMPEZA'),
    FERRAMENTA: this.itensConfig.filter(i => i.categoria === 'FERRAMENTA'),
    PNEU: this.itensConfig.filter(i => i.categoria === 'PNEU')
  };
}
```

---

#### 2. Habilitar/Desabilitar Item
```typescript
async toggleItem(itemId: number, habilitado: boolean) {
  try {
    await this.apiService.post('/b_config_itens.php', {
      acao: 'toggle',
      id: itemId,
      habilitado: habilitado ? 1 : 0
    });

    this.mostrarSucesso(
      habilitado ? 'Item habilitado' : 'Item desabilitado'
    );

    this.carregarConfigItens();
  } catch (erro) {
    this.mostrarErro('Erro ao atualizar item');
  }
}
```

---

#### 3. Adicionar Novo Item
```typescript
async adicionarItem() {
  const alert = await this.alertController.create({
    header: 'Adicionar Item',
    inputs: [
      {
        name: 'categoria',
        type: 'text',
        placeholder: 'Categoria (MOTOR, ELETRICO, etc.)'
      },
      {
        name: 'nome_item',
        type: 'text',
        placeholder: 'Nome do item'
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Adicionar',
        handler: async (data) => {
          if (!data.categoria || !data.nome_item) {
            this.mostrarErro('Preencha todos os campos');
            return false;
          }

          try {
            await this.apiService.post('/b_config_itens.php', {
              acao: 'add',
              categoria: data.categoria.toUpperCase(),
              nome_item: data.nome_item,
              habilitado: 1,
              usuario_id: this.usuarioId
            });

            this.mostrarSucesso('Item adicionado');
            this.carregarConfigItens();
          } catch (erro) {
            this.mostrarErro('Erro ao adicionar item');
          }
        }
      }
    ]
  });

  await alert.present();
}
```

---

#### 4. Remover Item
```typescript
async removerItem(itemId: number, nomeItem: string) {
  const alert = await this.alertController.create({
    header: 'Remover Item',
    message: `Deseja remover "${nomeItem}"? Esta ação não pode ser desfeita.`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Remover',
        cssClass: 'danger',
        handler: async () => {
          try {
            await this.apiService.post('/b_config_itens.php', {
              acao: 'delete',
              id: itemId
            });

            this.mostrarSucesso('Item removido');
            this.carregarConfigItens();
          } catch (erro) {
            this.mostrarErro('Erro ao remover item');
          }
        }
      }
    ]
  });

  await alert.present();
}
```

---

## 📊 ABA 4: MÉTRICAS

### Descrição
Visualização de estatísticas, gráficos e análises do sistema de inspeções.

### Funcionalidades

#### 1. Estatísticas Gerais
```typescript
metricas = {
  totalInspecoes: 0,
  anomaliasAtivas: 0,
  anomaliasFinalizadas: 0,
  totalVeiculos: 0,
  inspecoesHoje: 0,
  inspecoesSemana: 0,
  taxaAprovacao: 0
};

async carregarMetricas() {
  try {
    const response = await this.apiService.get('/b_veicular_metricas.php');
    this.metricas = response.metricas;
  } catch (erro) {
    console.error('Erro ao carregar métricas', erro);
  }
}
```

---

#### 2. Gráficos Interativos (Chart.js)
```typescript
async renderizarGraficos() {
  // Gráfico de Pizza - Status das Inspeções
  const ctxStatus = document.getElementById('graficoStatus');
  new Chart(ctxStatus, {
    type: 'pie',
    data: {
      labels: ['Aprovados', 'Reprovados', 'Pendentes'],
      datasets: [{
        data: [
          this.metricas.aprovados,
          this.metricas.reprovados,
          this.metricas.pendentes
        ],
        backgroundColor: ['#2dd36f', '#eb445a', '#ffc409']
      }]
    }
  });

  // Gráfico de Barras - Top Veículos com Problemas
  const ctxVeiculos = document.getElementById('graficoVeiculos');
  new Chart(ctxVeiculos, {
    type: 'bar',
    data: {
      labels: this.topVeiculosProblemas.map(v => v.placa),
      datasets: [{
        label: 'Número de Anomalias',
        data: this.topVeiculosProblemas.map(v => v.total),
        backgroundColor: '#eb445a'
      }]
    }
  });

  // Gráfico de Linha - Inspeções por Mês
  const ctxTempo = document.getElementById('graficoTempo');
  new Chart(ctxTempo, {
    type: 'line',
    data: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Inspeções',
        data: this.inspecoesPorMes,
        borderColor: '#3880ff',
        fill: false
      }]
    }
  });
}
```

---

#### 3. Filtros de Métricas
```typescript
filtrosMetricas = {
  dataInicio: '',
  dataFim: '',
  categoria: ''
};

async aplicarFiltrosMetricas() {
  const response = await this.apiService.get('/b_veicular_metricas.php', {
    data_inicio: this.filtrosMetricas.dataInicio,
    data_fim: this.filtrosMetricas.dataFim,
    categoria: this.filtrosMetricas.categoria
  });

  this.metricas = response.metricas;
  this.renderizarGraficos();
}
```

---

## 🔐 Segurança e Permissões

### Guard de Acesso
```typescript
// admin.guard.ts
canActivate(): boolean {
  const userType = this.authService.getUserType();

  if (userType !== 'admin') {
    this.router.navigate(['/home']);
    this.mostrarErro('Acesso restrito a administradores');
    return false;
  }

  return true;
}
```

---

## 📚 Resumo das Funcionalidades

| Aba | Função Principal | Ações |
|-----|------------------|-------|
| **Histórico** | Visualizar checklists | Ver detalhes, filtrar, exportar |
| **Anomalias** | Gerenciar defeitos | Aprovar, reprovar, finalizar |
| **Configuração** | Customizar itens | Adicionar, remover, habilitar/desabilitar |
| **Métricas** | Análises | Gráficos, estatísticas, relatórios |

---

## 🔗 Links Relacionados

- [Visão Geral](./01-visao-geral.md)
- [API - Endpoints Admin](./11-api.md)
- [Modelos - Anomalia](./12-modelos.md#anomalia)

---

[← Voltar ao Índice](./index.md)
