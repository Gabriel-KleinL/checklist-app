import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ChecklistDataService, InspecaoInicialData } from '../services/checklist-data.service';
import { LocalStorageService } from '../services/local-storage';
import { AuthService } from '../services/auth.service';
import { TempoTelasService } from '../services/tempo-telas.service';
import { ApiService } from '../services/api.service';
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
    kmInicial: null,
    nivelCombustivel: '',
    fotoPainel: undefined,
    observacaoPainel: ''
  };

  opcoesCombustivel = [
    { valor: 'vazio', label: 'Vazio' },
    { valor: '1/4', label: '1/4' },
    { valor: '1/2', label: '1/2' },
    { valor: '3/4', label: '3/4' },
    { valor: 'cheio', label: 'Cheio' }
  ];

  exibirAjuda = false;

  constructor(
    private router: Router,
    private checklistData: ChecklistDataService,
    private localStorage: LocalStorageService,
    private authService: AuthService,
    private tempoTelasService: TempoTelasService,
    private apiService: ApiService
  ) { }

  async ngOnInit() {
    // Inicia rastreamento de tempo
    this.tempoTelasService.iniciarTela('inspecao-inicial');

    await this.recuperarDadosSalvos();
    await this.verificarPrimeiroAcesso();
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

  async onCampoChange() {
    await this.salvarLocalmente();
  }

  validarFormulario(): boolean {
    return !!(
      this.inspecaoInicial.placa &&
      this.inspecaoInicial.kmInicial !== null &&
      this.inspecaoInicial.nivelCombustivel &&
      this.inspecaoInicial.fotoPainel
    );
  }

  async salvarInspecao() {
    if (!this.validarFormulario()) {
      alert('Por favor, preencha todos os campos obrigatórios: Placa, KM Inicial, Combustível e Foto do Painel.');
      return;
    }

    const usuarioId = this.authService.currentUserValue?.id;

    try {
      // Cria a inspeção na API com os dados iniciais
      const dadosInspecao = {
        placa: this.inspecaoInicial.placa,
        km_inicial: this.inspecaoInicial.kmInicial,
        nivel_combustivel: this.inspecaoInicial.nivelCombustivel,
        foto_painel: this.inspecaoInicial.fotoPainel,
        observacao_painel: this.inspecaoInicial.observacaoPainel,
        usuario_id: usuarioId,
        itens_inspecao: [],
        itens_pneus: []
      };

      console.log('[Inspeção] Criando inspeção inicial na API...');
      const resultado = await this.apiService.criarInspecaoInicial(dadosInspecao).toPromise();

      if (resultado && resultado.id) {
        const inspecaoId = resultado.id;
        console.log('[Inspeção] Inspeção criada com ID:', inspecaoId);

        // Salva o ID da inspeção no serviço compartilhado
        this.checklistData.setInspecaoId(inspecaoId);
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
          element: '#tour-km',
          popover: {
            title: '2. Quilometragem Inicial',
            description: 'Informe a quilometragem atual do veículo. Você pode conferir este valor no painel do veículo.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-combustivel',
          popover: {
            title: '3. Nível de Combustível',
            description: 'Selecione o nível aproximado de combustível: Vazio, 1/4, 1/2, 3/4 ou Cheio. Verifique o marcador de combustível no painel.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-foto-painel',
          popover: {
            title: '4. Foto do Painel',
            description: 'Tire uma foto clara do painel do veículo LIGADO. A foto deve mostrar o hodômetro e o marcador de combustível.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-observacoes',
          popover: {
            title: '5. Observações do Painel (Opcional)',
            description: 'Registre qualquer anomalia visível no painel, como luzes de alerta acesas, avisos de manutenção, etc. Este campo é opcional.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-continuar',
          popover: {
            title: '6. Continuar para Inspeção',
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
