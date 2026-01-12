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

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
})
export class AdminPage implements OnInit {
  // Tipo de checklist selecionado
  tipoChecklistSelecionado: 'simples' | 'completo' = 'simples';

  // Checklists Simples
  checklists: ChecklistSimples[] = [];
  checklistsFiltrados: ChecklistSimples[] = [];

  // Checklists Completos
  checklistsCompletos: ChecklistCompleto[] = [];
  checklistsCompletosFiltrados: ChecklistCompleto[] = [];

  carregando = false;
  erro = '';

  // Filtros
  filtroPlaca = '';
  filtroDataInicio = '';
  filtroDataFim = '';

  // Estatísticas (Simples)
  totalChecklists = 0;
  checklistsHoje = 0;
  checklistsSemana = 0;

  // Estatísticas (Completo)
  totalChecklistsCompletos = 0;
  checklistsCompletosHoje = 0;
  checklistsCompletosSemana = 0;

  // Configuração de itens - SIMPLES
  abaSelecionada: 'historico' | 'anomalias' | 'configuracao' | 'metricas' | 'relatorios' = 'historico';
  itensConfig: ConfigItem[] = [];
  itensConfigPorCategoria: { [key: string]: ConfigItem[] } = {};
  carregandoConfig = false;

  // Relatórios
  carregandoRelatorio = false;

  // Anomalias
  anomalias: any[] = [];
  carregandoAnomalias = false;
  erroAnomalias = '';
  detalhesAnomaliaExpandido: { [placa: string]: boolean } = {};
  tipoAnomalias: 'ativas' | 'finalizadas' = 'ativas';

  // Cache de anomalias
  private cacheAnomalias: { [tipo: string]: any[] } = {};
  private cacheTimestamp: { [tipo: string]: number } = {};
  private cacheDuracaoMs = 5 * 60 * 1000; // 5 minutos
  categorias = [
    { key: 'MOTOR', label: 'Motor', icon: 'construct-outline', color: '#3880ff' },
    { key: 'ELETRICO', label: 'Elétrico', icon: 'flash-outline', color: '#ffc409' },
    { key: 'LIMPEZA', label: 'Limpeza', icon: 'water-outline', color: '#2dd36f' },
    { key: 'FERRAMENTA', label: 'Ferramentas', icon: 'build-outline', color: '#eb445a' },
    { key: 'PNEU', label: 'Pneus', icon: 'ellipse-outline', color: '#3dc2ff' }
  ];

  // Métricas
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

  // Configuração de itens - COMPLETO
  itensConfigCompleto: ConfigItemCompleto[] = [];
  itensConfigCompletoPorCategoria: { [key: string]: ConfigItemCompleto[] } = {};
  categoriasCompleto = [
    { key: 'PARTE1_INTERNA', label: 'Parte 1 - Interna', icon: 'car-outline', color: '#3880ff' },
    { key: 'PARTE2_EQUIPAMENTOS', label: 'Parte 2 - Equipamentos', icon: 'construct-outline', color: '#ffc409' },
    { key: 'PARTE3_DIANTEIRA', label: 'Parte 3 - Dianteira', icon: 'arrow-up-outline', color: '#2dd36f' },
    { key: 'PARTE4_TRASEIRA', label: 'Parte 4 - Traseira', icon: 'arrow-down-outline', color: '#eb445a' },
    { key: 'PARTE5_ESPECIAL', label: 'Parte 5 - Veículos Pesados', icon: 'bus-outline', color: '#3dc2ff' }
  ];

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

  // Gráficos
  // Gráficos
  chartInstance: any;
  chartUsuarios: any;
  chartVeiculos: any;
  chartVeiculosAnomalias: any;
  chartAnomalias: any;
  chartAnomaliasResolvidas: any;

  graficoSelecionado: string = 'usuarios';
  termoBuscaGrafico: string = '';
  dadosGrafico: { label: string, value: number, color: string }[] = [];
  dadosGraficoFiltrados: { label: string, value: number, color: string }[] = [];
  filtrarLocaisHoje: boolean = false;

  mudarGrafico(evento: any) {
    this.graficoSelecionado = evento.detail.value;
    this.termoBuscaGrafico = ''; // Limpa busca ao mudar
    // Reseta filtro de hoje ao mudar de gráfico
    if (this.graficoSelecionado !== 'locais') {
      this.filtrarLocaisHoje = false;
    }
    // Pequeno delay para garantir que o *ngIf renderizou o canvas
    setTimeout(() => this.atualizarGrafico(), 100);
  }

