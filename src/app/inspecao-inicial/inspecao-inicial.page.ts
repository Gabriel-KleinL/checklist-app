import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LoadingController, AlertController } from '@ionic/angular';
import { ChecklistDataService, InspecaoInicialData } from '../services/checklist-data.service';
import { LocalStorageService } from '../services/local-storage';
import { AuthService } from '../services/auth.service';
import { TempoTelasService } from '../services/tempo-telas.service';
import { ApiService } from '../services/api.service';
import { ConfigCamposInspecaoService, CampoInspecao } from '../services/config-campos-inspecao.service';
import { driver } from 'driver.js';

@Component({
  selector: 'app-inspecao-inicial',
  templateUrl: './inspecao-inicial.page.html',
  styleUrls: ['./inspecao-inicial.page.scss'],
  standalone: false,
})
export class InspecaoInicialPage implements OnInit, OnDestroy {

  inspecaoInicial: InspecaoInicialData = {
    placa: '',
    local: undefined,
    kmInicial: null,
    nivelCombustivel: undefined,
    fotoPainel: undefined,
    observacaoPainel: '',
    statusGeral: undefined,
    fotosCampos: {}
  };

  // Campos configuráveis carregados do banco
  camposConfigurados: CampoInspecao[] = [];
  carregandoCampos = true;

  // Opções para campos do tipo select (carregadas dinamicamente ou padrão)
  opcoesLocais = [
    'Metropolitana - Serra',
    'Nova Venécia',
    'Guarapari',
    'Santa Tereza',
    'Rio de Janeiro',
    'Castelo',
    'Barra de São Francisco'
  ];

  opcoesCombustivel = [
    { valor: '0%', label: 'Vazio' },
    { valor: '25%', label: '1/4' },
    { valor: '50%', label: '1/2' },
    { valor: '75%', label: '3/4' },
    { valor: '100%', label: 'Cheio' }
  ];

  opcoesStatusGeral = [
    { valor: 'aprovado', label: 'Aprovado' },
    { valor: 'reprovado', label: 'Reprovado' },
    { valor: 'pendente', label: 'Pendente' }
  ];

  exibirAjuda = false;

  // Autocomplete de placas
  placasFiltradas: string[] = [];
  mostrarSugestoes = false;
  carregandoPlacas = false;

  constructor(
    private router: Router,
    private checklistData: ChecklistDataService,
    private localStorage: LocalStorageService,
    private authService: AuthService,
    private tempoTelasService: TempoTelasService,
    private apiService: ApiService,
    private configCamposService: ConfigCamposInspecaoService,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    // Inicia rastreamento de tempo
    this.tempoTelasService.iniciarTela('inspecao-inicial');

    // Carrega campos configuráveis do backend
    await this.carregarCamposConfigurados();

    await this.recuperarDadosSalvos();
    await this.verificarPrimeiroAcesso();
  }

  async carregarCamposConfigurados() {
    this.carregandoCampos = true;

    // Busca tipo_veiculo_id do localStorage
    let tipoVeiculoId = 1; // Padrão: Carro
    try {
      const tipoVeiculoIdStr = await this.localStorage.getItem('tipo_veiculo_id');
      if (tipoVeiculoIdStr) {
        tipoVeiculoId = parseInt(tipoVeiculoIdStr, 10) || 1;
      }
    } catch (error) {
      console.warn('Erro ao recuperar tipo_veiculo_id, usando padrão:', error);
    }

    this.configCamposService.listarCamposHabilitados(tipoVeiculoId).subscribe({
      next: (campos) => {
        this.camposConfigurados = campos;
        console.log('[Inspeção Inicial] Campos configurados carregados:', campos);
        this.carregandoCampos = false;
      },
      error: (error) => {
        console.error('[Inspeção Inicial] Erro ao carregar campos:', error);
        // Em caso de erro, usa configuração padrão
        this.camposConfigurados = [];
        this.carregandoCampos = false;
      }
    });
  }

  // Verifica se um campo específico está habilitado
  campoHabilitado(nomeCampo: string): boolean {
    // Se ainda está carregando ou não há campos configurados, mostra todos
    if (this.carregandoCampos || this.camposConfigurados.length === 0) {
      return true;
    }
    const campo = this.camposConfigurados.find(c => c.nome_campo === nomeCampo);
    return campo ? campo.habilitado : false;
  }

