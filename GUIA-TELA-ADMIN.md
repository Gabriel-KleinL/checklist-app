# GUIA COMPLETO - TELA DE ADMINISTRAÇÃO

Este documento descreve em detalhes a implementação da tela de administração do sistema de checklists, para facilitar a replicação em outros sistemas.

---

## ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Estrutura de Arquivos](#2-estrutura-de-arquivos)
3. [TypeScript - admin.page.ts](#3-typescript---adminpagets)
4. [HTML - admin.page.html](#4-html---adminpagehtml)
5. [SCSS - admin.page.scss](#5-scss---adminpagescss)
6. [Módulos - admin.module.ts](#6-módulos---adminmodulets)
7. [Roteamento - admin-routing.module.ts](#7-roteamento---admin-routingmodulets)
8. [Funcionalidades Detalhadas](#8-funcionalidades-detalhadas)
9. [Integrações com Backend](#9-integrações-com-backend)
10. [Fluxos de Trabalho](#10-fluxos-de-trabalho)

---

## 1. VISÃO GERAL

### 1.1 Objetivo
A tela de admin é um painel administrativo completo para gerenciar checklists veiculares. Ela oferece:

- **Visualização de histórico** de checklists (simples e completos)
- **Gestão de anomalias** detectadas nas inspeções
- **Métricas e gráficos** interativos
- **Configuração dinâmica** de itens de inspeção

### 1.2 Tecnologias Utilizadas
- **Framework**: Ionic 8 + Angular 18
- **Gráficos**: Chart.js
- **Compressão de Imagens**: Capacitor Camera + serviço customizado
- **Estado**: RxJS Observables
- **Estilização**: SCSS com animações

### 1.3 Acesso
- Rota: `/admin`
- Permissão: Apenas usuários com tipo `admin`
- Guard: Proteção de rota via AuthService

---

## 2. ESTRUTURA DE ARQUIVOS

```
src/app/admin/
├── admin.page.ts              # Lógica TypeScript (1720 linhas)
├── admin.page.html            # Template HTML (1343 linhas)
├── admin.page.scss            # Estilos SCSS (1702 linhas)
├── admin.module.ts            # Módulo Angular
├── admin-routing.module.ts    # Configuração de rotas
└── admin.page.spec.ts         # Testes unitários
```

---

## 3. TYPESCRIPT - admin.page.ts

### 3.1 Imports Necessários

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { TempoTelasService } from '../services/tempo-telas.service';
import { ConfigItensService, ConfigItem } from '../services/config-itens.service';
import { ConfigItensCompletoService, ConfigItemCompleto } from '../services/config-itens-completo.service';
import { AuthService } from '../services/auth.service';
import { AlertController, ToastController, ActionSheetController, LoadingController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PhotoCompressionService } from '../services/photo-compression.service';
import { Chart, registerables } from 'chart.js';
import { ChecklistSimples, ChecklistCompleto } from '../models/checklist.models';
```

### 3.2 Propriedades Principais

```typescript
export class AdminPage implements OnInit {
  // CONTROLE DE TIPO DE CHECKLIST
  tipoChecklistSelecionado: 'simples' | 'completo' = 'simples';

  // CHECKLISTS SIMPLES
  checklists: ChecklistSimples[] = [];
  checklistsFiltrados: ChecklistSimples[] = [];

  // CHECKLISTS COMPLETOS
  checklistsCompletos: ChecklistCompleto[] = [];
  checklistsCompletosFiltrados: ChecklistCompleto[] = [];

  // ESTADOS DE CARREGAMENTO
  carregando = false;
  erro = '';

  // FILTROS
  filtroPlaca = '';
  filtroDataInicio = '';
  filtroDataFim = '';

  // ESTATÍSTICAS - SIMPLES
  totalChecklists = 0;
  checklistsHoje = 0;
  checklistsSemana = 0;

  // ESTATÍSTICAS - COMPLETO
  totalChecklistsCompletos = 0;
  checklistsCompletosHoje = 0;
  checklistsCompletosSemana = 0;

  // ABAS
  abaSelecionada: 'historico' | 'anomalias' | 'configuracao' | 'metricas' = 'historico';

  // CONFIGURAÇÃO DE ITENS - SIMPLES
  itensConfig: ConfigItem[] = [];
  itensConfigPorCategoria: { [key: string]: ConfigItem[] } = {};
  carregandoConfig = false;

  // ANOMALIAS
  anomalias: any[] = [];
  carregandoAnomalias = false;
  erroAnomalias = '';
  detalhesAnomaliaExpandido: { [placa: string]: boolean } = {};
  tipoAnomalias: 'ativas' | 'finalizadas' = 'ativas';

  // CACHE DE ANOMALIAS
  private cacheAnomalias: { [tipo: string]: any[] } = {};
  private cacheTimestamp: { [tipo: string]: number } = {};
  private cacheDuracaoMs = 5 * 60 * 1000; // 5 minutos

  // CATEGORIAS SIMPLES
  categorias = [
    { key: 'MOTOR', label: 'Motor', icon: 'construct-outline', color: '#3880ff' },
    { key: 'ELETRICO', label: 'Elétrico', icon: 'flash-outline', color: '#ffc409' },
    { key: 'LIMPEZA', label: 'Limpeza', icon: 'water-outline', color: '#2dd36f' },
    { key: 'FERRAMENTA', label: 'Ferramentas', icon: 'build-outline', color: '#eb445a' },
    { key: 'PNEU', label: 'Pneus', icon: 'ellipse-outline', color: '#3dc2ff' }
  ];

  // MÉTRICAS
  carregandoMetricas = false;
  ultimaAtualizacaoMetricas: Date | null = null;
  metricas: any = {
    totalInspecoes: 0,
    anomaliasAtivas: 0,
    anomaliasFinalizadas: 0,
    totalVeiculos: 0,
    inspecoesHoje: 0,
    inspecoesSemana: 0,
    taxaAprovacao: 0,
    veiculosComMaisProblemas: [],
    categoriasComMaisProblemas: []
  };

  // CONFIGURAÇÃO DE ITENS - COMPLETO
  itensConfigCompleto: ConfigItemCompleto[] = [];
  itensConfigCompletoPorCategoria: { [key: string]: ConfigItemCompleto[] } = {};
  categoriasCompleto = [
    { key: 'PARTE1_INTERNA', label: 'Parte 1 - Interna', icon: 'car-outline', color: '#3880ff' },
    { key: 'PARTE2_EQUIPAMENTOS', label: 'Parte 2 - Equipamentos', icon: 'construct-outline', color: '#ffc409' },
    { key: 'PARTE3_DIANTEIRA', label: 'Parte 3 - Dianteira', icon: 'arrow-up-outline', color: '#2dd36f' },
    { key: 'PARTE4_TRASEIRA', label: 'Parte 4 - Traseira', icon: 'arrow-down-outline', color: '#eb445a' },
    { key: 'PARTE5_ESPECIAL', label: 'Parte 5 - Veículos Pesados', icon: 'bus-outline', color: '#3dc2ff' }
  ];

  // GRÁFICOS
  chartInstance: any;
  graficoSelecionado: string = 'usuarios';
  termoBuscaGrafico: string = '';
  dadosGrafico: { label: string, value: number, color: string }[] = [];
  dadosGraficoFiltrados: { label: string, value: number, color: string }[] = [];

  // DETALHES E MODAIS
  checklistDetalhado: any = null;
  mostrarModal = false;
  temposTelas: any[] = [];
  checklistCompletoDetalhado: any = null;
  mostrarModalCompleto = false;

  // FOTO EXPANDIDA
  fotoExpandida: string | null = null;
  mostrarFotoExpandida = false;
  zoomLevel = 1;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private tempoTelasService: TempoTelasService,
    private configItensService: ConfigItensService,
    private configItensCompletoService: ConfigItensCompletoService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private photoCompressionService: PhotoCompressionService,
    private loadingController: LoadingController
  ) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.carregarChecklists();
    this.carregarConfigItens();
  }
}
```

### 3.3 Métodos Principais

#### 3.3.1 CARREGAMENTO DE CHECKLISTS

```typescript
carregarChecklists() {
  this.carregando = true;
  this.erro = '';

  this.apiService.buscarTodos(1000).subscribe({
    next: (response) => {
      this.checklists = response;
      this.checklistsFiltrados = response;
      this.carregando = false;
      this.calcularEstatisticas();
      console.log('Checklists simples carregados:', this.checklists);
    },
    error: (error) => {
      console.error('Erro ao carregar checklists:', error);
      const mensagemErro = error.error?.erro || error.error?.message || error.message || 'Erro desconhecido';
      const detalhes = error.error?.detalhes || error.statusText || '';
      this.erro = `Erro ao carregar histórico: ${mensagemErro}${detalhes ? ' - ' + detalhes : ''}`;
      this.carregando = false;
    }
  });
}

carregarChecklistsCompletos() {
  this.carregando = true;
  this.erro = '';

  this.apiService.buscarChecklistsCompletos(1000).subscribe({
    next: (response) => {
      this.checklistsCompletos = response;
      this.checklistsCompletosFiltrados = response;
      this.carregando = false;
      this.calcularEstatisticasCompletos();
      console.log('Checklists completos carregados:', this.checklistsCompletos);
    },
    error: (error) => {
      console.error('Erro ao carregar checklists completos:', error);
      const mensagemErro = error.error?.erro || error.error?.message || error.message || 'Erro desconhecido';
      const detalhes = error.error?.detalhes || error.statusText || '';
      this.erro = `Erro ao carregar histórico completo: ${mensagemErro}${detalhes ? ' - ' + detalhes : ''}`;
      this.carregando = false;
    }
  });
}
```

#### 3.3.2 CÁLCULO DE ESTATÍSTICAS

```typescript
calcularEstatisticas() {
  this.totalChecklists = this.checklists.length;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const inicioSemana = new Date();
  inicioSemana.setDate(hoje.getDate() - 7);
  inicioSemana.setHours(0, 0, 0, 0);

  this.checklistsHoje = this.checklists.filter(c => {
    if (!c.data_realizacao) return false;
    const data = new Date(c.data_realizacao);
    data.setHours(0, 0, 0, 0);
    return data.getTime() === hoje.getTime();
  }).length;

  this.checklistsSemana = this.checklists.filter(c => {
    if (!c.data_realizacao) return false;
    const data = new Date(c.data_realizacao);
    return data >= inicioSemana;
  }).length;
}

calcularEstatisticasCompletos() {
  this.totalChecklistsCompletos = this.checklistsCompletos.length;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const inicioSemana = new Date();
  inicioSemana.setDate(hoje.getDate() - 7);
  inicioSemana.setHours(0, 0, 0, 0);

  this.checklistsCompletosHoje = this.checklistsCompletos.filter(c => {
    if (!c.data_realizacao) return false;
    const data = new Date(c.data_realizacao);
    data.setHours(0, 0, 0, 0);
    return data.getTime() === hoje.getTime();
  }).length;

  this.checklistsCompletosSemana = this.checklistsCompletos.filter(c => {
    if (!c.data_realizacao) return false;
    const data = new Date(c.data_realizacao);
    return data >= inicioSemana;
  }).length;
}
```

#### 3.3.3 FILTROS

```typescript
aplicarFiltros() {
  if (this.tipoChecklistSelecionado === 'simples') {
    this.checklistsFiltrados = this.checklists.filter(checklist => {
      const passaPlaca = !this.filtroPlaca ||
        checklist.placa.toLowerCase().includes(this.filtroPlaca.toLowerCase());

      const passaDataInicio = !this.filtroDataInicio || !checklist.data_realizacao ||
        new Date(checklist.data_realizacao) >= new Date(this.filtroDataInicio);

      const passaDataFim = !this.filtroDataFim || !checklist.data_realizacao ||
        new Date(checklist.data_realizacao) <= new Date(this.filtroDataFim);

      return passaPlaca && passaDataInicio && passaDataFim;
    });
  } else {
    this.checklistsCompletosFiltrados = this.checklistsCompletos.filter(checklist => {
      const passaPlaca = !this.filtroPlaca ||
        checklist.placa.toLowerCase().includes(this.filtroPlaca.toLowerCase());

      const passaDataInicio = !this.filtroDataInicio || !checklist.data_realizacao ||
        new Date(checklist.data_realizacao) >= new Date(this.filtroDataInicio);

      const passaDataFim = !this.filtroDataFim || !checklist.data_realizacao ||
        new Date(checklist.data_realizacao) <= new Date(this.filtroDataFim);

      return passaPlaca && passaDataInicio && passaDataFim;
    });
  }
}

buscarPorPlaca(event: any) {
  this.filtroPlaca = event.target.value;
  this.aplicarFiltros();
}

limparFiltros() {
  this.filtroPlaca = '';
  this.filtroDataInicio = '';
  this.filtroDataFim = '';

  if (this.tipoChecklistSelecionado === 'simples') {
    this.checklistsFiltrados = this.checklists;
  } else {
    this.checklistsCompletosFiltrados = this.checklistsCompletos;
  }
}
```

#### 3.3.4 CONFIGURAÇÃO DE ITENS

```typescript
carregarConfigItens() {
  this.carregandoConfig = true;
  this.configItensService.buscarTodos().subscribe({
    next: (itens) => {
      this.itensConfig = itens;
      this.organizarItensPorCategoria();
      this.carregandoConfig = false;
      console.log('Itens de configuração carregados:', itens);
    },
    error: (error) => {
      console.error('Erro ao carregar configuração de itens:', error);
      this.carregandoConfig = false;
      this.mostrarToast('Erro ao carregar configuração de itens', 'danger');
    }
  });
}

organizarItensPorCategoria() {
  this.itensConfigPorCategoria = {};
  this.itensConfig.forEach(item => {
    if (!this.itensConfigPorCategoria[item.categoria]) {
      this.itensConfigPorCategoria[item.categoria] = [];
    }
    this.itensConfigPorCategoria[item.categoria].push(item);
  });

  // Ordena cada categoria por nome do item
  Object.keys(this.itensConfigPorCategoria).forEach(categoria => {
    this.itensConfigPorCategoria[categoria].sort((a, b) => a.nome_item.localeCompare(b.nome_item));
  });
}

async toggleItem(item: ConfigItem) {
  const novoStatus = !item.habilitado;

  this.configItensService.atualizarItem({
    id: item.id,
    habilitado: novoStatus
  }).subscribe({
    next: async (response) => {
      item.habilitado = novoStatus;
      await this.mostrarToast(
        `Item "${item.nome_item}" ${novoStatus ? 'habilitado' : 'desabilitado'} com sucesso`,
        'success'
      );
    },
    error: async (error) => {
      console.error('Erro ao atualizar item:', error);
      await this.mostrarToast('Erro ao atualizar item', 'danger');
    }
  });
}

async adicionarNovoItem() {
  const isCompleto = this.tipoChecklistSelecionado === 'completo';

  // Define inputs baseado no tipo de checklist
  const inputs = isCompleto ? [
    { name: 'categoria', type: 'radio' as const, label: 'Parte 1 - Interna', value: 'PARTE1_INTERNA', checked: true },
    { name: 'categoria', type: 'radio' as const, label: 'Parte 2 - Equipamentos', value: 'PARTE2_EQUIPAMENTOS' },
    { name: 'categoria', type: 'radio' as const, label: 'Parte 3 - Dianteira', value: 'PARTE3_DIANTEIRA' },
    { name: 'categoria', type: 'radio' as const, label: 'Parte 4 - Traseira', value: 'PARTE4_TRASEIRA' },
    { name: 'categoria', type: 'radio' as const, label: 'Parte 5 - Veículos Pesados', value: 'PARTE5_ESPECIAL' }
  ] : [
    { name: 'categoria', type: 'radio' as const, label: 'Motor', value: 'MOTOR', checked: true },
    { name: 'categoria', type: 'radio' as const, label: 'Elétrico', value: 'ELETRICO' },
    { name: 'categoria', type: 'radio' as const, label: 'Limpeza', value: 'LIMPEZA' },
    { name: 'categoria', type: 'radio' as const, label: 'Ferramentas', value: 'FERRAMENTA' },
    { name: 'categoria', type: 'radio' as const, label: 'Pneus', value: 'PNEU' }
  ];

  const alert = await this.alertController.create({
    header: 'Selecione a Categoria',
    message: `Escolha em qual categoria deseja adicionar o item`,
    inputs: inputs,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Próximo',
        handler: async (categoria) => {
          if (!categoria) {
            await this.mostrarToast('Selecione uma categoria', 'danger');
            return false;
          }
          await this.mostrarAlertNomeOrdem(categoria);
          return true;
        }
      }
    ]
  });

  await alert.present();
}

async mostrarAlertNomeOrdem(categoria: string) {
  const isCompleto = this.tipoChecklistSelecionado === 'completo';
  const categoriaInfo = isCompleto
    ? this.categoriasCompleto.find(c => c.key === categoria)
    : this.categorias.find(c => c.key === categoria);

  const alert = await this.alertController.create({
    header: 'Adicionar Novo Item',
    message: `${categoriaInfo?.label}`,
    inputs: [
      {
        name: 'nome_item',
        type: 'text',
        placeholder: 'Digite o nome do item',
        attributes: { maxlength: 100, autocapitalize: 'on' }
      }
    ],
    buttons: [
      {
        text: 'Voltar',
        handler: () => { this.adicionarNovoItem(); }
      },
      {
        text: 'Adicionar',
        handler: (data) => {
          if (!data.nome_item || data.nome_item.trim() === '') {
            this.mostrarToast('Nome do item é obrigatório', 'danger');
            return false;
          }

          const usuario = this.authService.currentUserValue;

          this.executarAdicaoItem({
            categoria: categoria as any,
            nome_item: data.nome_item.trim(),
            habilitado: true,
            ordem: 999,
            usuario_id: usuario?.id,
            usuario_nome: usuario?.nome
          });

          return true;
        }
      }
    ]
  });

  await alert.present();
}

executarAdicaoItem(dados: any) {
  const isCompleto = this.tipoChecklistSelecionado === 'completo';
  const service = isCompleto ? this.configItensCompletoService : this.configItensService;

  service.adicionarItem(dados).subscribe({
    next: async (response) => {
      await this.mostrarToast('Item adicionado com sucesso!', 'success');
      if (isCompleto) {
        this.carregarConfigItensCompleto();
      } else {
        this.carregarConfigItens();
      }
    },
    error: async (error) => {
      console.error('Erro ao adicionar item:', error);
      const mensagem = error.error?.erro || 'Erro ao adicionar item';
      await this.mostrarToast(mensagem, 'danger');
    }
  });
}

async removerItem(item: ConfigItem | ConfigItemCompleto) {
  const alert = await this.alertController.create({
    header: 'Confirmar Remoção',
    message: `Tem certeza que deseja remover o item "${item.nome_item}"? Esta ação não pode ser desfeita.`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Remover',
        role: 'destructive',
        handler: () => { this.executarRemocaoItem(item.id); }
      }
    ]
  });

  await alert.present();
}

executarRemocaoItem(id: number) {
  const isCompleto = this.tipoChecklistSelecionado === 'completo';
  const service = isCompleto ? this.configItensCompletoService : this.configItensService;

  service.removerItem(id).subscribe({
    next: async (response) => {
      await this.mostrarToast('Item removido com sucesso!', 'success');
      if (isCompleto) {
        this.carregarConfigItensCompleto();
      } else {
        this.carregarConfigItens();
      }
    },
    error: async (error) => {
      console.error('Erro ao remover item:', error);
      const mensagem = error.error?.erro || error.error?.mensagem || 'Erro ao remover item';
      await this.mostrarToast(mensagem, 'danger');
    }
  });
}
```

#### 3.3.5 ANOMALIAS

```typescript
carregarAnomalias(forcarRecarregar: boolean = false): Promise<void> {
  const agora = Date.now();
  const cacheValido = !forcarRecarregar &&
    this.cacheAnomalias[this.tipoAnomalias] &&
    this.cacheTimestamp[this.tipoAnomalias] &&
    (agora - this.cacheTimestamp[this.tipoAnomalias]) < this.cacheDuracaoMs;

  if (cacheValido) {
    console.log(`Usando anomalias do cache (${this.tipoAnomalias})`);
    this.anomalias = this.cacheAnomalias[this.tipoAnomalias];
    return Promise.resolve();
  }

  console.log(`Buscando anomalias do servidor (${this.tipoAnomalias})`);
  this.carregandoAnomalias = true;
  this.erroAnomalias = '';

  return new Promise((resolve) => {
    this.apiService.buscarAnomalias(this.tipoAnomalias).subscribe({
      next: (response) => {
        this.anomalias = response;
        this.cacheAnomalias[this.tipoAnomalias] = response;
        this.cacheTimestamp[this.tipoAnomalias] = Date.now();
        this.carregandoAnomalias = false;
        console.log('Anomalias carregadas e salvas no cache:', this.anomalias);
        resolve();
      },
      error: (error) => {
        console.error('Erro ao carregar anomalias:', error);
        const mensagemErro = error.error?.erro || error.error?.message || error.message || 'Erro desconhecido';
        this.erroAnomalias = `Erro ao carregar anomalias: ${mensagemErro}`;
        this.carregandoAnomalias = false;
        resolve();
      }
    });
  });
}

limparCacheAnomalias() {
  this.cacheAnomalias = {};
  this.cacheTimestamp = {};
  console.log('Cache de anomalias limpo');
}

mudarTipoAnomalia() {
  console.log(`Mudando tipo de anomalia para: ${this.tipoAnomalias}`);
  this.carregarAnomalias(true);
}

async aprovarAnomalia(placa: string, anomalia: any) {
  console.log('Tentando aprovar anomalia:', { placa, anomalia });

  if (!placa || !anomalia) {
    this.presentToast('Erro: Dados da anomalia inválidos', 'danger');
    return;
  }

  const alert = await this.alertController.create({
    header: 'Aprovar Anomalia',
    message: `Deseja aprovar o problema "${anomalia.item}" do veículo ${placa}?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Aprovar',
        handler: () => {
          const usuario = this.authService.currentUserValue;
          const usuarioId = usuario ? usuario.id : undefined;

          this.apiService.aprovarAnomalia(placa, anomalia.categoria, anomalia.item, usuarioId).subscribe({
            next: () => {
              this.presentToast('Anomalia aprovada com sucesso', 'success');
              this.limparCacheAnomalias();
              this.carregarAnomalias(true);
            },
            error: (err) => {
              const msg = err.error?.erro || err.message || 'Erro desconhecido';
              this.presentToast(`Erro ao aprovar: ${msg}`, 'danger');
              console.error('Erro ao aprovar:', err);
            }
          });
        }
      }
    ]
  });
  await alert.present();
}

async reprovarAnomalia(placa: string, anomalia: any) {
  console.log('Tentando reprovar anomalia:', { placa, anomalia });

  if (!placa || !anomalia) {
    this.presentToast('Erro: Dados da anomalia inválidos', 'danger');
    return;
  }

  const alert = await this.alertController.create({
    header: 'Reprovar Anomalia',
    message: `Deseja reprovar o problema "${anomalia.item}" do veículo ${placa}?`,
    inputs: [
      {
        name: 'observacao',
        type: 'textarea',
        placeholder: 'Observação (opcional)'
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Reprovar',
        handler: (data) => {
          this.apiService.reprovarAnomalia(placa, anomalia.categoria, anomalia.item, data.observacao).subscribe({
            next: () => {
              this.presentToast('Anomalia reprovada', 'warning');
              this.limparCacheAnomalias();
              this.carregarAnomalias(true);
            },
            error: (err) => {
              const msg = err.error?.erro || err.message || 'Erro desconhecido';
              this.presentToast(`Erro ao reprovar: ${msg}`, 'danger');
              console.error('Erro ao reprovar:', err);
            }
          });
        }
      }
    ]
  });
  await alert.present();
}

async finalizarAnomalia(placa: string, anomalia: any) {
  const alert = await this.alertController.create({
    header: 'Finalizar Anomalia',
    message: `Deseja finalizar o problema "${anomalia.item}" do veículo ${placa}? Ele será movido para a aba de finalizadas.`,
    inputs: [
      {
        name: 'observacao',
        type: 'textarea',
        placeholder: 'Observação de finalização (opcional)'
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Finalizar',
        handler: (data) => {
          this.apiService.finalizarAnomalia(placa, anomalia.categoria, anomalia.item, data.observacao).subscribe({
            next: () => {
              this.presentToast('Anomalia finalizada com sucesso', 'success');
              this.limparCacheAnomalias();
              this.carregarAnomalias(true);
            },
            error: (err) => {
              this.presentToast('Erro ao finalizar anomalia', 'danger');
              console.error('Erro ao finalizar:', err);
            }
          });
        }
      }
    ]
  });
  await alert.present();
}

toggleDetalhesAnomalia(placa: string) {
  this.detalhesAnomaliaExpandido[placa] = !this.detalhesAnomaliaExpandido[placa];
}
```

#### 3.3.6 GRÁFICOS E MÉTRICAS

```typescript
mudarGrafico(evento: any) {
  this.graficoSelecionado = evento.detail.value;
  this.termoBuscaGrafico = '';
  setTimeout(() => this.atualizarGrafico(), 100);
}

buscarGrafico(event: any) {
  this.termoBuscaGrafico = event.target.value;
  this.filtrarDadosGrafico();
  this.renderizarGraficoGeneric();
}

getTituloGrafico(): string {
  switch (this.graficoSelecionado) {
    case 'usuarios': return 'Usuários que mais realizam checklists';
    case 'veiculos': return 'Veículos mais inspecionados';
    case 'veiculos_anomalias': return 'Veículos com maior índice de problemas';
    case 'tipos_anomalias': return 'Tipos de anomalias mais frequentes';
    case 'status_anomalias': return 'Status de resolução das anomalias';
    default: return 'Gráfico';
  }
}

atualizarGrafico() {
  this.processarDadosGrafico();
  this.filtrarDadosGrafico();
  this.renderizarGraficoGeneric();
}

processarDadosGrafico() {
  let dados: { [key: string]: number } = {};

  switch (this.graficoSelecionado) {
    case 'usuarios':
      this.checklists.forEach(c => {
        const nome = c.usuario_nome || 'Desconhecido';
        dados[nome] = (dados[nome] || 0) + 1;
      });
      break;
    case 'veiculos':
      this.checklists.forEach(c => {
        dados[c.placa] = (dados[c.placa] || 0) + 1;
      });
      break;
    case 'veiculos_anomalias':
      this.anomalias.forEach(v => {
        dados[v.placa] = v.total_problemas;
      });
      break;
    case 'tipos_anomalias':
      this.anomalias.forEach(v => {
        if (v.anomalias) {
          v.anomalias.forEach((a: any) => {
            dados[a.item] = (dados[a.item] || 0) + 1;
          });
        }
      });
      break;
    case 'status_anomalias':
      let resolvidas = 0;
      let pendentes = 0;
      this.anomalias.forEach(v => {
        if (v.anomalias) {
          v.anomalias.forEach((a: any) => {
            if (a.status_anomalia === 'finalizado' || a.status_anomalia === 'aprovado') {
              resolvidas++;
            } else {
              pendentes++;
            }
          });
        }
      });
      dados['Resolvidas/Aprovadas'] = resolvidas;
      dados['Pendentes'] = pendentes;
      break;
  }

  const labels = Object.keys(dados);
  const cores = this.graficoSelecionado === 'status_anomalias'
    ? ['#2dd36f', '#eb445a']
    : this.gerarCores(labels.length);

  this.dadosGrafico = labels
    .map((key, index) => ({
      label: key,
      value: dados[key],
      color: cores[index] || '#cccccc'
    }))
    .sort((a, b) => b.value - a.value);
}

filtrarDadosGrafico() {
  if (!this.termoBuscaGrafico) {
    this.dadosGraficoFiltrados = [...this.dadosGrafico];
  } else {
    const termo = this.termoBuscaGrafico.toLowerCase();
    this.dadosGraficoFiltrados = this.dadosGrafico.filter(d =>
      d.label.toLowerCase().includes(termo)
    );
  }
}

renderizarGraficoGeneric() {
  this.destruirGraficos();

  const ctx = document.getElementById('chartCanvas') as HTMLCanvasElement;
  if (!ctx) return;

  const labels = this.dadosGraficoFiltrados.map(d => d.label);
  const data = this.dadosGraficoFiltrados.map(d => d.value);
  const backgroundColor = this.dadosGraficoFiltrados.map(d => d.color);

  this.chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColor,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 20,
            padding: 20,
            font: { size: 14 }
          }
        },
        title: { display: false }
      },
      layout: {
        padding: 20
      }
    }
  });
}

destruirGraficos() {
  if (this.chartInstance) {
    this.chartInstance.destroy();
    this.chartInstance = null;
  }
}

gerarCores(quantidade: number) {
  const cores = [
    '#3880ff', '#2dd36f', '#ffc409', '#eb445a', '#3dc2ff',
    '#5260ff', '#2fdf75', '#ffd534', '#ff4961', '#50c8ff',
    '#7044ff', '#10dc60', '#ffce00', '#f04141', '#7a49f8'
  ];

  while (cores.length < quantidade) {
    cores.push('#' + Math.floor(Math.random() * 16777215).toString(16));
  }

  return cores.slice(0, quantidade);
}

carregarMetricas() {
  this.carregandoMetricas = true;

  const anomaliasAtivas$ = this.apiService.buscarAnomalias('ativas');
  const anomaliasFinalizadas$ = this.apiService.buscarAnomalias('finalizadas');

  import('rxjs').then(rxjs => {
    rxjs.forkJoin({
      ativas: anomaliasAtivas$,
      finalizadas: anomaliasFinalizadas$
    }).subscribe({
      next: (resultado) => {
        this.metricas.totalInspecoes = this.checklists.length + this.checklistsCompletos.length;

        this.metricas.anomaliasAtivas = resultado.ativas.reduce((total: number, veiculo: any) => total + veiculo.total_problemas, 0);
        this.metricas.anomaliasFinalizadas = resultado.finalizadas.reduce((total: number, veiculo: any) => total + veiculo.total_problemas, 0);

        const placasUnicas = new Set<string>();
        this.checklists.forEach((c: any) => placasUnicas.add(c.placa));
        this.checklistsCompletos.forEach((c: any) => placasUnicas.add(c.placa));
        this.metricas.totalVeiculos = placasUnicas.size;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const inicioSemana = new Date();
        inicioSemana.setDate(hoje.getDate() - 7);
        inicioSemana.setHours(0, 0, 0, 0);

        const todosChecklists = [...this.checklists, ...this.checklistsCompletos];
        this.metricas.inspecoesHoje = todosChecklists.filter((c: any) => {
          const data = new Date(c.data_realizacao);
          data.setHours(0, 0, 0, 0);
          return data.getTime() === hoje.getTime();
        }).length;

        this.metricas.inspecoesSemana = todosChecklists.filter((c: any) => {
          const data = new Date(c.data_realizacao);
          return data >= inicioSemana;
        }).length;

        const totalAnomalias = this.metricas.anomaliasAtivas + this.metricas.anomaliasFinalizadas;
        if (totalAnomalias > 0) {
          this.metricas.taxaAprovacao = Math.round((this.metricas.anomaliasFinalizadas / totalAnomalias) * 100);
        } else {
          this.metricas.taxaAprovacao = 0;
        }

        this.metricas.veiculosComMaisProblemas = resultado.ativas
          .sort((a: any, b: any) => b.total_problemas - a.total_problemas)
          .slice(0, 5)
          .map((v: any) => ({
            placa: v.placa,
            problemas: v.total_problemas
          }));

        const problemasPorCategoria: { [key: string]: number } = {};
        resultado.ativas.forEach((veiculo: any) => {
          veiculo.anomalias.forEach((anomalia: any) => {
            const categoria = anomalia.categoria;
            if (!problemasPorCategoria[categoria]) {
              problemasPorCategoria[categoria] = 0;
            }
            problemasPorCategoria[categoria]++;
          });
        });

        this.metricas.categoriasComMaisProblemas = Object.entries(problemasPorCategoria)
          .map(([categoria, total]) => ({ categoria, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        this.ultimaAtualizacaoMetricas = new Date();
        this.carregandoMetricas = false;
        console.log('Métricas carregadas:', this.metricas);
      },
      error: (error) => {
        console.error('Erro ao carregar métricas:', error);
        this.carregandoMetricas = false;
        this.mostrarToast('Erro ao carregar métricas', 'danger');
      }
    });
  });
}
```

#### 3.3.7 VISUALIZAÇÃO DE DETALHES

```typescript
async verDetalhes(checklist: ChecklistSimples) {
  this.carregando = true;
  try {
    this.apiService.buscarCompleto(checklist.id!).subscribe({
      next: (dados) => {
        this.checklistDetalhado = dados;

        this.tempoTelasService.buscarPorInspecao(checklist.id!).subscribe({
          next: (tempos) => {
            this.temposTelas = tempos;
            console.log('Tempos de telas:', tempos);
          },
          error: (error) => {
            console.error('Erro ao buscar tempos de telas:', error);
            this.temposTelas = [];
          }
        });

        this.mostrarModal = true;
        this.carregando = false;
        console.log('Detalhes completos:', dados);
      },
      error: async (error) => {
        console.error('Erro ao carregar detalhes:', error);
        this.carregando = false;

        const mensagemErro = error.error?.erro || error.error?.message || error.message || 'Erro desconhecido';
        const detalhes = error.error?.detalhes || error.statusText || '';

        const alert = await this.alertController.create({
          header: 'Erro ao Carregar Detalhes',
          message: `<strong>Erro:</strong> ${mensagemErro}<br>${detalhes ? `<strong>Detalhes:</strong> ${detalhes}` : ''}`,
          buttons: [
            {
              text: 'Ver Dados Básicos',
              handler: () => {
                this.mostrarAlertBasico(checklist);
              }
            },
            'Fechar'
          ]
        });

        await alert.present();
      }
    });
  } catch (error) {
    console.error('Erro:', error);
    this.carregando = false;
    this.mostrarAlertBasico(checklist);
  }
}

async mostrarAlertBasico(checklist: ChecklistSimples) {
  const alert = await this.alertController.create({
    header: `Checklist - ${checklist.placa}`,
    message: `
      <strong>ID:</strong> ${checklist.id}<br>
      <strong>Placa:</strong> ${checklist.placa}<br>
      <strong>KM Inicial:</strong> ${checklist.km_inicial}<br>
      <strong>Combustível:</strong> ${checklist.nivel_combustivel}<br>
      <strong>Data:</strong> ${this.formatarData(checklist.data_realizacao)}
    `,
    buttons: ['OK']
  });
  await alert.present();
}

async verDetalhesCompleto(checklist: ChecklistCompleto) {
  this.carregando = true;
  try {
    this.apiService.buscarChecklistCompleto(checklist.id!).subscribe({
      next: (dados) => {
        this.checklistCompletoDetalhado = dados;
        this.mostrarModalCompleto = true;
        this.carregando = false;
        console.log('Detalhes checklist completo:', dados);
      },
      error: async (error) => {
        console.error('Erro ao carregar detalhes completo:', error);
        this.carregando = false;

        const mensagemErro = error.error?.erro || error.error?.message || error.message || 'Erro desconhecido';
        const alert = await this.alertController.create({
          header: 'Erro ao Carregar Detalhes',
          message: `<strong>Erro:</strong> ${mensagemErro}`,
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  } catch (error) {
    console.error('Erro:', error);
    this.carregando = false;
  }
}

fecharModal() {
  this.mostrarModal = false;
  this.checklistDetalhado = null;
  this.temposTelas = [];
}

fecharModalCompleto() {
  this.mostrarModalCompleto = false;
  this.checklistCompletoDetalhado = null;
}
```

#### 3.3.8 EXPANSÃO E ZOOM DE FOTOS

```typescript
private wheelZoomHandler: any;
private keyboardHandler: any;

expandirFoto(foto: string) {
  this.fotoExpandida = foto;
  this.mostrarFotoExpandida = true;
  this.zoomLevel = 1;

  this.wheelZoomHandler = (event: Event) => this.handleWheelZoom(event as WheelEvent);
  this.keyboardHandler = (event: Event) => this.handleKeyboardShortcuts(event as KeyboardEvent);

  setTimeout(() => {
    const container = document.querySelector('.foto-expandida-container');
    if (container) {
      container.addEventListener('wheel', this.wheelZoomHandler, { passive: false });
    }

    document.addEventListener('keydown', this.keyboardHandler);
  }, 100);
}

fecharFotoExpandida() {
  const container = document.querySelector('.foto-expandida-container');
  if (container && this.wheelZoomHandler) {
    container.removeEventListener('wheel', this.wheelZoomHandler);
  }
  if (this.keyboardHandler) {
    document.removeEventListener('keydown', this.keyboardHandler);
  }

  this.mostrarFotoExpandida = false;
  this.fotoExpandida = null;
  this.zoomLevel = 1;
}

handleKeyboardShortcuts(event: KeyboardEvent) {
  if (!this.mostrarFotoExpandida) return;

  switch (event.key) {
    case 'Escape':
      this.fecharFotoExpandida();
      break;
    case '+':
    case '=':
      event.preventDefault();
      this.zoomIn();
      break;
    case '-':
    case '_':
      event.preventDefault();
      this.zoomOut();
      break;
    case '0':
      event.preventDefault();
      this.resetZoom();
      break;
  }
}

handleWheelZoom(event: WheelEvent) {
  event.preventDefault();

  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  const newZoom = this.zoomLevel + delta;

  if (newZoom >= 0.5 && newZoom <= 5) {
    this.zoomLevel = Math.round(newZoom * 10) / 10;
  }
}

zoomIn() {
  if (this.zoomLevel < 5) {
    this.zoomLevel = Math.round((this.zoomLevel + 0.5) * 10) / 10;
  }
}

zoomOut() {
  if (this.zoomLevel > 0.5) {
    this.zoomLevel = Math.round((this.zoomLevel - 0.5) * 10) / 10;
  }
}

resetZoom() {
  this.zoomLevel = 1;
}
```

#### 3.3.9 UTILITÁRIOS

```typescript
formatarData(data: string | undefined): string {
  if (!data) return '-';
  const d = new Date(data);
  return d.toLocaleString('pt-BR');
}

recarregar(event: any) {
  if (this.tipoChecklistSelecionado === 'simples') {
    this.apiService.buscarTodos(1000).subscribe({
      next: (response) => {
        this.checklists = response;
        this.aplicarFiltros();
        this.calcularEstatisticas();
        event.target.complete();
      },
      error: (error) => {
        console.error('Erro ao recarregar:', error);
        event.target.complete();
      }
    });
  } else {
    this.apiService.buscarChecklistsCompletos(1000).subscribe({
      next: (response) => {
        this.checklistsCompletos = response;
        this.aplicarFiltros();
        this.calcularEstatisticasCompletos();
        event.target.complete();
      },
      error: (error) => {
        console.error('Erro ao recarregar:', error);
        event.target.complete();
      }
    });
  }
}

async voltar() {
  await this.authService.logout();
  this.router.navigate(['/login']);
}

getCorStatus(valor: string): string {
  if (!valor) return 'medium';

  const valorLower = valor.toLowerCase();

  if (valorLower.includes('bom') || valorLower.includes('ótimo') || valorLower.includes('otimo')) {
    return 'success';
  } else if (valorLower.includes('ruim') || valorLower.includes('crítico') || valorLower.includes('critico')) {
    return 'danger';
  } else if (valorLower.includes('regular') || valorLower.includes('atenção') || valorLower.includes('atencao')) {
    return 'warning';
  } else if (valorLower.includes('satisfatório') || valorLower.includes('satisfatorio')) {
    return 'primary';
  }

  return 'medium';
}

formatarTempo(segundos: number): string {
  if (!segundos || segundos === 0) return '0s';

  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;

  if (minutos === 0) {
    return `${segs}s`;
  } else if (segs === 0) {
    return `${minutos}m`;
  } else {
    return `${minutos}m ${segs}s`;
  }
}

getTotalTempo(): string {
  if (!this.temposTelas || this.temposTelas.length === 0) {
    return '0s';
  }

  const totalSegundos = this.temposTelas.reduce((total, tempo) => {
    return total + (tempo.tempo_segundos || 0);
  }, 0);

  return this.formatarTempo(totalSegundos);
}

getNomeTela(nomeTela: string): string {
  const nomes: { [key: string]: string } = {
    'inspecao-inicial': 'Inspeção Inicial',
    'inspecao-veiculo': 'Inspeção do Veículo',
    'fotos-veiculo': 'Fotos do Veículo',
    'pneus': 'Pneus'
  };
  return nomes[nomeTela] || nomeTela;
}

getObjectKeys(obj: any): string[] {
  return obj ? Object.keys(obj) : [];
}

formatarNomeCampo(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

formatarValor(valor: any): string {
  if (typeof valor === 'boolean') {
    return valor ? 'Sim' : 'Não';
  }
  if (valor === null || valor === undefined || valor === '') {
    return 'N/A';
  }
  return String(valor);
}

formatarCategoria(categoria: string): string {
  const categorias: { [key: string]: string } = {
    'MOTOR': 'Motor',
    'ELETRICO': 'Elétrico',
    'LIMPEZA': 'Limpeza',
    'FERRAMENTA': 'Ferramentas',
    'PNEU': 'Pneus'
  };
  return categorias[categoria] || categoria;
}

formatarUsuarios(usuarios: string[]): string {
  if (!usuarios || usuarios.length === 0) {
    return 'Usuário não identificado';
  }
  if (usuarios.length === 1) {
    return usuarios[0];
  }
  return usuarios.join(', ');
}

async mostrarToast(mensagem: string, cor: string = 'primary') {
  const toast = await this.toastController.create({
    message: mensagem,
    duration: 3000,
    position: 'bottom',
    color: cor
  });
  await toast.present();
}

async presentToast(message: string, color: string = 'primary') {
  const toast = await this.toastController.create({
    message: message,
    duration: 2500,
    position: 'bottom',
    color: color
  });
  await toast.present();
}

mudarAba(aba: 'historico' | 'anomalias' | 'configuracao' | 'metricas') {
  this.abaSelecionada = aba;
  if (aba === 'configuracao') {
    if (this.tipoChecklistSelecionado === 'simples' && this.itensConfig.length === 0) {
      this.carregarConfigItens();
    } else if (this.tipoChecklistSelecionado === 'completo' && this.itensConfigCompleto.length === 0) {
      this.carregarConfigItensCompleto();
    }
  } else if (aba === 'anomalias') {
    if (this.anomalias.length === 0) {
      this.carregarAnomalias();
    }
  } else if (aba === 'metricas') {
    this.carregarMetricas();

    const promises = [];

    if (this.checklists.length === 0) {
      promises.push(new Promise<void>(resolve => {
        this.carregarChecklists();
        setTimeout(resolve, 1000);
      }));
    }

    if (this.anomalias.length === 0) {
      promises.push(this.carregarAnomalias());
    }

    if (promises.length > 0) {
      Promise.all(promises).then(() => {
        setTimeout(() => this.atualizarGrafico(), 500);
      });
    } else {
      setTimeout(() => this.atualizarGrafico(), 500);
    }
  }
}

mudarTipoChecklist(tipo: 'simples' | 'completo') {
  this.tipoChecklistSelecionado = tipo;

  if (tipo === 'simples') {
    if (this.checklists.length === 0) {
      this.carregarChecklists();
    }
    if (this.abaSelecionada === 'configuracao' && this.itensConfig.length === 0) {
      this.carregarConfigItens();
    }
  } else if (tipo === 'completo') {
    if (this.checklistsCompletos.length === 0) {
      this.carregarChecklistsCompletos();
    }
    if (this.abaSelecionada === 'configuracao' && this.itensConfigCompleto.length === 0) {
      this.carregarConfigItensCompleto();
    }
  }
}

getCategoriaIcon(categoria: string): string {
  const icones: { [key: string]: string } = {
    'MOTOR': 'construct-outline',
    'ELETRICO': 'flash-outline',
    'LIMPEZA': 'water-outline',
    'FERRAMENTA': 'build-outline',
    'PNEU': 'ellipse-outline',
    'PARTE1_INTERNA': 'car-outline',
    'PARTE2_EQUIPAMENTOS': 'construct-outline',
    'PARTE3_DIANTEIRA': 'arrow-up-outline',
    'PARTE4_TRASEIRA': 'arrow-down-outline',
    'PARTE5_ESPECIAL': 'bus-outline'
  };
  return icones[categoria] || 'help-outline';
}

getCategoriaColor(categoria: string): string {
  const cores: { [key: string]: string } = {
    'MOTOR': '#3880ff',
    'ELETRICO': '#ffc409',
    'LIMPEZA': '#2dd36f',
    'FERRAMENTA': '#eb445a',
    'PNEU': '#3dc2ff',
    'PARTE1_INTERNA': '#3880ff',
    'PARTE2_EQUIPAMENTOS': '#ffc409',
    'PARTE3_DIANTEIRA': '#2dd36f',
    'PARTE4_TRASEIRA': '#eb445a',
    'PARTE5_ESPECIAL': '#3dc2ff'
  };
  return cores[categoria] || '#666666';
}
```

---

## 4. HTML - admin.page.html

O arquivo HTML é extenso (1343 linhas). Vou destacar as partes principais da estrutura:

### 4.1 Header

```html
<ion-header [translucent]="true">
  <ion-toolbar color="primary">
    <ion-buttons slot="start">
      <ion-button (click)="voltar()">
        <ion-icon slot="icon-only" name="arrow-back"></ion-icon>
      </ion-button>
    </ion-buttons>
    <ion-title>Painel Administrativo</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="carregarChecklists()">
        <ion-icon slot="icon-only" name="refresh"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>
```

### 4.2 Content e Pull to Refresh

```html
<ion-content [fullscreen]="true" color="light">
  <ion-header collapse="condense">
    <ion-toolbar color="primary">
      <ion-title size="large">Admin</ion-title>
    </ion-toolbar>
  </ion-header>

  <!-- Pull to Refresh -->
  <ion-refresher slot="fixed" (ionRefresh)="recarregar($event)">
    <ion-refresher-content></ion-refresher-content>
  </ion-refresher>

  <div class="content-container">
    <!-- Conteúdo aqui -->
  </div>
</ion-content>
```

### 4.3 Seletor de Tipo de Checklist

```html
<!-- Seleção de Tipo de Checklist -->
<ion-card class="tipo-checklist-card">
  <ion-card-content>
    <ion-segment [(ngModel)]="tipoChecklistSelecionado" (ionChange)="mudarTipoChecklist(tipoChecklistSelecionado)" mode="md">
      <ion-segment-button value="simples">
        <ion-icon name="checkmark-circle-outline"></ion-icon>
        <ion-label>Checklist Simples</ion-label>
      </ion-segment-button>
      <ion-segment-button value="completo">
        <ion-icon name="clipboard-outline"></ion-icon>
        <ion-label>Checklist Completo</ion-label>
      </ion-segment-button>
    </ion-segment>
  </ion-card-content>
</ion-card>
```

### 4.4 Abas (Segmentos)

```html
<!-- Segmentos (Abas) -->
<ion-segment [(ngModel)]="abaSelecionada" (ionChange)="mudarAba(abaSelecionada)">
  <ion-segment-button value="historico">
    <ion-label>Histórico</ion-label>
    <ion-icon name="list"></ion-icon>
  </ion-segment-button>
  <ion-segment-button value="anomalias">
    <ion-label>Anomalias</ion-label>
    <ion-icon name="warning"></ion-icon>
  </ion-segment-button>
  <ion-segment-button value="metricas">
    <ion-label>Métricas</ion-label>
    <ion-icon name="analytics"></ion-icon>
  </ion-segment-button>
  <ion-segment-button value="configuracao">
    <ion-label>Configurar Itens</ion-label>
    <ion-icon name="settings"></ion-icon>
  </ion-segment-button>
</ion-segment>
```

### 4.5 ABA HISTÓRICO

```html
<div *ngIf="abaSelecionada === 'historico'">
  <!-- Estatísticas - Checklist Simples -->
  <div class="stats-container animate-in-left" *ngIf="tipoChecklistSelecionado === 'simples'">
    <ion-card class="stat-card">
      <ion-card-content>
        <ion-icon name="document-text" color="primary"></ion-icon>
        <h2>{{ totalChecklists }}</h2>
        <p>Total</p>
      </ion-card-content>
    </ion-card>

    <ion-card class="stat-card">
      <ion-card-content>
        <ion-icon name="today" color="success"></ion-icon>
        <h2>{{ checklistsHoje }}</h2>
        <p>Hoje</p>
      </ion-card-content>
    </ion-card>

    <ion-card class="stat-card">
      <ion-card-content>
        <ion-icon name="calendar" color="warning"></ion-icon>
        <h2>{{ checklistsSemana }}</h2>
        <p>7 Dias</p>
      </ion-card-content>
    </ion-card>
  </div>

  <!-- Filtros -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>Filtros</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <!-- Busca por Placa -->
      <ion-searchbar placeholder="Buscar por placa" [(ngModel)]="filtroPlaca" (ionInput)="buscarPorPlaca($event)" debounce="500"></ion-searchbar>

      <!-- Filtro de Data -->
      <ion-item>
        <ion-label position="stacked">Data Inicial</ion-label>
        <ion-input type="date" [(ngModel)]="filtroDataInicio" (ionChange)="aplicarFiltros()"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Data Final</ion-label>
        <ion-input type="date" [(ngModel)]="filtroDataFim" (ionChange)="aplicarFiltros()"></ion-input>
      </ion-item>

      <ion-button expand="block" fill="outline" color="medium" (click)="limparFiltros()" class="clear-filters-btn">
        <ion-icon slot="start" name="close-circle"></ion-icon>
        Limpar Filtros
      </ion-button>
    </ion-card-content>
  </ion-card>

  <!-- Lista de Checklists Simples -->
  <ion-list class="animate-in-left" *ngIf="!carregando && tipoChecklistSelecionado === 'simples' && checklistsFiltrados.length > 0">
    <ion-item-sliding *ngFor="let checklist of checklistsFiltrados">
      <ion-item button (click)="verDetalhes(checklist)">
        <ion-icon name="car-sport" slot="start" color="primary"></ion-icon>
        <ion-label>
          <h2><strong>{{ checklist.placa }}</strong></h2>
          <p>KM: {{ checklist.km_inicial }} | Combustível: {{ checklist.nivel_combustivel }}</p>
          <p *ngIf="checklist.usuario_nome"><ion-icon name="person"></ion-icon> Inspetor: {{ checklist.usuario_nome }}</p>
          <p class="data-texto">{{ formatarData(checklist.data_realizacao) }}</p>
        </ion-label>
        <ion-badge slot="end" color="primary">ID: {{ checklist.id }}</ion-badge>
      </ion-item>

      <ion-item-options side="end">
        <ion-item-option color="primary" (click)="verDetalhes(checklist)">
          <ion-icon slot="icon-only" name="eye"></ion-icon>
        </ion-item-option>
      </ion-item-options>
    </ion-item-sliding>
  </ion-list>
</div>
```

### 4.6 ABA ANOMALIAS

```html
<div *ngIf="abaSelecionada === 'anomalias'">
  <ion-card color="danger">
    <ion-card-content>
      <ion-icon name="warning"></ion-icon>
      Veículos com problemas detectados nos checklists
    </ion-card-content>
  </ion-card>

  <!-- Segmento para alternar entre ativas e finalizadas -->
  <ion-segment [(ngModel)]="tipoAnomalias" (ionChange)="mudarTipoAnomalia()" style="margin-bottom: 20px;">
    <ion-segment-button value="ativas">
      <ion-label>Ativas</ion-label>
      <ion-icon name="alert-circle"></ion-icon>
    </ion-segment-button>
    <ion-segment-button value="finalizadas">
      <ion-label>Finalizadas</ion-label>
      <ion-icon name="checkmark-circle"></ion-icon>
    </ion-segment-button>
  </ion-segment>

  <!-- Lista de Anomalias por Placa -->
  <div *ngIf="!carregandoAnomalias && anomalias.length > 0">
    <ion-card *ngFor="let veiculo of anomalias" class="anomalia-card">
      <ion-card-header [style.background]="'linear-gradient(135deg, #eb445a 0%, #c1365d 100%)'">
        <ion-card-title style="color: white; display: flex; align-items: center; justify-content: space-between;">
          <span>
            <ion-icon name="car" style="margin-right: 8px;"></ion-icon>
            {{ veiculo.placa }}
          </span>
          <ion-badge color="light">
            {{ veiculo.total_problemas }} problema{{ veiculo.total_problemas > 1 ? 's' : '' }}
          </ion-badge>
        </ion-card-title>
      </ion-card-header>

      <ion-card-content>
        <!-- Resumo -->
        <div style="margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span><strong>Total de problemas:</strong></span>
            <span>{{ veiculo.total_problemas }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span><strong>Inspeções com problema:</strong></span>
            <span>{{ veiculo.total_inspecoes_com_problema }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span><strong>Última inspeção:</strong></span>
            <span>{{ formatarData(veiculo.data_ultima_inspecao) }}</span>
          </div>
        </div>

        <!-- Lista de Problemas -->
        <ion-button expand="block" fill="outline" color="danger" (click)="toggleDetalhesAnomalia(veiculo.placa)">
          <ion-icon name="{{ detalhesAnomaliaExpandido[veiculo.placa] ? 'chevron-up' : 'chevron-down' }}" slot="start"></ion-icon>
          {{ detalhesAnomaliaExpandido[veiculo.placa] ? 'Ocultar' : 'Ver' }} Detalhes dos Problemas
        </ion-button>

        <ion-list *ngIf="detalhesAnomaliaExpandido[veiculo.placa]">
          <ion-item *ngFor="let anomalia of veiculo.anomalias" lines="full">
            <ion-icon name="alert-circle" slot="start" color="danger"></ion-icon>
            <ion-label class="ion-text-wrap">
              <h3><strong>{{ anomalia.item }}</strong></h3>
              <p>
                <ion-badge [color]="getCorStatus(anomalia.status)">{{ anomalia.status }}</ion-badge>
                <span style="margin-left: 8px;">{{ formatarCategoria(anomalia.categoria) }}</span>
              </p>
              <p style="font-size: 0.85em; color: var(--ion-color-medium); margin-top: 4px;">
                <ion-icon name="calendar-outline" style="font-size: 0.9em;"></ion-icon>
                {{ formatarData(anomalia.data_realizacao) }}
              </p>

              <!-- Botões de Aprovação (apenas para ativas) -->
              <div *ngIf="tipoAnomalias === 'ativas'" style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                <div *ngIf="!anomalia.status_anomalia || anomalia.status_anomalia === 'pendente'" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                  <ion-button expand="block" color="success" (click)="aprovarAnomalia(veiculo.placa, anomalia)">
                    <ion-icon name="checkmark-circle" slot="start"></ion-icon>
                    Aprovar
                  </ion-button>
                  <ion-button expand="block" color="danger" (click)="reprovarAnomalia(veiculo.placa, anomalia)">
                    <ion-icon name="close-circle" slot="start"></ion-icon>
                    Reprovar
                  </ion-button>
                </div>

                <div *ngIf="anomalia.status_anomalia === 'aprovado'" style="width: 100%;">
                  <ion-badge color="success" style="margin-bottom: 8px;">Aprovado</ion-badge>
                  <ion-button size="small" expand="block" color="warning" (click)="finalizarAnomalia(veiculo.placa, anomalia)">
                    <ion-icon name="checkmark-done" slot="start"></ion-icon>
                    Finalizar
                  </ion-button>
                </div>
              </div>
            </ion-label>
            <ion-button slot="end" fill="clear" *ngIf="anomalia.foto" (click)="expandirFoto(anomalia.foto)">
              <ion-icon name="image" color="primary"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
      </ion-card-content>
    </ion-card>
  </div>
</div>
```

### 4.7 ABA CONFIGURAÇÃO

```html
<div *ngIf="abaSelecionada === 'configuracao'">
  <ion-card color="warning">
    <ion-card-content>
      <ion-icon name="information-circle" color="dark"></ion-icon>
      Configure quais itens devem aparecer na inspeção veicular
    </ion-card-content>
  </ion-card>

  <!-- Botão para Adicionar Novo Item -->
  <ion-button expand="block" color="success" (click)="adicionarNovoItem()" [disabled]="carregandoConfig">
    <ion-icon slot="start" name="add-circle"></ion-icon>
    Adicionar Novo Item
  </ion-button>

  <!-- Configuração por Categoria - SIMPLES -->
  <div *ngIf="!carregandoConfig && tipoChecklistSelecionado === 'simples'">
    <ion-card *ngFor="let categoria of categorias">
      <ion-card-header [style.background]="'linear-gradient(135deg, ' + categoria.color + ' 0%, ' + categoria.color + 'dd 100%)'">
        <ion-card-title>
          <ion-icon [name]="categoria.icon"></ion-icon>
          {{ categoria.label }}
          <ion-badge>
            {{ itensConfigPorCategoria[categoria.key]?.length || 0 }}
          </ion-badge>
        </ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <ion-list>
          <ion-item-sliding *ngFor="let item of itensConfigPorCategoria[categoria.key]">
            <ion-item>
              <ion-label>
                <h3>{{ item.nome_item }}</h3>
                <p *ngIf="item.usuario_nome" class="usuario-info">
                  <ion-icon name="person-outline"></ion-icon>
                  Adicionado por: {{ item.usuario_nome }}
                </p>
              </ion-label>
              <ion-toggle slot="end" [checked]="item.habilitado" (ionChange)="toggleItem(item)" [color]="item.habilitado ? 'success' : 'danger'"></ion-toggle>
            </ion-item>

            <!-- Opção de deslizar para remover -->
            <ion-item-options side="end">
              <ion-item-option color="danger" (click)="removerItem(item)">
                <ion-icon slot="icon-only" name="trash"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>

        <!-- Mensagem se não houver itens -->
        <div *ngIf="!itensConfigPorCategoria[categoria.key] || itensConfigPorCategoria[categoria.key].length === 0" class="empty-state-small">
          <ion-icon [name]="categoria.icon"></ion-icon>
          <p>Nenhum item cadastrado nesta categoria</p>
        </div>
      </ion-card-content>
    </ion-card>
  </div>
</div>
```

### 4.8 ABA MÉTRICAS

```html
<div *ngIf="abaSelecionada === 'metricas'">
  <ion-card>
    <ion-card-header>
      <ion-card-title>
        <ion-icon name="analytics" color="primary"></ion-icon>
        Dashboard de Métricas
      </ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <p style="color: #666;">Visão geral do sistema de inspeções</p>
    </ion-card-content>
  </ion-card>

  <!-- Resumo Geral -->
  <ion-row>
    <ion-col size="6" size-md="3">
      <ion-card color="primary">
        <ion-card-content style="text-align: center; padding: 16px;">
          <h2 style="color: white; margin: 8px 0; font-size: 24px;">{{ totalChecklists }}</h2>
          <p style="color: white; margin: 0; font-size: 0.8em;">Checklists</p>
        </ion-card-content>
      </ion-card>
    </ion-col>
    <ion-col size="6" size-md="3">
      <ion-card color="warning">
        <ion-card-content style="text-align: center; padding: 16px;">
          <h2 style="color: white; margin: 8px 0; font-size: 24px;">{{ anomalias.length }}</h2>
          <p style="color: white; margin: 0; font-size: 0.8em;">Veíc. c/ Prob.</p>
        </ion-card-content>
      </ion-card>
    </ion-col>
    <ion-col size="6" size-md="3">
      <ion-card color="success">
        <ion-card-content style="text-align: center; padding: 16px;">
          <h2 style="color: white; margin: 8px 0; font-size: 24px;">{{ checklistsHoje }}</h2>
          <p style="color: white; margin: 0; font-size: 0.8em;">Hoje</p>
        </ion-card-content>
      </ion-card>
    </ion-col>
    <ion-col size="6" size-md="3">
      <ion-card color="tertiary">
        <ion-card-content style="text-align: center; padding: 16px;">
          <h2 style="color: white; margin: 8px 0; font-size: 24px;">{{ checklistsSemana }}</h2>
          <p style="color: white; margin: 0; font-size: 0.8em;">Semana</p>
        </ion-card-content>
      </ion-card>
    </ion-col>
  </ion-row>

  <!-- Seletor de Gráficos -->
  <ion-segment [(ngModel)]="graficoSelecionado" (ionChange)="mudarGrafico($event)" scrollable mode="md" class="chart-segment">
    <ion-segment-button value="usuarios">
      <ion-label>Usuários</ion-label>
    </ion-segment-button>
    <ion-segment-button value="veiculos">
      <ion-label>Veículos</ion-label>
    </ion-segment-button>
    <ion-segment-button value="veiculos_anomalias">
      <ion-label>Veic. c/ Prob.</ion-label>
    </ion-segment-button>
    <ion-segment-button value="tipos_anomalias">
      <ion-label>Tipos</ion-label>
    </ion-segment-button>
    <ion-segment-button value="status_anomalias">
      <ion-label>Status</ion-label>
    </ion-segment-button>
  </ion-segment>

  <!-- Busca -->
  <ion-searchbar placeholder="Filtrar dados do gráfico..." [(ngModel)]="termoBuscaGrafico" (ionInput)="buscarGrafico($event)" debounce="300" animated></ion-searchbar>

  <!-- Container do Gráfico -->
  <ion-card class="chart-card animate-in-up">
    <ion-card-header>
      <ion-card-title class="ion-text-center">{{ getTituloGrafico() }}</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <div class="chart-container" style="position: relative; height: 600px; width: 100%; display: flex; justify-content: center; align-items: center;">
        <canvas id="chartCanvas"></canvas>
      </div>
    </ion-card-content>
  </ion-card>

  <!-- Lista de Dados -->
  <ion-card class="animate-in-up" *ngIf="dadosGraficoFiltrados.length > 0">
    <ion-card-header>
      <ion-card-title>Detalhamento ({{ dadosGraficoFiltrados.length }})</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <ion-list>
        <ion-item *ngFor="let item of dadosGraficoFiltrados">
          <ion-avatar slot="start" [style.background]="item.color" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 16px;"></ion-avatar>
          <ion-label>
            <h2>{{ item.label }}</h2>
            <p>Quantidade: {{ item.value }}</p>
          </ion-label>
          <ion-badge slot="end" color="medium">{{ item.value }}</ion-badge>
        </ion-item>
      </ion-list>
    </ion-card-content>
  </ion-card>
</div>
```

### 4.9 Modal de Detalhes (Simplificado)

```html
<!-- Modal de Detalhes -->
<ion-modal [isOpen]="mostrarModal" (didDismiss)="fecharModal()">
  <ng-template>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Detalhes do Checklist</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="fecharModal()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content *ngIf="checklistDetalhado">
      <div class="detalhes-container">
        <!-- Informações Básicas -->
        <ion-card class="info-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="information-circle"></ion-icon>
              Informações do Veículo
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="info-grid">
              <div class="info-item">
                <ion-icon name="finger-print" color="medium"></ion-icon>
                <div class="info-content">
                  <span class="info-label">ID</span>
                  <span class="info-value">#{{ checklistDetalhado.id }}</span>
                </div>
              </div>

              <div class="info-item">
                <ion-icon name="car" color="primary"></ion-icon>
                <div class="info-content">
                  <span class="info-label">Placa</span>
                  <span class="info-value">{{ checklistDetalhado.placa }}</span>
                </div>
              </div>

              <!-- Mais campos... -->
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Tempo de Telas -->
        <ion-card *ngIf="temposTelas && temposTelas.length > 0">
          <ion-card-header>
            <ion-card-title>Tempo de Telas</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item *ngFor="let tempo of temposTelas">
                <ion-icon name="time-outline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <h3>{{ getNomeTela(tempo.tela) }}</h3>
                  <p>Tempo: <strong>{{ formatarTempo(tempo.tempo_segundos) }}</strong></p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Fotos e outros detalhes... -->
      </div>
    </ion-content>
  </ng-template>
</ion-modal>
```

### 4.10 Modal de Foto Expandida

```html
<!-- Modal para expansão de foto -->
<ion-modal [isOpen]="mostrarFotoExpandida" (didDismiss)="fecharFotoExpandida()">
  <ng-template>
    <ion-header>
      <ion-toolbar color="dark">
        <ion-title>Foto - Zoom {{ zoomLevel }}x</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="resetZoom()" [disabled]="zoomLevel === 1">
            <ion-icon name="contract-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button (click)="zoomOut()" [disabled]="zoomLevel <= 0.5">
            <ion-icon name="remove-circle-outline"></ion-icon>
          </ion-button>
          <ion-button (click)="zoomIn()" [disabled]="zoomLevel >= 5">
            <ion-icon name="add-circle-outline"></ion-icon>
          </ion-button>
          <ion-button (click)="fecharFotoExpandida()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="foto-expandida-content">
      <div class="foto-expandida-container">
        <img [src]="fotoExpandida" alt="Foto Expandida" class="foto-expandida" [style.transform]="'scale(' + zoomLevel + ')'" />
      </div>

      <!-- Controles de zoom flutuantes -->
      <div class="zoom-controls">
        <ion-fab-button size="small" color="light" (click)="zoomOut()" [disabled]="zoomLevel <= 0.5">
          <ion-icon name="remove"></ion-icon>
        </ion-fab-button>
        <ion-chip color="light">
          <ion-label>{{ zoomLevel }}x</ion-label>
        </ion-chip>
        <ion-fab-button size="small" color="light" (click)="zoomIn()" [disabled]="zoomLevel >= 5">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </div>
    </ion-content>
  </ng-template>
</ion-modal>
```

---

## 5. SCSS - admin.page.scss

O arquivo SCSS é extenso (1702 linhas). Vou destacar as partes principais:

### 5.1 Container Principal

```scss
.content-container {
  padding: 16px;
  width: 100%;
  margin: 0;
}
```

### 5.2 Estatísticas

```scss
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 16px;

  .stat-card {
    margin: 0;
    text-align: center;
    animation: slideInUp 0.4s ease-out;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    ion-card-content {
      padding: 16px 8px;
      background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
      border-radius: 8px;
      border: 1px solid #3a3a3a;

      ion-icon {
        font-size: 32px;
        margin-bottom: 8px;
        animation: pulse 2s infinite ease-in-out;
      }

      h2 {
        margin: 8px 0 4px 0;
        font-size: 24px;
        font-weight: bold;
        color: #ffffff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      p {
        margin: 0;
        font-size: 12px;
        color: #c9c9c9;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
  }
}
```

### 5.3 Modal de Detalhes

```scss
.detalhes-container {
  padding: 12px;
  width: 100%;
  height: 100%;
  overflow-y: auto;

  @media (min-width: 768px) {
    padding: 16px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 16px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    @media (min-width: 1024px) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: var(--ion-color-light);
    border-radius: 12px;
    border-left: 4px solid var(--ion-color-primary);
    transition: all 0.3s ease;

    &:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    ion-icon {
      font-size: 28px;
      flex-shrink: 0;

      @media (min-width: 768px) {
        font-size: 32px;
      }
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;

      .info-label {
        font-size: 11px;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;

        @media (min-width: 768px) {
          font-size: 12px;
        }
      }

      .info-value {
        font-size: 14px;
        color: var(--ion-color-dark);
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        @media (min-width: 768px) {
          font-size: 16px;
        }
      }
    }
  }
}
```

### 5.4 Foto Expandida

```scss
.foto-expandida-content {
  --background: #0a0a0a;

  .foto-expandida-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    padding: 40px;
    overflow: auto;
    position: relative;

    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;

    .foto-expandida {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.8);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: center center;
      cursor: grab;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;

      &:active {
        cursor: grabbing;
      }

      @media (min-width: 1024px) {
        border-radius: 16px;
        box-shadow: 0 12px 60px rgba(0, 0, 0, 0.9);
      }
    }
  }

  .zoom-controls {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    padding: 16px 28px;
    border-radius: 60px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    z-index: 1000;
    border: 1px solid rgba(255, 255, 255, 0.1);

    ion-fab-button {
      --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      --background: rgba(255, 255, 255, 0.15);
      --background-hover: rgba(255, 255, 255, 0.25);
      --background-activated: rgba(255, 255, 255, 0.35);

      &[disabled] {
        opacity: 0.3;
      }
    }

    ion-chip {
      margin: 0;
      font-weight: 700;
      min-width: 80px;
      text-align: center;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(5px);

      ion-label {
        font-size: 16px;
        color: #fff;
      }
    }
  }
}
```

### 5.5 Anomalias

```scss
.anomalia-card {
  margin-bottom: 20px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(235, 68, 90, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInUp 0.4s ease-out;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(235, 68, 90, 0.25);
  }

  ion-card-header {
    padding: 20px;
    border-bottom: none;

    ion-card-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 20px;
      font-weight: 700;
      gap: 12px;
      flex-wrap: wrap;

      ion-icon {
        font-size: 24px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }

      ion-badge {
        font-size: 14px;
        font-weight: 700;
        padding: 8px 16px;
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
        background: white;
        color: var(--ion-color-danger);
        animation: pulse 2s infinite;
      }
    }
  }

  ion-card-content {
    padding: 20px;
    background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);

    ion-list {
      margin-top: 16px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      background: white;

      ion-item {
        --padding-start: 16px;
        --padding-end: 16px;
        --inner-padding-end: 0;
        --min-height: 90px;
        --background: white;
        border-bottom: 1px solid #f0f0f0;
        transition: all 0.2s ease;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          --background: #f8f9fa;
        }

        ion-label {
          margin: 12px 0;

          h3 {
            font-size: 16px;
            font-weight: 700;
            color: var(--ion-color-dark);
            margin: 0 0 8px 0;
            line-height: 1.4;
          }

          p {
            margin: 4px 0;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            line-height: 1.6;

            ion-badge {
              font-size: 11px;
              font-weight: 600;
              padding: 4px 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          }
        }
      }
    }
  }
}
```

### 5.6 Animações

```scss
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
```

---

## 6. MÓDULOS - admin.module.ts

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminPageRoutingModule } from './admin-routing.module';

import { AdminPage } from './admin.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminPageRoutingModule
  ],
  declarations: [AdminPage]
})
export class AdminPageModule {}
```

---

## 7. ROTEAMENTO - admin-routing.module.ts

```typescript
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminPage } from './admin.page';