  buscarGrafico(event: any) {
    this.termoBuscaGrafico = event.target.value;
    this.filtrarDadosGrafico();
    this.renderizarGraficoGeneric();
  }

  toggleFiltroLocaisHoje() {
    this.filtrarLocaisHoje = !this.filtrarLocaisHoje;
    this.atualizarGrafico();
  }

  getTituloGrafico(): string {
    switch (this.graficoSelecionado) {
      case 'usuarios': return 'Usuários que mais realizam checklists';
      case 'veiculos': return 'Veículos mais inspecionados';
      case 'locais': return 'Checklists por local';
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
        // Adiciona checklists completos
        this.checklistsCompletos.forEach(c => {
          const nome = c.usuario_nome || 'Desconhecido';
          dados[nome] = (dados[nome] || 0) + 1;
        });
        break;
      case 'veiculos':
        this.checklists.forEach(c => {
          dados[c.placa] = (dados[c.placa] || 0) + 1;
        });
        // Adiciona checklists completos
        this.checklistsCompletos.forEach(c => {
          dados[c.placa] = (dados[c.placa] || 0) + 1;
        });
        break;
      case 'locais':
        // Função auxiliar para verificar se é do dia atual
        const isHoje = (dataRealizacao: string | Date | undefined): boolean => {
          if (!dataRealizacao) return false;
          try {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const dataChecklist = new Date(dataRealizacao);
            if (isNaN(dataChecklist.getTime())) return false; // Data inválida
            dataChecklist.setHours(0, 0, 0, 0);
            return dataChecklist.getTime() === hoje.getTime();
          } catch (error) {
            console.error('Erro ao verificar data:', error);
            return false;
          }
        };

        // Conta checklists simples por local (ignora vazios)
        this.checklists.forEach(c => {
          if (c.local && c.local.trim() !== '') {
            // Se o filtro de hoje estiver ativo, verifica a data
            if (!this.filtrarLocaisHoje || isHoje(c.data_realizacao)) {
              dados[c.local] = (dados[c.local] || 0) + 1;
            }
          }
        });
        // Adiciona checklists completos (ignora vazios)
        this.checklistsCompletos.forEach(c => {
          if (c.local && c.local.trim() !== '') {
            // Se o filtro de hoje estiver ativo, verifica a data
            if (!this.filtrarLocaisHoje || isHoje(c.data_realizacao)) {
              dados[c.local] = (dados[c.local] || 0) + 1;
            }
          }
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

    // Gera cores e ordena
    const labels = Object.keys(dados);
    const cores = this.graficoSelecionado === 'status_anomalias'
      ? ['#2dd36f', '#eb445a']
      : this.gerarCores(labels.length);

    // Mapeia e ordena dados
    let dadosOrdenados = labels
      .map((key, index) => ({
        label: key,
        value: dados[key],
        color: cores[index] || '#cccccc'
      }))
      .sort((a, b) => b.value - a.value);

    // Limita ao top 10 para gráficos de usuários e veículos
    if (this.graficoSelecionado === 'usuarios' || this.graficoSelecionado === 'veiculos') {
      dadosOrdenados = dadosOrdenados.slice(0, 10);
    }

    this.dadosGrafico = dadosOrdenados;
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

  mudarAba(aba: 'historico' | 'anomalias' | 'configuracao' | 'metricas' | 'relatorios') {
    this.abaSelecionada = aba;
    if (aba === 'configuracao') {
      // Carrega a configuração apropriada dependendo do tipo de checklist
      if (this.tipoChecklistSelecionado === 'simples' && this.itensConfig.length === 0) {
        this.carregarConfigItens();
      } else if (this.tipoChecklistSelecionado === 'completo' && this.itensConfigCompleto.length === 0) {
        this.carregarConfigItensCompleto();
      }
    } else if (aba === 'anomalias') {
      // Carrega as anomalias se ainda não foram carregadas
      if (this.anomalias.length === 0) {
        this.carregarAnomalias();
      }
    } else if (aba === 'metricas') {
      // Carrega as métricas e garante que temos os dados para os gráficos
      this.carregarMetricas();

      const promises = [];

      if (this.checklists.length === 0) {
        promises.push(new Promise<void>(resolve => {
          this.carregarChecklists();
          // carregarChecklists não retorna promise, então vamos dar um tempo ou assumir que vai carregar
          // Idealmente carregarChecklists deveria retornar Observable/Promise, mas para não refatorar tudo agora:
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

  // Mantido para compatibilidade se algo chamar
  gerarGraficos() {
    this.atualizarGrafico();
  }

  destruirGraficos() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    // Limpa referências antigas se existirem
    if (this.chartUsuarios) { this.chartUsuarios.destroy(); this.chartUsuarios = null; }
    if (this.chartVeiculos) { this.chartVeiculos.destroy(); this.chartVeiculos = null; }
    if (this.chartVeiculosAnomalias) { this.chartVeiculosAnomalias.destroy(); this.chartVeiculosAnomalias = null; }
    if (this.chartAnomalias) { this.chartAnomalias.destroy(); this.chartAnomalias = null; }
    if (this.chartAnomaliasResolvidas) { this.chartAnomaliasResolvidas.destroy(); this.chartAnomaliasResolvidas = null; }
  }

  gerarCores(quantidade: number) {
    const cores = [
      '#3880ff', '#2dd36f', '#ffc409', '#eb445a', '#3dc2ff',
      '#5260ff', '#2fdf75', '#ffd534', '#ff4961', '#50c8ff',
      '#7044ff', '#10dc60', '#ffce00', '#f04141', '#7a49f8'
    ];

    // Se precisar de mais cores, repete ou gera aleatórias
    while (cores.length < quantidade) {
      cores.push('#' + Math.floor(Math.random() * 16777215).toString(16));
    }

    return cores.slice(0, quantidade);
  }

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

  carregarConfigItensCompleto() {
    this.carregandoConfig = true;
    this.configItensCompletoService.buscarTodos().subscribe({
      next: (itens) => {
        this.itensConfigCompleto = itens;
        this.organizarItensCompletoPorCategoria();
        this.carregandoConfig = false;
        console.log('Itens de configuração do checklist completo carregados:', itens);
      },
      error: (error) => {
        console.error('Erro ao carregar configuração de itens do checklist completo:', error);
        this.carregandoConfig = false;
        this.mostrarToast('Erro ao carregar configuração de itens do checklist completo', 'danger');
      }
    });
  }

  organizarItensCompletoPorCategoria() {
    this.itensConfigCompletoPorCategoria = {};
    this.itensConfigCompleto.forEach(item => {
      if (!this.itensConfigCompletoPorCategoria[item.categoria]) {
        this.itensConfigCompletoPorCategoria[item.categoria] = [];
      }
      this.itensConfigCompletoPorCategoria[item.categoria].push(item);
    });

    // Ordena cada categoria por nome do item
    Object.keys(this.itensConfigCompletoPorCategoria).forEach(categoria => {
      this.itensConfigCompletoPorCategoria[categoria].sort((a, b) => a.nome_item.localeCompare(b.nome_item));
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

  async toggleItemCompleto(item: ConfigItemCompleto) {
    const novoStatus = !item.habilitado;

    this.configItensCompletoService.atualizarItem({
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
        console.error('Erro ao atualizar item do checklist completo:', error);
        await this.mostrarToast('Erro ao atualizar item', 'danger');
      }
    });
  }

  async adicionarNovoItem() {
    // Define as categorias baseado no tipo de checklist selecionado
    const isCompleto = this.tipoChecklistSelecionado === 'completo';

    const inputs = isCompleto ? [
      {
        name: 'categoria',
        type: 'radio' as const,
        label: '🚗 Parte 1 - Interna',
        value: 'PARTE1_INTERNA',
        checked: true
      },
      {
        name: 'categoria',
        type: 'radio' as const,
        label: '🔧 Parte 2 - Equipamentos',
        value: 'PARTE2_EQUIPAMENTOS'
      },
      {
        name: 'categoria',
        type: 'radio' as const,
        label: '⬆️ Parte 3 - Dianteira',
        value: 'PARTE3_DIANTEIRA'
      },
      {
        name: 'categoria',
        type: 'radio' as const,
        label: '⬇️ Parte 4 - Traseira',
        value: 'PARTE4_TRASEIRA'
      },
      {
        name: 'categoria',
        type: 'radio' as const,
        label: '🚛 Parte 5 - Veículos Pesados',
        value: 'PARTE5_ESPECIAL'
      }
    ] : [
      {
        name: 'categoria',
        type: 'radio' as const,
        label: '🔧 Motor',
        value: 'MOTOR',
        checked: true
      },
      {
        name: 'categoria',
        type: 'radio' as const,
        label: '⚡ Elétrico',
        value: 'ELETRICO'
      },
      {
        name: 'categoria',
        type: 'radio' as const,
        label: '💧 Limpeza',
        value: 'LIMPEZA'
      },
      {
        name: 'categoria',
        type: 'radio' as const,
        label: '🔨 Ferramentas',
        value: 'FERRAMENTA'
      },
      {
        name: 'categoria',
        type: 'radio' as const,
        label: '⭕ Pneus',
        value: 'PNEU'
      }
    ];

    const alert = await this.alertController.create({
      header: 'Selecione a Categoria',
      message: `Escolha em qual categoria deseja adicionar o item (${isCompleto ? 'Checklist Completo' : 'Checklist Simples'})`,
      inputs: inputs,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Próximo',
          handler: async (categoria) => {
            if (!categoria) {
              await this.mostrarToast('Selecione uma categoria', 'danger');
              return false;
            }

            // Fecha o primeiro alert e abre o segundo para o nome
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

    // Mapear emojis para cada categoria
    const categoriaEmojis: { [key: string]: string } = {
      'MOTOR': '🔧',
      'ELETRICO': '⚡',
      'LIMPEZA': '💧',
      'FERRAMENTA': '🔨',
      'PNEU': '⭕',
      'PARTE1_INTERNA': '🚗',
      'PARTE2_EQUIPAMENTOS': '🔧',
      'PARTE3_DIANTEIRA': '⬆️',
      'PARTE4_TRASEIRA': '⬇️',
      'PARTE5_ESPECIAL': '🚛'
    };

    const alert = await this.alertController.create({
      header: 'Adicionar Novo Item',
      message: `${categoriaEmojis[categoria]} ${categoriaInfo?.label}`,
      inputs: [
        {
          name: 'nome_item',
          type: 'text',
          placeholder: 'Digite o nome do item',
          attributes: {
            maxlength: 100,
            autocapitalize: 'on'
          }
        }
      ],
      buttons: [
        {
          text: 'Voltar',
          handler: () => {
            // Volta para o primeiro alert
            this.adicionarNovoItem();
          }
        },
        {
          text: 'Adicionar',
          handler: (data) => {
            // Validação
            if (!data.nome_item || data.nome_item.trim() === '') {
              this.mostrarToast('Nome do item é obrigatório', 'danger');
              return false;
            }

            // Pega o usuário logado
            const usuario = this.authService.currentUserValue;

            // Chama o serviço para adicionar o item (ordem será definida automaticamente como 999)
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
        // Recarrega a lista apropriada
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
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Remover',
          role: 'destructive',
          handler: () => {
            this.executarRemocaoItem(item.id);
          }
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
        // Recarrega a lista apropriada
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

  async salvarConfiguracao() {
    const alert = await this.alertController.create({
      header: 'Confirmar Salvamento',
      message: 'Tem certeza que deseja salvar as configurações? Isso afetará todos os usuários.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Salvar',
          handler: () => {
            this.executarSalvamento();
          }
        }
      ]
    });

    await alert.present();
  }

  executarSalvamento() {
    const itensParaAtualizar = this.itensConfig.map(item => ({
      id: item.id,
      habilitado: item.habilitado
    }));

    this.configItensService.atualizarMultiplos(itensParaAtualizar).subscribe({
      next: async (response) => {
        await this.mostrarToast('Configurações salvas com sucesso!', 'success');
        this.carregarConfigItens();
      },
      error: async (error) => {
        console.error('Erro ao salvar configurações:', error);
        await this.mostrarToast('Erro ao salvar configurações', 'danger');
      }
    });
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

  mudarTipoChecklist(tipo: 'simples' | 'completo') {
    this.tipoChecklistSelecionado = tipo;

    // Carrega os dados se ainda não foram carregados
    if (tipo === 'simples') {
      if (this.checklists.length === 0) {
        this.carregarChecklists();
      }
      // Se estiver na aba de configuração, carrega a config do simples
      if (this.abaSelecionada === 'configuracao' && this.itensConfig.length === 0) {
        this.carregarConfigItens();
      }
    } else if (tipo === 'completo') {
      if (this.checklistsCompletos.length === 0) {
        this.carregarChecklistsCompletos();
      }
      // Se estiver na aba de configuração, carrega a config do completo
      if (this.abaSelecionada === 'configuracao' && this.itensConfigCompleto.length === 0) {
        this.carregarConfigItensCompleto();
      }
    }
  }

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

  aplicarFiltros() {
    if (this.tipoChecklistSelecionado === 'simples') {
      this.checklistsFiltrados = this.checklists.filter(checklist => {
        // Filtro por placa
        const passaPlaca = !this.filtroPlaca ||
          checklist.placa.toLowerCase().includes(this.filtroPlaca.toLowerCase());

        // Filtro por data inicial
        const passaDataInicio = !this.filtroDataInicio || !checklist.data_realizacao ||
          new Date(checklist.data_realizacao) >= new Date(this.filtroDataInicio);

        // Filtro por data final
        const passaDataFim = !this.filtroDataFim || !checklist.data_realizacao ||
          new Date(checklist.data_realizacao) <= new Date(this.filtroDataFim);

        return passaPlaca && passaDataInicio && passaDataFim;
      });
    } else {
      this.checklistsCompletosFiltrados = this.checklistsCompletos.filter(checklist => {
        // Filtro por placa
        const passaPlaca = !this.filtroPlaca ||
          checklist.placa.toLowerCase().includes(this.filtroPlaca.toLowerCase());

        // Filtro por data inicial
        const passaDataInicio = !this.filtroDataInicio || !checklist.data_realizacao ||
          new Date(checklist.data_realizacao) >= new Date(this.filtroDataInicio);

        // Filtro por data final
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

  checklistDetalhado: any = null;
  mostrarModal = false;
  temposTelas: any[] = [];

  // Checklist Completo Detalhado
  checklistCompletoDetalhado: any = null;
  mostrarModalCompleto = false;

  // Controle da foto expandida
  fotoExpandida: string | null = null;
  mostrarFotoExpandida = false;
  zoomLevel = 1;

  async verDetalhes(checklist: ChecklistSimples) {
    this.carregando = true;
    try {
      // Busca todos os detalhes do checklist usando o endpoint 'completo'
      this.apiService.buscarCompleto(checklist.id!).subscribe({
        next: (dados) => {
          console.log('[ADMIN] Dados recebidos da API:', dados);
          console.log('[ADMIN] Campo local:', dados.local);
          console.log('[ADMIN] Tipo do campo local:', typeof dados.local);
          console.log('[ADMIN] Local é nulo/undefined?', dados.local === null || dados.local === undefined);

          this.checklistDetalhado = dados;

          // Busca os tempos de tela para esta inspeção
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

          // Mostra erro detalhado antes do fallback
          const mensagemErro = error.error?.erro || error.error?.message || error.message || 'Erro desconhecido';
          const detalhes = error.error?.detalhes || error.statusText || '';

          const alert = await this.alertController.create({
            header: 'Erro ao Carregar Detalhes',
            message: `
              <strong>Erro:</strong> ${mensagemErro}<br>
              ${detalhes ? `<strong>Detalhes:</strong> ${detalhes}` : ''}
            `,
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
      // Busca os detalhes do checklist completo
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

  // Métodos para expansão de fotos
  private wheelZoomHandler: any;
  private keyboardHandler: any;

  expandirFoto(foto: string) {
    this.fotoExpandida = foto;
    this.mostrarFotoExpandida = true;
    this.zoomLevel = 1;

    // Cria referências para os handlers
    this.wheelZoomHandler = (event: Event) => this.handleWheelZoom(event as WheelEvent);
    this.keyboardHandler = (event: Event) => this.handleKeyboardShortcuts(event as KeyboardEvent);

    // Adiciona suporte para scroll wheel zoom e atalhos de teclado em desktop
    setTimeout(() => {
      const container = document.querySelector('.foto-expandida-container');
      if (container) {
        container.addEventListener('wheel', this.wheelZoomHandler, { passive: false });
      }

      // Adiciona atalhos de teclado
      document.addEventListener('keydown', this.keyboardHandler);
    }, 100);
  }

  fecharFotoExpandida() {
    // Remove event listeners antes de fechar
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

  // Métodos auxiliares para o checklist completo
  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  formatarNomeCampo(key: string): string {
    // Converte camelCase para formato legível
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

  async testarQualidadeImagem() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Teste de Qualidade de Imagem',
      subHeader: 'Qualidade atual: 60% | Largura máx: 1200px',
      buttons: [
        {
          text: 'Tirar Foto',
          icon: 'camera',
          handler: () => {
            this.capturarFotoTeste(CameraSource.Camera);
          }
        },
        {
          text: 'Escolher da Galeria',
          icon: 'images',
          handler: () => {
            this.capturarFotoTeste(CameraSource.Photos);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async capturarFotoTeste(source: CameraSource) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: source,
        quality: 100, // Captura em qualidade máxima para testar a compressão
        allowEditing: false,
        saveToGallery: false
      });

      if (photo.dataUrl) {
        // Exibe loading
        const loading = await this.loadingController.create({
          message: 'Processando qualidades...',
          spinner: 'crescent'
        });
        await loading.present();

        const tamanhoOriginal = photo.dataUrl.length;
        const testeQualidades: any[] = [];

        // Testa qualidades de 10% a 100%, de 10 em 10
        for (let q = 10; q <= 100; q += 10) {
          const quality = q / 100; // Converte para 0.1 - 1.0
          const fotoComprimida = await this.photoCompressionService.compressPhoto(photo.dataUrl, 1200, quality);
          const tamanhoComprimido = fotoComprimida.length;
          const reducaoPercentual = Math.round(((tamanhoOriginal - tamanhoComprimido) / tamanhoOriginal) * 100);

          testeQualidades.push({
            qualidade: q,
            foto: fotoComprimida,
            tamanho: (tamanhoComprimido / (1024 * 1024)).toFixed(2) + ' MB',
            tamanhoBytes: tamanhoComprimido,
            reducao: reducaoPercentual
          });
        }

        await loading.dismiss();

        // Mostra comparação de todas as qualidades
        this.mostrarComparacaoMultiplasQualidades(
          photo.dataUrl,
          (tamanhoOriginal / (1024 * 1024)).toFixed(2) + ' MB',
          testeQualidades
        );
      }
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      const toast = await this.toastController.create({
        message: 'Erro ao capturar foto',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  fotoOriginalTeste: string | null = null;
  fotoComprimidaTeste: string | null = null;
  tamanhoOriginalTeste: string = '';
  tamanhoComprimidoTeste: string = '';
  reducaoPercentualTeste: number = 0;
  testesQualidades: any[] = [];
  mostrarModalTestes: boolean = false;

  mostrarComparacaoFotos(
    original: string,
    comprimida: string,
    tamanhoOriginal: string,
    tamanhoComprimido: string,
    reducao: number
  ) {
    this.fotoOriginalTeste = original;
    this.fotoComprimidaTeste = comprimida;
    this.tamanhoOriginalTeste = tamanhoOriginal;
    this.tamanhoComprimidoTeste = tamanhoComprimido;
    this.reducaoPercentualTeste = reducao;
  }

  mostrarComparacaoMultiplasQualidades(
    fotoOriginal: string,
    tamanhoOriginal: string,
    testesQualidades: any[]
  ) {
    this.fotoOriginalTeste = fotoOriginal;
    this.tamanhoOriginalTeste = tamanhoOriginal;
    this.testesQualidades = testesQualidades;
    this.mostrarModalTestes = true;
  }

  fecharModalTestes() {
    this.mostrarModalTestes = false;
    this.testesQualidades = [];
    this.fotoOriginalTeste = null;
  }

  fecharFotoTeste() {
    this.fotoOriginalTeste = null;
    this.fotoComprimidaTeste = null;
  }

  // ============================================
  // Métodos de Anomalias
  // ============================================

  carregarAnomalias(forcarRecarregar: boolean = false): Promise<void> {
    const agora = Date.now();
    const cacheValido = !forcarRecarregar &&
      this.cacheAnomalias[this.tipoAnomalias] &&
      this.cacheTimestamp[this.tipoAnomalias] &&
      (agora - this.cacheTimestamp[this.tipoAnomalias]) < this.cacheDuracaoMs;

    // Se o cache é válido, usa os dados em cache
    if (cacheValido) {
      console.log(`Usando anomalias do cache (${this.tipoAnomalias})`);
      this.anomalias = this.cacheAnomalias[this.tipoAnomalias];
      return Promise.resolve();
    }

    // Caso contrário, busca do servidor
    console.log(`Buscando anomalias do servidor (${this.tipoAnomalias})`);
    this.carregandoAnomalias = true;
    this.erroAnomalias = '';

    return new Promise((resolve) => {
      this.apiService.buscarAnomalias(this.tipoAnomalias).subscribe({
        next: (response) => {
          this.anomalias = response;
          // Salva no cache
          this.cacheAnomalias[this.tipoAnomalias] = response;
          this.cacheTimestamp[this.tipoAnomalias] = Date.now();
          this.carregandoAnomalias = false;
          console.log('Anomalias carregadas e salvas no cache:', this.anomalias);
          resolve();
        },
        error: (error) => {
          console.error('Erro ao carregar anomalias:', error);
          
          // Trata diferentes tipos de erro
          let mensagemErro = 'Erro desconhecido ao carregar anomalias';
          
          if (error.message) {
            // Erro já formatado pelo ApiService
            mensagemErro = error.message;
          } else if (error.error?.erro) {
            mensagemErro = error.error.erro;
          } else if (error.error?.message) {
            mensagemErro = error.error.message;
          } else if (typeof error.error === 'string') {
            mensagemErro = error.error;
          } else if (error.status === 0) {
            mensagemErro = 'Erro de conexão. Verifique sua internet.';
          } else if (error.status === 500) {
            mensagemErro = 'Erro interno do servidor. Tente novamente mais tarde.';
          } else if (error.status === 200 && !error.ok) {
            mensagemErro = 'Erro ao processar resposta do servidor. A resposta não é válida.';
          }
          
          this.erroAnomalias = mensagemErro;
          this.carregandoAnomalias = false;
          
          // Mostra toast para o usuário
          this.presentToast(mensagemErro, 'danger');
          
          // Limpa anomalias em caso de erro
          this.anomalias = [];
          
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
    // Força recarregamento ao mudar tipo
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
    // Retorna "Usuario A, Usuario B" para múltiplos usuários
    return usuarios.join(', ');
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

  // ============================================
  // Métodos de Métricas
  // ============================================

  carregarMetricas() {
    this.carregandoMetricas = true;

    // Busca anomalias ativas e finalizadas em paralelo
    const anomaliasAtivas$ = this.apiService.buscarAnomalias('ativas');
    const anomaliasFinalizadas$ = this.apiService.buscarAnomalias('finalizadas');

    // Combina as requisições
    Promise.all([
      import('rxjs'),
      import('rxjs/operators')
    ]).then(([rxjs, operators]) => {
      rxjs.forkJoin({
        ativas: anomaliasAtivas$.pipe(
          operators.catchError((error) => {
            console.error('Erro ao buscar anomalias ativas:', error);
            // Retorna array vazio em caso de erro para não quebrar o forkJoin
            return rxjs.of([]);
          })
        ),
        finalizadas: anomaliasFinalizadas$.pipe(
          operators.catchError((error) => {
            console.error('Erro ao buscar anomalias finalizadas:', error);
            // Retorna array vazio em caso de erro para não quebrar o forkJoin
            return rxjs.of([]);
          })
        )
      }).subscribe({
        next: (resultado) => {
          // Valida se os resultados são arrays válidos
          if (!Array.isArray(resultado.ativas)) {
            console.warn('Resposta de anomalias ativas não é um array válido:', resultado.ativas);
            resultado.ativas = [];
          }
          if (!Array.isArray(resultado.finalizadas)) {
            console.warn('Resposta de anomalias finalizadas não é um array válido:', resultado.finalizadas);
            resultado.finalizadas = [];
          }

          // Calcula total de inspeções (soma simples + completo)
          this.metricas.totalInspecoes = this.checklists.length + this.checklistsCompletos.length;

          // Conta anomalias ativas e finalizadas
          this.metricas.anomaliasAtivas = resultado.ativas.reduce((total: number, veiculo: any) => {
            return total + (veiculo?.total_problemas || 0);
          }, 0);
          this.metricas.anomaliasFinalizadas = resultado.finalizadas.reduce((total: number, veiculo: any) => {
            return total + (veiculo?.total_problemas || 0);
          }, 0);

          // Conta veículos únicos
          const placasUnicas = new Set<string>();
          this.checklists.forEach((c: any) => placasUnicas.add(c.placa));
          this.checklistsCompletos.forEach((c: any) => placasUnicas.add(c.placa));
          this.metricas.totalVeiculos = placasUnicas.size;

          // Calcula inspeções hoje e na semana
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

          // Calcula taxa de aprovação (finalizadas / total)
          const totalAnomalias = this.metricas.anomaliasAtivas + this.metricas.anomaliasFinalizadas;
          if (totalAnomalias > 0) {
            this.metricas.taxaAprovacao = Math.round((this.metricas.anomaliasFinalizadas / totalAnomalias) * 100);
          } else {
            this.metricas.taxaAprovacao = 0;
          }

          // Top veículos com mais problemas
          this.metricas.veiculosComMaisProblemas = resultado.ativas
            .filter((v: any) => v && v.placa && typeof v.total_problemas === 'number')
            .sort((a: any, b: any) => b.total_problemas - a.total_problemas)
            .slice(0, 5)
            .map((v: any) => ({
              placa: v.placa,
              problemas: v.total_problemas
            }));

          // Categorias com mais problemas
          const problemasPorCategoria: { [key: string]: number } = {};
          resultado.ativas.forEach((veiculo: any) => {
            if (veiculo && Array.isArray(veiculo.anomalias)) {
              veiculo.anomalias.forEach((anomalia: any) => {
                if (anomalia && anomalia.categoria) {
                  const categoria = anomalia.categoria;
                  if (!problemasPorCategoria[categoria]) {
                    problemasPorCategoria[categoria] = 0;
                  }
                  problemasPorCategoria[categoria]++;
                }
              });
            }
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
          
          // Mensagem de erro mais específica
          let mensagemErro = 'Erro ao carregar métricas';
          
          if (error.message) {
            mensagemErro = error.message;
          } else if (error.error?.erro) {
            mensagemErro = `Erro ao carregar métricas: ${error.error.erro}`;
          } else if (error.error?.message) {
            mensagemErro = `Erro ao carregar métricas: ${error.error.message}`;
          } else if (error.status === 0) {
            mensagemErro = 'Erro de conexão ao carregar métricas. Verifique sua internet.';
          } else if (error.status === 500) {
            mensagemErro = 'Erro interno do servidor ao carregar métricas.';
          }
          
          this.carregandoMetricas = false;
          this.mostrarToast(mensagemErro, 'danger');
          
          // Reseta métricas em caso de erro
          this.metricas = {
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
        }
      });
    });
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

  // ============================================
  // RELATÓRIOS
  // ============================================

  async exportarVeiculosSemChecklist() {
    this.carregandoRelatorio = true;

    try {
      console.log('🔍 Buscando veículos sem checklist...');

      const resultado = await this.apiService.buscarVeiculosSemChecklist().toPromise();

      if (!resultado || !resultado.veiculos || resultado.veiculos.length === 0) {
        const toast = await this.toastController.create({
          message: 'Nenhum veículo sem checklist encontrado! Todos os veículos cadastrados já possuem checklist.',
          duration: 3000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
        this.carregandoRelatorio = false;
        return;
      }

      console.log(`📊 ${resultado.veiculos.length} veículos sem checklist encontrados`);

      // Gerar CSV
      const csv = this.gerarCSV(resultado.veiculos);

      // Download do arquivo
      this.downloadCSV(csv, `veiculos-sem-checklist-${new Date().toISOString().split('T')[0]}.csv`);

      const toast = await this.toastController.create({
        message: `Relatório gerado com sucesso! ${resultado.veiculos.length} veículos exportados.`,
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);

      const alert = await this.alertController.create({
        header: 'Erro ao Gerar Relatório',
        message: 'Não foi possível gerar o relatório de veículos sem checklist. Tente novamente.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.carregandoRelatorio = false;
    }
  }

  private gerarCSV(veiculos: any[]): string {
    // Cabeçalho
    const header = ['Placa', 'Total de Checklists', 'Status'];

    // Linhas de dados
    const rows = veiculos.map(v => [
      v.placa,
      '0',
      'Sem checklist'
    ]);

    // Combinar header + rows
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Adicionar BOM para Excel reconhecer UTF-8
    return '\uFEFF' + csvContent;
  }

  private downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      // Browsers que suportam HTML5 download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
