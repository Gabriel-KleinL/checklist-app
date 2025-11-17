import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { TempoTelasService } from '../services/tempo-telas.service';
import { ConfigItensService, ConfigItem } from '../services/config-itens.service';
import { ConfigItensCompletoService, ConfigItemCompleto } from '../services/config-itens-completo.service';
import { AuthService } from '../services/auth.service';
import { AlertController, ToastController } from '@ionic/angular';

interface Checklist {
  id: number;
  placa: string;
  km_inicial: number;
  nivel_combustivel: string;
  data_realizacao: string;
  status_geral?: string;
  usuario_nome?: string;
  observacao_painel?: string;
}

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
  checklists: Checklist[] = [];
  checklistsFiltrados: Checklist[] = [];

  // Checklists Completos
  checklistsCompletos: Checklist[] = [];
  checklistsCompletosFiltrados: Checklist[] = [];

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
  abaSelecionada: 'historico' | 'configuracao' = 'historico';
  itensConfig: ConfigItem[] = [];
  itensConfigPorCategoria: { [key: string]: ConfigItem[] } = {};
  carregandoConfig = false;
  categorias = [
    { key: 'MOTOR', label: 'Motor', icon: 'construct-outline', color: '#3880ff' },
    { key: 'ELETRICO', label: 'Elétrico', icon: 'flash-outline', color: '#ffc409' },
    { key: 'LIMPEZA', label: 'Limpeza', icon: 'water-outline', color: '#2dd36f' },
    { key: 'FERRAMENTA', label: 'Ferramentas', icon: 'build-outline', color: '#eb445a' },
    { key: 'PNEU', label: 'Pneus', icon: 'ellipse-outline', color: '#3dc2ff' }
  ];

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
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.carregarChecklists();
    this.carregarConfigItens();
  }

  mudarAba(aba: 'historico' | 'configuracao') {
    this.abaSelecionada = aba;
    if (aba === 'configuracao') {
      // Carrega a configuração apropriada dependendo do tipo de checklist
      if (this.tipoChecklistSelecionado === 'simples' && this.itensConfig.length === 0) {
        this.carregarConfigItens();
      } else if (this.tipoChecklistSelecionado === 'completo' && this.itensConfigCompleto.length === 0) {
        this.carregarConfigItensCompleto();
      }
    }
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
      const data = new Date(c.data_realizacao);
      data.setHours(0, 0, 0, 0);
      return data.getTime() === hoje.getTime();
    }).length;

    this.checklistsSemana = this.checklists.filter(c => {
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
      const data = new Date(c.data_realizacao);
      data.setHours(0, 0, 0, 0);
      return data.getTime() === hoje.getTime();
    }).length;

    this.checklistsCompletosSemana = this.checklistsCompletos.filter(c => {
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
        const passaDataInicio = !this.filtroDataInicio ||
          new Date(checklist.data_realizacao) >= new Date(this.filtroDataInicio);

        // Filtro por data final
        const passaDataFim = !this.filtroDataFim ||
          new Date(checklist.data_realizacao) <= new Date(this.filtroDataFim);

        return passaPlaca && passaDataInicio && passaDataFim;
      });
    } else {
      this.checklistsCompletosFiltrados = this.checklistsCompletos.filter(checklist => {
        // Filtro por placa
        const passaPlaca = !this.filtroPlaca ||
          checklist.placa.toLowerCase().includes(this.filtroPlaca.toLowerCase());

        // Filtro por data inicial
        const passaDataInicio = !this.filtroDataInicio ||
          new Date(checklist.data_realizacao) >= new Date(this.filtroDataInicio);

        // Filtro por data final
        const passaDataFim = !this.filtroDataFim ||
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

  async verDetalhes(checklist: Checklist) {
    this.carregando = true;
    try {
      // Busca todos os detalhes do checklist usando o endpoint 'completo'
      this.apiService.buscarCompleto(checklist.id).subscribe({
        next: (dados) => {
          this.checklistDetalhado = dados;

          // Busca os tempos de tela para esta inspeção
          this.tempoTelasService.buscarPorInspecao(checklist.id).subscribe({
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

  async mostrarAlertBasico(checklist: Checklist) {
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

  async verDetalhesCompleto(checklist: Checklist) {
    this.carregando = true;
    try {
      // Busca os detalhes do checklist completo
      this.apiService.buscarChecklistCompleto(checklist.id).subscribe({
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
  expandirFoto(foto: string) {
    this.fotoExpandida = foto;
    this.mostrarFotoExpandida = true;
    this.zoomLevel = 1;
  }

  fecharFotoExpandida() {
    this.mostrarFotoExpandida = false;
    this.fotoExpandida = null;
    this.zoomLevel = 1;
  }

  zoomIn() {
    if (this.zoomLevel < 5) {
      this.zoomLevel += 0.5;
    }
  }

  zoomOut() {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel -= 0.5;
    }
  }

  resetZoom() {
    this.zoomLevel = 1;
  }

  formatarData(data: string): string {
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
}