const routes: Routes = [
  {
    path: '',
    component: AdminPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminPageRoutingModule {}
```

---

## 8. FUNCIONALIDADES DETALHADAS

### 8.1 SISTEMA DE ABAS

A tela de admin possui 4 abas principais, controladas pelo segmento:

1. **Histórico**: Visualização de checklists
2. **Anomalias**: Gestão de problemas detectados
3. **Métricas**: Gráficos e estatísticas
4. **Configuração**: Gerenciamento de itens

**Troca de Abas**: Ao trocar de aba, o método `mudarAba()` é chamado, que carrega os dados necessários caso ainda não tenham sido carregados.

### 8.2 CACHE DE ANOMALIAS

O sistema implementa um cache de 5 minutos para anomalias:

- `cacheAnomalias`: Armazena os dados por tipo (ativas/finalizadas)
- `cacheTimestamp`: Registra o momento do cache
- `cacheDuracaoMs`: Define a duração do cache (5 minutos)

**Benefício**: Reduz chamadas desnecessárias ao servidor e melhora a performance.

### 8.3 FILTROS DINÂMICOS

Os filtros funcionam de forma reativa:

- **Placa**: Filtra em tempo real com debounce de 500ms
- **Data Início/Fim**: Filtra ao mudar o valor
- **Limpar Filtros**: Restaura a lista completa

### 8.4 GRÁFICOS INTERATIVOS

Os gráficos usam Chart.js:

- **Tipos**: Pizza (pie chart)
- **Dados**: Processados dinamicamente do array de checklists/anomalias
- **Filtro**: Busca em tempo real com debounce
- **Cores**: Geradas automaticamente

### 8.5 EXPANSÃO DE FOTOS

Sistema completo de visualização de fotos:

- **Zoom**: De 0.5x a 5x
- **Controles**: Botões +/- e atalhos de teclado (+, -, 0, ESC)
- **Mouse Wheel**: Zoom com scroll do mouse
- **Mobile**: Controles flutuantes otimizados

---

## 9. INTEGRAÇÕES COM BACKEND

### 9.1 BASE URL

```
https://floripa.in9automacao.com.br
```

**Configuração no arquivo `environment.ts`:**
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://floripa.in9automacao.com.br'
};
```

---

### 9.2 ENDPOINTS COMPLETOS

#### 9.2.1 CHECKLISTS SIMPLES

##### Buscar Todos os Checklists
```
GET https://floripa.in9automacao.com.br/b_veicular_get.php?acao=todos&limite=1000
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"todos"`
- `limite` (number, opcional): Quantidade máxima de registros (padrão: 1000)

**Resposta:**
```json
[
  {
    "id": 123,
    "placa": "ABC1234",
    "km_inicial": "10000",
    "nivel_combustivel": "75%",
    "data_realizacao": "2025-12-29T10:30:00",
    "usuario_nome": "João Silva"
  }
]
```

##### Buscar Detalhes Completos de um Checklist
```
GET https://floripa.in9automacao.com.br/b_veicular_get.php?acao=completo&id={id}
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"completo"`
- `id` (number, obrigatório): ID do checklist

**Resposta:**
```json
{
  "id": 123,
  "placa": "ABC1234",
  "km_inicial": "10000",
  "nivel_combustivel": "75%",
  "foto_painel": "data:image/jpeg;base64,...",
  "observacao_painel": "Painel ok",
  "data_realizacao": "2025-12-29T10:30:00",
  "usuario": {
    "id": 1,
    "nome": "João Silva"
  },
  "itens": {
    "MOTOR": [
      {
        "item": "Óleo do motor",
        "status": "Bom",
        "foto": "data:image/jpeg;base64,..."
      }
    ],
    "ELETRICO": [...],
    "LIMPEZA": [...],
    "FERRAMENTA": [...],
    "PNEU": [...]
  },
  "fotos": {
    "PAINEL": "data:image/jpeg;base64,...",
    "FRONTAL": "data:image/jpeg;base64,...",
    "TRASEIRA": "data:image/jpeg;base64,...",
    "LATERAL_DIREITA": "data:image/jpeg;base64,...",
    "LATERAL_ESQUERDA": "data:image/jpeg;base64,..."
  }
}
```

##### Buscar por Placa
```
GET https://floripa.in9automacao.com.br/b_veicular_get.php?acao=placa&placa={placa}
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"placa"`
- `placa` (string, obrigatório): Placa do veículo (ex: "ABC1234")

**Resposta:** Array de checklists (mesmo formato do "todos")

##### Buscar por Período
```
GET https://floripa.in9automacao.com.br/b_veicular_get.php?acao=periodo&data_inicio={dataInicio}&data_fim={dataFim}
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"periodo"`
- `data_inicio` (string, obrigatório): Data inicial no formato ISO (ex: "2025-12-01")
- `data_fim` (string, obrigatório): Data final no formato ISO (ex: "2025-12-31")

**Resposta:** Array de checklists (mesmo formato do "todos")

---

#### 9.2.2 CHECKLISTS COMPLETOS

##### Buscar Todos os Checklists Completos
```
GET https://floripa.in9automacao.com.br/b_checklist_completo_get.php?acao=todos&limite=1000
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"todos"`
- `limite` (number, opcional): Quantidade máxima de registros (padrão: 1000)

**Resposta:**
```json
[
  {
    "id": 456,
    "placa": "XYZ9876",
    "km_inicial": "50000",
    "nivel_combustivel": "50%",
    "data_realizacao": "2025-12-29T14:00:00",
    "usuario_nome": "Maria Santos"
  }
]
```

##### Buscar Detalhes de um Checklist Completo
```
GET https://floripa.in9automacao.com.br/b_checklist_completo_get.php?acao=id&id={id}
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"id"`
- `id` (number, obrigatório): ID do checklist completo

**Resposta:**
```json
{
  "id": 456,
  "placa": "XYZ9876",
  "km_inicial": "50000",
  "nivel_combustivel": "50%",
  "foto_painel": "data:image/jpeg;base64,...",
  "observacao_painel": "Painel ok",
  "data_realizacao": "2025-12-29T14:00:00",
  "usuario_nome": "Maria Santos",
  "parte1": {
    "item1": "Bom",
    "item2": "Regular"
  },
  "parte2": {...},
  "parte3": {...},
  "parte4": {...},
  "parte5": {...}
}
```

##### Buscar por Placa (Completo)
```
GET https://floripa.in9automacao.com.br/b_checklist_completo_get.php?acao=placa&placa={placa}
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"placa"`
- `placa` (string, obrigatório): Placa do veículo

**Resposta:** Array de checklists completos

---

#### 9.2.3 ANOMALIAS

##### Buscar Anomalias Ativas
```
GET https://floripa.in9automacao.com.br/b_veicular_anomalias.php?tipo=ativas
```

**Parâmetros Query:**
- `tipo` (string, obrigatório): `"ativas"`

**Resposta:**
```json
[
  {
    "placa": "ABC1234",
    "total_problemas": 3,
    "total_inspecoes_com_problema": 2,
    "data_ultima_inspecao": "2025-12-29T10:30:00",
    "anomalias": [
      {
        "item": "Óleo do motor",
        "categoria": "MOTOR",
        "status": "Ruim",
        "status_anomalia": "pendente",
        "data_realizacao": "2025-12-29T10:30:00",
        "foto": "data:image/jpeg;base64,...",
        "usuarios": ["João Silva"],
        "total_ocorrencias": 2,
        "inspecoes_ids": [123, 124]
      }
    ]
  }
]
```

##### Buscar Anomalias Finalizadas
```
GET https://floripa.in9automacao.com.br/b_veicular_anomalias.php?tipo=finalizadas
```

**Parâmetros Query:**
- `tipo` (string, obrigatório): `"finalizadas"`

**Resposta:** Mesmo formato do endpoint de ativas, mas com `status_anomalia: "finalizado"`

##### Aprovar Anomalia
```
POST https://floripa.in9automacao.com.br/b_anomalia_status.php
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "placa": "ABC1234",
  "categoria": "MOTOR",
  "item": "Óleo do motor",
  "acao": "aprovar",
  "usuario_id": 1
}
```

**Parâmetros Body:**
- `placa` (string, obrigatório): Placa do veículo
- `categoria` (string, obrigatório): Categoria do item (MOTOR, ELETRICO, LIMPEZA, FERRAMENTA, PNEU)
- `item` (string, obrigatório): Nome do item
- `acao` (string, obrigatório): `"aprovar"`
- `usuario_id` (number, opcional): ID do usuário que aprovou

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Anomalia aprovada com sucesso"
}
```

##### Reprovar Anomalia
```
POST https://floripa.in9automacao.com.br/b_anomalia_status.php
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "placa": "ABC1234",
  "categoria": "MOTOR",
  "item": "Óleo do motor",
  "acao": "reprovar",
  "observacao": "Falso positivo - óleo ok"
}
```

**Parâmetros Body:**
- `placa` (string, obrigatório)
- `categoria` (string, obrigatório)
- `item` (string, obrigatório)
- `acao` (string, obrigatório): `"reprovar"`
- `observacao` (string, opcional): Motivo da reprovação

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Anomalia reprovada"
}
```