  // Verifica se um campo é obrigatório
  campoObrigatorio(nomeCampo: string): boolean {
    const campo = this.camposConfigurados.find(c => c.nome_campo === nomeCampo);
    return campo ? campo.obrigatorio : false;
  }

  // Verifica se um campo tem foto
  campoTemFoto(nomeCampo: string): boolean {
    const campo = this.camposConfigurados.find(c => c.nome_campo === nomeCampo);
    return campo ? campo.tem_foto : false;
  }

  // Obtém o label de um campo
  getCampoLabel(nomeCampo: string): string {
    const campo = this.camposConfigurados.find(c => c.nome_campo === nomeCampo);
    return campo ? campo.label : nomeCampo;
  }

  ngOnDestroy() {
    // Finaliza rastreamento de tempo ao sair da tela
    const usuarioId = this.authService.currentUserValue?.id;
    const observable = this.tempoTelasService.finalizarTela(undefined, usuarioId);
    if (observable) {
      observable.subscribe({
        next: (response) => console.log('[Tempo] Salvo com sucesso:', response),
        error: (error) => console.error('[Tempo] Erro ao salvar:', error)
      });
    }
  }

  async recuperarDadosSalvos() {
    const dadosSalvos = await this.localStorage.recuperarInspecaoInicial();
    if (dadosSalvos) {
      this.inspecaoInicial = dadosSalvos;
    }
  }

  async salvarLocalmente() {
    await this.localStorage.salvarInspecaoInicial(this.inspecaoInicial);
  }

  async tirarFotoPainel() {
    try {
      const image = await Camera.getPhoto({
        quality: 45,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1200,
        height: 1200
      });

      this.inspecaoInicial.fotoPainel = image.dataUrl;
      await this.salvarLocalmente();
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
    }
  }

  async removerFotoPainel() {
    this.inspecaoInicial.fotoPainel = undefined;
    await this.salvarLocalmente();
  }

  // Métodos genéricos para foto de qualquer campo
  async tirarFotoCampo(nomeCampo: string) {
    try {
      const image = await Camera.getPhoto({
        quality: 45,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1200,
        height: 1200
      });

      if (!this.inspecaoInicial.fotosCampos) {
        this.inspecaoInicial.fotosCampos = {};
      }
      this.inspecaoInicial.fotosCampos[nomeCampo] = image.dataUrl || '';
      await this.salvarLocalmente();
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
    }
  }

  async removerFotoCampo(nomeCampo: string) {
    if (this.inspecaoInicial.fotosCampos) {
      delete this.inspecaoInicial.fotosCampos[nomeCampo];
      await this.salvarLocalmente();
    }
  }

  getFotoCampo(nomeCampo: string): string | undefined {
    return this.inspecaoInicial.fotosCampos?.[nomeCampo];
  }

  async onCampoChange() {
    await this.salvarLocalmente();
  }

  onPlacaInput(event: any) {
    let termo = event.target?.value || '';

    // Força maiúsculas
    if (termo) {
      termo = termo.toUpperCase();
      this.inspecaoInicial.placa = termo;
      // Atualiza o valor no input visualmente se necessário (embora o ngModel deva cuidar disso)
      if (event.target) {
        event.target.value = termo;
      }
    }

    if (termo && termo.length >= 2) {
      this.carregandoPlacas = true;
      this.mostrarSugestoes = true;

      this.apiService.buscarPlacas(termo, 10).subscribe({
        next: (response) => {
          // response é direto o array de placas
          this.placasFiltradas = Array.isArray(response) ? response : [];
          this.carregandoPlacas = false;
        },
        error: (error) => {
          console.error('Erro ao buscar placas:', error);
          this.placasFiltradas = [];
          this.carregandoPlacas = false;
        }
      });
    } else {
      this.placasFiltradas = [];
      this.mostrarSugestoes = false;
    }

    this.onCampoChange();
  }

  selecionarPlaca(placa: string) {
    this.inspecaoInicial.placa = placa;
    this.mostrarSugestoes = false;
    this.placasFiltradas = [];
    this.onCampoChange();
  }

  fecharSugestoes() {
    setTimeout(() => {
      this.mostrarSugestoes = false;
    }, 200);
  }