##### Finalizar Anomalia
```
POST https://floripa.in9automacao.com.br/b_anomalia_status.php
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "placa": "ABC1234",
  "categoria": "MOTOR",
  "item": "Óleo do motor",
  "acao": "finalizar",
  "observacao": "Óleo trocado"
}
```

**Parâmetros Body:**
- `placa` (string, obrigatório)
- `categoria` (string, obrigatório)
- `item` (string, obrigatório)
- `acao` (string, obrigatório): `"finalizar"`
- `observacao` (string, opcional): Como foi resolvida

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Anomalia finalizada com sucesso"
}
```

---

#### 9.2.4 CONFIGURAÇÃO DE ITENS - SIMPLES

##### Buscar Todos os Itens
```
GET https://floripa.in9automacao.com.br/b_veicular_config_itens.php?acao=todos
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"todos"`

**Resposta:**
```json
[
  {
    "id": 1,
    "categoria": "MOTOR",
    "nome_item": "Óleo do motor",
    "habilitado": true,
    "usuario_id": 1,
    "usuario_nome": "Admin",
    "data_criacao": "2025-12-01T00:00:00",
    "data_atualizacao": "2025-12-29T10:00:00"
  }
]
```

##### Buscar por Categoria
```
GET https://floripa.in9automacao.com.br/b_veicular_config_itens.php?acao=categoria&categoria=MOTOR
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"categoria"`
- `categoria` (string, obrigatório): MOTOR, ELETRICO, LIMPEZA, FERRAMENTA, PNEU

**Resposta:** Array de itens (mesmo formato do "todos")

##### Buscar Apenas Habilitados
```
GET https://floripa.in9automacao.com.br/b_veicular_config_itens.php?acao=habilitados
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"habilitados"`
- `categoria` (string, opcional): Filtrar por categoria específica

**Resposta:** Array de itens habilitados

##### Atualizar Item (Habilitar/Desabilitar)
```
POST https://floripa.in9automacao.com.br/b_veicular_config_itens.php
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "acao": "atualizar_item",
  "id": 1,
  "habilitado": false
}
```

**Parâmetros Body:**
- `acao` (string, obrigatório): `"atualizar_item"`
- `id` (number, obrigatório): ID do item
- `habilitado` (boolean, obrigatório): true ou false

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Item atualizado com sucesso"
}
```

##### Atualizar Múltiplos Itens
```
POST https://floripa.in9automacao.com.br/b_veicular_config_itens.php
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "acao": "atualizar_multiplos",
  "itens": [
    { "id": 1, "habilitado": true },
    { "id": 2, "habilitado": false }
  ]
}
```

**Parâmetros Body:**
- `acao` (string, obrigatório): `"atualizar_multiplos"`
- `itens` (array, obrigatório): Array de objetos com id e habilitado

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Itens atualizados com sucesso"
}
```

##### Adicionar Novo Item
```
POST https://floripa.in9automacao.com.br/b_veicular_config_itens.php
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
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

**Parâmetros Body:**
- `acao` (string, obrigatório): `"adicionar_item"`
- `categoria` (string, obrigatório): MOTOR, ELETRICO, LIMPEZA, FERRAMENTA, PNEU
- `nome_item` (string, obrigatório): Nome do novo item
- `habilitado` (boolean, opcional): Padrão: true
- `usuario_id` (number, opcional): ID do usuário que criou
- `usuario_nome` (string, opcional): Nome do usuário que criou

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Item adicionado com sucesso",
  "id": 15
}
```

##### Remover Item
```
DELETE https://floripa.in9automacao.com.br/b_veicular_config_itens.php
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "id": 15
}
```

**Parâmetros Body:**
- `id` (number, obrigatório): ID do item a ser removido

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Item removido com sucesso"
}
```