  validarFormulario(): boolean {
    // Se ainda está carregando campos, não valida
    if (this.carregandoCampos) {
      return false;
    }

    // Se não há campos configurados, usa validação padrão
    if (this.camposConfigurados.length === 0) {
      return !!(
        this.inspecaoInicial.placa &&
        this.inspecaoInicial.local &&
        this.inspecaoInicial.kmInicial !== null &&
        this.inspecaoInicial.nivelCombustivel &&
        this.inspecaoInicial.fotoPainel
      );
    }

    // Valida baseado nos campos configurados como obrigatórios
    for (const campo of this.camposConfigurados) {
      if (campo.obrigatorio && campo.habilitado) {
        const valor = this.getValorCampo(campo.nome_campo);
        if (valor === null || valor === undefined || valor === '') {
          return false;
        }
      }
    }
    return true;
  }

  // Obtém o valor de um campo pelo nome
  getValorCampo(nomeCampo: string): any {
    const mapeamento: { [key: string]: any } = {
      'placa': this.inspecaoInicial.placa,
      'local': this.inspecaoInicial.local,
      'km_inicial': this.inspecaoInicial.kmInicial,
      'nivel_combustivel': this.inspecaoInicial.nivelCombustivel,
      'observacao_painel': this.inspecaoInicial.observacaoPainel,
      'status_geral': this.inspecaoInicial.statusGeral,
      'foto_painel': this.inspecaoInicial.fotoPainel
    };
    return mapeamento[nomeCampo];
  }

  async verificarPlacaNoBanco(placa: string): Promise<boolean> {
    try {
      // Valida se a placa existe no cadastro de veículos (tabela Vehicles)
      const response = await this.apiService.validarPlaca(placa).toPromise();

      // Verifica se retornou sucesso E se a placa foi encontrada (dados === true)
      if (response && response.sucesso === true && response.dados === true) {
        console.log('✅ Placa válida:', placa);
        return true;
      }

      console.log('❌ Placa não encontrada:', placa, 'Response:', response);
      return false;
    } catch (error: any) {
      console.error('Erro ao validar placa:', error);
      // Se retornou 404 (placa não encontrada), retorna false
      if (error?.status === 404) {
        return false;
      }
      // Para outros erros, também retorna false
      return false;
    }
  }