---

#### 9.2.5 CONFIGURAÇÃO DE ITENS - COMPLETO

##### Buscar Todos os Itens (Completo)
```
GET https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php?acao=todos
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"todos"`

**Resposta:**
```json
[
  {
    "id": 1,
    "categoria": "PARTE1_INTERNA",
    "nome_item": "Painel de instrumentos",
    "habilitado": true,
    "usuario_id": 1,
    "usuario_nome": "Admin"
  }
]
```

##### Buscar por Categoria (Completo)
```
GET https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php?acao=categoria&categoria=PARTE1_INTERNA
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"categoria"`
- `categoria` (string, obrigatório): PARTE1_INTERNA, PARTE2_EQUIPAMENTOS, PARTE3_DIANTEIRA, PARTE4_TRASEIRA, PARTE5_ESPECIAL

**Resposta:** Array de itens

##### Buscar Apenas Habilitados (Completo)
```
GET https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php?acao=habilitados
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"habilitados"`
- `categoria` (string, opcional): Filtrar por categoria

**Resposta:** Array de itens habilitados

##### Buscar Agrupados por Parte
```
GET https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php?acao=por_parte
```

**Parâmetros Query:**
- `acao` (string, obrigatório): `"por_parte"`

**Resposta:**
```json
{
  "PARTE1_INTERNA": [
    { "id": 1, "nome_item": "Painel de instrumentos", "habilitado": true }
  ],
  "PARTE2_EQUIPAMENTOS": [...],
  "PARTE3_DIANTEIRA": [...],
  "PARTE4_TRASEIRA": [...],
  "PARTE5_ESPECIAL": [...]
}
```

##### Atualizar Item (Completo)
```
POST https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "acao": "atualizar_item",
  "id": 1,
  "habilitado": false
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Item atualizado com sucesso"
}
```

##### Adicionar Novo Item (Completo)
```
POST https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "acao": "adicionar_item",
  "categoria": "PARTE1_INTERNA",
  "nome_item": "Ar condicionado",
  "habilitado": true,
  "usuario_id": 1,
  "usuario_nome": "Admin"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Item adicionado com sucesso",
  "id": 25
}
```

##### Remover Item (Completo)
```
DELETE https://floripa.in9automacao.com.br/b_checklist_completo_config_itens.php
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "id": 25
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Item removido com sucesso"
}
```

---

#### 9.2.6 TEMPO DE TELAS

##### Buscar Tempos por Inspeção
```
GET https://floripa.in9automacao.com.br/tempo_telas.php?inspecao_id={id}
```

**Parâmetros Query:**
- `inspecao_id` (number, obrigatório): ID da inspeção

**Resposta:**
```json
[
  {
    "id": 1,
    "inspecao_id": 123,
    "tela": "inspecao-inicial",
    "tempo_segundos": 45,
    "data_hora_inicio": "2025-12-29T10:30:00",
    "data_hora_fim": "2025-12-29T10:30:45"
  }
]
```