  async salvarInspecao() {
    if (!this.validarFormulario()) {
      alert('Por favor, preencha todos os campos obrigatórios: Placa, Local, KM Inicial, Combustível e Foto do Painel.');
      return;
    }

    // Validação da placa no backend
    const loading = await this.loadingController.create({
      message: 'Validando placa...',
      spinner: 'crescent'
    });
    await loading.present();

    const placaValida = await this.verificarPlacaNoBanco(this.inspecaoInicial.placa);
    await loading.dismiss();

    if (!placaValida) {
      const alert = await this.alertController.create({
        header: '🚫 Placa Não Autorizada',
        message: `A placa ${this.inspecaoInicial.placa.toUpperCase()} não foi encontrada na base de dados.\n\nVerifique se digitou corretamente ou entre em contato com o gestor da frota.`,
        buttons: ['OK'],
        cssClass: 'custom-alert-danger'
      });
      await alert.present();
      return;
    }

    const usuarioId = this.authService.currentUserValue?.id;

    // Busca tipo_veiculo_id do localStorage (salvo na tela Home)
    let tipoVeiculoId = 1; // Padrão: Carro
    try {
      const tipoVeiculoIdStr = await this.localStorage.getItem('tipo_veiculo_id');
      if (tipoVeiculoIdStr) {
        tipoVeiculoId = parseInt(tipoVeiculoIdStr, 10) || 1;
      }
    } catch (error) {
      console.warn('Erro ao recuperar tipo_veiculo_id, usando padrão:', error);
    }

    try {
      // Cria a inspeção na API com os dados iniciais
      const dadosInspecao = {
        placa: this.inspecaoInicial.placa,
        local: this.inspecaoInicial.local,
        km_inicial: this.inspecaoInicial.kmInicial,
        nivel_combustivel: this.inspecaoInicial.nivelCombustivel,
        foto_painel: this.inspecaoInicial.fotoPainel,
        observacao_painel: this.inspecaoInicial.observacaoPainel,
        status_geral: this.inspecaoInicial.statusGeral,
        fotos_campos: this.inspecaoInicial.fotosCampos || {},
        usuario_id: usuarioId,
        tipo_veiculo_id: tipoVeiculoId,
        itens_inspecao: [],
        itens_pneus: []
      };

      console.log('[Inspeção] Criando inspeção inicial na API...');
      const resultado = await this.apiService.criarInspecaoInicial(dadosInspecao).toPromise();

      if (resultado && resultado.id) {
        const inspecaoId = resultado.id;
        console.log('[Inspeção] Inspeção criada com ID:', inspecaoId);

        // Salva o ID da inspeção no serviço compartilhado (com persistência)
        await this.checklistData.setInspecaoId(inspecaoId);
        this.checklistData.setInspecaoInicial(this.inspecaoInicial);

        // Finaliza e salva o tempo de tela com o inspecao_id
        const observable = this.tempoTelasService.finalizarTela(inspecaoId, usuarioId);
        if (observable) {
          try {
            await observable.toPromise();
            console.log('[Tempo] Tempo da tela inspecao-inicial salvo com sucesso com inspecao_id:', inspecaoId);
          } catch (error) {
            console.error('[Tempo] Erro ao salvar tempo:', error);
          }
        }

        // Navega para a próxima tela
        this.router.navigate(['/inspecao-veiculo']);
      } else {
        alert('Erro ao criar inspeção. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('[Inspeção] Erro ao criar inspeção:', error);
      alert('Erro ao criar inspeção. Verifique sua conexão e tente novamente.');
    }
  }

  voltar() {
    this.router.navigate(['/home']);
  }

  mostrarAjuda() {
    this.exibirAjuda = true;
  }

  fecharAjuda() {
    this.exibirAjuda = false;
  }

  async verificarPrimeiroAcesso() {
    // Verifica se o usuário já completou o tutorial
    if (!this.authService.tutorialConcluido()) {
      // Aguarda um pouco para garantir que a página renderizou
      setTimeout(() => {
        this.iniciarTour();
      }, 500);
    }
  }

  iniciarTour() {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next'],
      allowClose: false,
      steps: [
        {
          element: '#tour-placa',
          popover: {
            title: '1. Placa do Veículo',
            description: 'Digite a placa do veículo que será inspecionado. Exemplo: ABC-1234 ou ABC1D34',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-local',
          popover: {
            title: '2. Local',
            description: 'Selecione o local onde a inspeção está sendo realizada.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-km',
          popover: {
            title: '3. Quilometragem Inicial',
            description: 'Informe a quilometragem atual do veículo. Você pode conferir este valor no painel do veículo.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-combustivel',
          popover: {
            title: '4. Nível de Combustível',
            description: 'Selecione o nível aproximado de combustível: Vazio, 1/4, 1/2, 3/4 ou Cheio. Verifique o marcador de combustível no painel.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-foto-painel',
          popover: {
            title: '5. Foto do Painel',
            description: 'Tire uma foto clara do painel do veículo LIGADO. A foto deve mostrar o hodômetro e o marcador de combustível.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-observacoes',
          popover: {
            title: '6. Observações do Painel (Opcional)',
            description: 'Registre qualquer anomalia visível no painel, como luzes de alerta acesas, avisos de manutenção, etc. Este campo é opcional.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-continuar',
          popover: {
            title: '7. Continuar para Inspeção',
            description: 'Após preencher todos os campos obrigatórios, clique aqui para continuar para a próxima etapa da inspeção.',
            side: 'top',
            align: 'center'
          }
        },
        {
          popover: {
            title: 'Tutorial Concluído!',
            description: 'Agora você já sabe como preencher a inspeção inicial. Preencha os campos e continue para as próximas etapas!',
          }
        }
      ],
      onDestroyStarted: async () => {
        await this.marcarTutorialComoConcluido();
        driverObj.destroy();
      },
    });

    driverObj.drive();
  }

  async marcarTutorialComoConcluido() {
    // Marca o tutorial como concluído no servidor
    this.authService.marcarTutorialConcluido().subscribe({
      next: (response) => {
        console.log('Tutorial marcado como concluído:', response);
      },
      error: (error) => {
        console.error('Erro ao marcar tutorial:', error);
      }
    });
  }

}