---

### 9.3 CÓDIGOS HTTP E TRATAMENTO DE ERROS

#### Códigos de Sucesso
- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso

#### Códigos de Erro
- `400 Bad Request`: Parâmetros inválidos ou faltando
- `401 Unauthorized`: Autenticação necessária
- `403 Forbidden`: Sem permissão para acessar
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro no servidor

#### Formato de Resposta de Erro
```json
{
  "sucesso": false,
  "erro": "Mensagem de erro amigável",
  "detalhes": "Detalhes técnicos do erro",
  "codigo": 400
}
```

---

### 9.4 EXEMPLO DE IMPLEMENTAÇÃO NO ANGULAR

```typescript
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export class MeuApiService {
  private baseUrl = 'https://floripa.in9automacao.com.br';
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) { }

  // Exemplo: Buscar anomalias ativas
  buscarAnomalias(): Observable<any[]> {
    const url = `${this.baseUrl}/b_veicular_anomalias.php?tipo=ativas`;
    return this.http.get<any[]>(url);
  }

  // Exemplo: Aprovar anomalia
  aprovarAnomalia(placa: string, categoria: string, item: string, usuarioId: number): Observable<any> {
    const url = `${this.baseUrl}/b_anomalia_status.php`;
    const body = {
      placa: placa,
      categoria: categoria,
      item: item,
      acao: 'aprovar',
      usuario_id: usuarioId
    };
    return this.http.post(url, body, { headers: this.headers });
  }

  // Exemplo: Buscar itens de configuração
  buscarItensConfig(): Observable<any[]> {
    const url = `${this.baseUrl}/b_veicular_config_itens.php?acao=todos`;
    return this.http.get<any[]>(url);
  }

  // Exemplo: Adicionar item
  adicionarItem(categoria: string, nomeItem: string, usuarioId: number): Observable<any> {
    const url = `${this.baseUrl}/b_veicular_config_itens.php`;
    const body = {
      acao: 'adicionar_item',
      categoria: categoria,
      nome_item: nomeItem,
      habilitado: true,
      usuario_id: usuarioId
    };
    return this.http.post(url, body, { headers: this.headers });
  }

  // Exemplo: Remover item
  removerItem(id: number): Observable<any> {
    const url = `${this.baseUrl}/b_veicular_config_itens.php`;
    const body = { id: id };
    return this.http.request('DELETE', url, {
      headers: this.headers,
      body: body
    });
  }
}
```

### 9.2 ESTRUTURA DE DADOS

#### ChecklistSimples
```typescript
interface ChecklistSimples {
  id?: number;
  placa: string;
  km_inicial: string;
  nivel_combustivel: string;
  data_realizacao?: string;
  usuario_nome?: string;
}
```

#### ChecklistCompleto
```typescript
interface ChecklistCompleto {
  id?: number;
  placa: string;
  km_inicial: string;
  nivel_combustivel: string;
  data_realizacao?: string;
  usuario_nome?: string;
  parte1?: any;
  parte2?: any;
  parte3?: any;
  parte4?: any;
  parte5?: any;
  foto_painel?: string;
  observacao_painel?: string;
}
```

#### ConfigItem
```typescript
interface ConfigItem {
  id: number;
  categoria: 'MOTOR' | 'ELETRICO' | 'LIMPEZA' | 'FERRAMENTA' | 'PNEU';
  nome_item: string;
  habilitado: boolean;
  ordem: number;
  usuario_id?: number;
  usuario_nome?: string;
}
```

#### Anomalia (Estrutura de Resposta)
```typescript
interface AnomaliaResponse {
  placa: string;
  total_problemas: number;
  total_inspecoes_com_problema: number;
  data_ultima_inspecao: string;
  anomalias: Array<{
    item: string;
    categoria: string;
    status: string;
    status_anomalia?: 'pendente' | 'aprovado' | 'finalizado';
    data_realizacao: string;
    foto?: string;
    usuarios?: string[];
    total_ocorrencias?: number;
    inspecoes_ids?: number[];
    data_aprovacao?: string;
    usuario_aprovador_nome?: string;
    observacao?: string;
    data_finalizacao?: string;
  }>;
}
```

---

## 10. FLUXOS DE TRABALHO

### 10.1 FLUXO DE VISUALIZAÇÃO DE CHECKLIST

1. Usuário acessa aba "Histórico"
2. Sistema carrega checklists do servidor
3. Checklists são exibidos em lista
4. Usuário clica em um checklist
5. Sistema busca detalhes completos
6. Modal de detalhes é exibido
7. Usuário pode expandir fotos para zoom

### 10.2 FLUXO DE GESTÃO DE ANOMALIA

1. Usuário acessa aba "Anomalias"
2. Sistema carrega anomalias ativas (com cache)
3. Usuário expande detalhes de um veículo
4. Usuário clica em "Aprovar" em uma anomalia
5. Sistema exibe confirmação
6. Usuário confirma
7. Sistema envia requisição ao backend
8. Cache é limpo
9. Anomalias são recarregadas

### 10.3 FLUXO DE CONFIGURAÇÃO DE ITEM

1. Usuário acessa aba "Configuração"
2. Sistema carrega itens de configuração
3. Itens são organizados por categoria
4. Usuário clica em "Adicionar Novo Item"
5. Sistema exibe alert para selecionar categoria
6. Usuário seleciona categoria
7. Sistema exibe alert para nome do item
8. Usuário digita nome e confirma
9. Sistema adiciona item ao backend
10. Lista é recarregada

### 10.4 FLUXO DE MÉTRICAS E GRÁFICOS

1. Usuário acessa aba "Métricas"
2. Sistema carrega anomalias ativas e finalizadas
3. Estatísticas são calculadas
4. Gráfico padrão (usuários) é renderizado
5. Usuário seleciona outro tipo de gráfico
6. Dados são processados
7. Gráfico é re-renderizado
8. Usuário pode filtrar dados com busca

---

## CONCLUSÃO

Este guia completo documenta todos os aspectos da tela de administração do sistema de checklists. Com estas informações, é possível replicar a tela em outro sistema, mantendo todas as funcionalidades, estilos e integrações.

**Pontos-chave para implementação:**

1. **Serviços**: Implementar os serviços de API, Auth, Config de Itens e Tempo de Telas
2. **Modelos**: Criar as interfaces TypeScript para tipagem
3. **Backend**: Garantir que os endpoints estejam disponíveis e retornem os dados no formato esperado
4. **Chart.js**: Instalar e configurar a biblioteca de gráficos
5. **Capacitor Camera**: Configurar para funcionalidade de fotos (se necessário)
6. **Ionic**: Versão 8+ com Angular 18+

**Ordem de implementação sugerida:**

1. Criar estrutura de arquivos
2. Implementar serviços e modelos
3. Implementar aba de Histórico
4. Implementar aba de Configuração
5. Implementar aba de Anomalias
6. Implementar aba de Métricas
7. Ajustar estilos e animações
8. Testar todas as funcionalidades

---

**Última atualização**: 2025-12-29
