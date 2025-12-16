import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ChecklistDataService } from '../services/checklist-data.service';
import { LocalStorageService } from '../services/local-storage';
import { AuthService } from '../services/auth.service';
import { TempoTelasService } from '../services/tempo-telas.service';
import { ConfigItensService } from '../services/config-itens.service';
import { ApiService } from '../services/api.service';
import { LoggerService } from '../services/logger.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { driver } from 'driver.js';
import { CAMERA_CONFIG, MESSAGES, STATUS_COLORS, STATUS_LABELS } from '../config/app.constants';
import {
  ItemMotor,
  ItemLimpeza,
  ItemEletrico,
  ItemFerramenta,
  InspecaoVeiculo
} from '../models/checklist.models';

@Component({
  selector: 'app-inspecao-veiculo',
  templateUrl: './inspecao-veiculo.page.html',
  styleUrls: ['./inspecao-veiculo.page.scss'],
  standalone: false,
})
export class InspecaoVeiculoPage implements OnInit, OnDestroy {

  inspecao: InspecaoVeiculo = {
    motor: [],
    limpeza: [],
    eletricos: [],
    ferramentas: []
  };

  readonly opcoesMotor = ['bom', 'ruim'];
  readonly opcoesLimpeza = ['pessima', 'ruim', 'satisfatoria', 'otimo'];
  readonly opcoesEletricos = ['bom', 'ruim'];
  readonly opcoesFerramentas = ['contem', 'nao_contem'];

  exibirAjuda = false;
  carregandoItens = false;

  constructor(
    private router: Router,
    private checklistData: ChecklistDataService,
    private localStorage: LocalStorageService,
    private authService: AuthService,
    private tempoTelasService: TempoTelasService,
    private configItensService: ConfigItensService,
    private apiService: ApiService,
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService
  ) { }

  async ngOnInit() {
    // Inicia rastreamento de tempo
    this.tempoTelasService.iniciarTela('inspecao-veiculo');

    // Carrega itens habilitados do banco de dados
    await this.carregarItensHabilitados();

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

  async carregarItensHabilitados(): Promise<void> {
    this.carregandoItens = true;
    this.logger.info('Carregando itens habilitados do banco de dados...');

    try {
      // Carrega apenas itens habilitados
      const itensHabilitados = await this.configItensService.buscarHabilitados().toPromise();

      if (itensHabilitados && itensHabilitados.length > 0) {
        // Filtra itens por categoria e mapeia para a estrutura do componente
        this.inspecao.motor = itensHabilitados
          .filter(item => item.categoria === 'MOTOR')
          .map(item => ({ nome: item.nome_item, valor: null }));

        this.inspecao.eletricos = itensHabilitados
          .filter(item => item.categoria === 'ELETRICO')
          .map(item => ({ nome: item.nome_item, valor: null }));

        this.inspecao.limpeza = itensHabilitados
          .filter(item => item.categoria === 'LIMPEZA')
          .map(item => ({ nome: item.nome_item, valor: null }));

        this.inspecao.ferramentas = itensHabilitados
          .filter(item => item.categoria === 'FERRAMENTA')
          .map(item => ({ nome: item.nome_item, valor: null }));

        this.logger.info(
          `Itens carregados: ${this.inspecao.motor.length} motor, ` +
          `${this.inspecao.eletricos.length} elétricos, ` +
          `${this.inspecao.limpeza.length} limpeza, ` +
          `${this.inspecao.ferramentas.length} ferramentas`
        );
        this.logger.debug('Inspeção configurada:', this.inspecao);
      } else {
        this.logger.warn('Nenhum item habilitado encontrado no banco de dados');
        await this.errorHandler.showWarning('Nenhum item de inspeção configurado. Entre em contato com o administrador.');
      }
    } catch (error) {
      this.logger.error('Erro ao carregar itens de configuração', error);
      await this.errorHandler.handleError(
        error,
        'Erro ao carregar itens de inspeção. Verifique sua conexão.',
        { showToast: true }
      );
    } finally {
      this.carregandoItens = false;
    }
  }

  async recuperarDadosSalvos() {
    const dadosSalvos = await this.localStorage.recuperarInspecaoVeiculo();
    if (dadosSalvos) {
      // Faz merge dos dados salvos com os valores padrão para garantir compatibilidade
      // Isso garante que novos campos adicionados ao app não quebrem dados antigos
      this.inspecao = {
        motor: dadosSalvos.motor || this.inspecao.motor,
        limpeza: dadosSalvos.limpeza || this.inspecao.limpeza,
        eletricos: dadosSalvos.eletricos || this.inspecao.eletricos,
        ferramentas: dadosSalvos.ferramentas || this.inspecao.ferramentas
      };

      // Se os dados antigos não tinham eletricos ou ferramentas, salva novamente com os novos campos
      if (!dadosSalvos.eletricos || !dadosSalvos.ferramentas) {
        console.log('Migrando dados antigos para nova estrutura...');
        await this.salvarLocalmente();
      }
    }
  }

  async salvarLocalmente() {
    await this.localStorage.salvarInspecaoVeiculo(this.inspecao);
  }

  validarFormulario(): boolean {
    // Valida se todos os campos foram preenchidos e se fotos obrigatórias foram tiradas
    const motorValido = this.inspecao.motor.every(item => {
      const valorPreenchido = item.valor !== null;
      const fotoObrigatoria = this.precisaFotoMotor(item) && !item.foto;
      return valorPreenchido && !fotoObrigatoria;
    });

    const limpezaValida = this.inspecao.limpeza.every(item => {
      const valorPreenchido = item.valor !== null;
      const fotoObrigatoria = this.precisaFotoLimpeza(item) && !item.foto;
      return valorPreenchido && !fotoObrigatoria;
    });

    const eletricosValido = this.inspecao.eletricos.every(item => {
      const valorPreenchido = item.valor !== null;
      const fotoObrigatoria = this.precisaFotoEletrico(item) && !item.foto;
      return valorPreenchido && !fotoObrigatoria;
    });

    const ferramentasValido = this.inspecao.ferramentas.every(item => {
      const valorPreenchido = item.valor !== null;
      const fotoObrigatoria = this.precisaFotoFerramenta(item) && !item.foto;
      return valorPreenchido && !fotoObrigatoria;
    });

    return motorValido && limpezaValida && eletricosValido && ferramentasValido;
  }

  precisaFotoMotor(item: ItemMotor): boolean {
    return item.valor === 'ruim';
  }

  precisaFotoLimpeza(item: ItemLimpeza): boolean {
    return item.valor === 'ruim' || item.valor === 'pessima';
  }

  precisaFotoEletrico(item: ItemEletrico): boolean {
    return item.valor === 'ruim';
  }

  precisaFotoFerramenta(item: ItemFerramenta): boolean {
    return item.valor === 'nao_contem';
  }

  async tirarFotoMotor(index: number): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: CAMERA_CONFIG.QUALITY,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: CAMERA_CONFIG.MAX_WIDTH,
        height: CAMERA_CONFIG.MAX_HEIGHT
      });

      this.inspecao.motor[index].foto = image.dataUrl;
      await this.salvarLocalmente();
      this.logger.debug(`Foto capturada para item de motor: ${this.inspecao.motor[index].nome}`);
    } catch (error) {
      this.logger.warn('Captura de foto cancelada ou erro', error);
    }
  }

  async tirarFotoLimpeza(index: number): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: CAMERA_CONFIG.QUALITY,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: CAMERA_CONFIG.MAX_WIDTH,
        height: CAMERA_CONFIG.MAX_HEIGHT
      });

      this.inspecao.limpeza[index].foto = image.dataUrl;
      await this.salvarLocalmente();
      this.logger.debug(`Foto capturada para item de limpeza: ${this.inspecao.limpeza[index].nome}`);
    } catch (error) {
      this.logger.warn('Captura de foto cancelada ou erro', error);
    }
  }

  async removerFotoMotor(index: number) {
    this.inspecao.motor[index].foto = undefined;
    await this.salvarLocalmente();
  }

  async removerFotoLimpeza(index: number) {
    this.inspecao.limpeza[index].foto = undefined;
    await this.salvarLocalmente();
  }

  async tirarFotoEletrico(index: number) {
    try {
      const image = await Camera.getPhoto({
        quality: 45,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 800,
        height: 800
      });

      this.inspecao.eletricos[index].foto = image.dataUrl;
      await this.salvarLocalmente();
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
    }
  }

  async removerFotoEletrico(index: number) {
    this.inspecao.eletricos[index].foto = undefined;
    await this.salvarLocalmente();
  }

  async tirarFotoFerramenta(index: number) {
    try {
      const image = await Camera.getPhoto({
        quality: 45,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 800,
        height: 800
      });

      this.inspecao.ferramentas[index].foto = image.dataUrl;
      await this.salvarLocalmente();
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
    }
  }

  async removerFotoFerramenta(index: number) {
    this.inspecao.ferramentas[index].foto = undefined;
    await this.salvarLocalmente();
  }

  async onValorMotorChange(item: ItemMotor) {
    // Se mudou para "bom", remove a foto e descrição
    if (item.valor === 'bom') {
      item.foto = undefined;
      item.descricao = undefined;
    }
    await this.salvarLocalmente();
  }

  async onValorLimpezaChange(item: ItemLimpeza) {
    // Se mudou para "satisfatória" ou "ótimo", remove a foto e descrição
    if (item.valor === 'satisfatoria' || item.valor === 'otimo') {
      item.foto = undefined;
      item.descricao = undefined;
    }
    await this.salvarLocalmente();
  }

  async onValorEletricoChange(item: ItemEletrico) {
    // Se mudou para "bom", remove a foto e descrição
    if (item.valor === 'bom') {
      item.foto = undefined;
      item.descricao = undefined;
    }
    await this.salvarLocalmente();
  }

  async onValorFerramentaChange(item: ItemFerramenta) {
    // Se mudou para "contém", remove a foto e descrição
    if (item.valor === 'contem') {
      item.foto = undefined;
      item.descricao = undefined;
    }
    await this.salvarLocalmente();
  }

  getCorStatus(valor: string): string {
    return STATUS_COLORS[valor as keyof typeof STATUS_COLORS] || 'medium';
  }

  getLabelLimpeza(valor: string): string {
    return STATUS_LABELS[valor as keyof typeof STATUS_LABELS] || valor;
  }

  async salvarInspecao(): Promise<void> {
    // Validação
    if (!this.validarFormulario()) {
      await this.errorHandler.showWarning(MESSAGES.ERROR.VALIDATION);
      return;
    }

    const usuarioId = this.authService.currentUserValue?.id;
    const inspecaoId = this.checklistData.getInspecaoId();

    if (!inspecaoId) {
      await this.errorHandler.handleError(
        new Error('ID da inspeção não encontrado'),
        'Erro: ID da inspeção não encontrado. Por favor, reinicie o processo.',
        { showAlert: true }
      );
      return;
    }

    this.logger.group('Salvando Inspeção do Veículo');
    this.logger.info(`Inspeção ID: ${inspecaoId}`);

    try {
      // Monta os itens de inspeção no formato da API
      const itensInspecao: any[] = [];

      // Adiciona itens do motor
      this.inspecao.motor.forEach(item => {
        if (item.valor) {
          itensInspecao.push({
            categoria: 'MOTOR',
            item: item.nome,
            status: item.valor,
            foto: item.foto || null,
            descricao: item.descricao || null
          });
        }
      });

      // Adiciona itens elétricos
      this.inspecao.eletricos.forEach(item => {
        if (item.valor) {
          itensInspecao.push({
            categoria: 'ELETRICO',
            item: item.nome,
            status: item.valor,
            foto: item.foto || null,
            descricao: item.descricao || null
          });
        }
      });

      // Adiciona itens de limpeza
      this.inspecao.limpeza.forEach(item => {
        if (item.valor) {
          itensInspecao.push({
            categoria: 'LIMPEZA',
            item: item.nome,
            status: item.valor,
            foto: item.foto || null,
            descricao: item.descricao || null
          });
        }
      });

      // Adiciona ferramentas
      this.inspecao.ferramentas.forEach(item => {
        if (item.valor) {
          itensInspecao.push({
            categoria: 'FERRAMENTA',
            item: item.nome,
            status: item.valor,
            foto: item.foto || null,
            descricao: item.descricao || null
          });
        }
      });

      this.logger.info(`Salvando ${itensInspecao.length} itens de inspeção`);

      // Atualiza a inspeção na API
      await this.apiService.atualizarInspecao(inspecaoId, {
        itens_inspecao: itensInspecao
      }).toPromise();

      this.logger.info('Inspeção atualizada com sucesso');

      // Salva os dados no serviço compartilhado
      this.checklistData.setInspecaoVeiculo(this.inspecao);

      // Finaliza e salva o tempo de tela com o inspecao_id
      const observable = this.tempoTelasService.finalizarTela(inspecaoId, usuarioId);
      if (observable) {
        try {
          await observable.toPromise();
          this.logger.debug('Tempo de tela salvo com sucesso');
        } catch (error) {
          this.logger.warn('Erro ao salvar tempo de tela (não crítico)', error);
        }
      }

      this.logger.groupEnd();

      // Navega para a próxima tela
      await this.errorHandler.showSuccess(MESSAGES.SUCCESS.SAVED);
      this.router.navigate(['/fotos-veiculo']);
    } catch (error) {
      this.logger.error('Erro ao salvar inspeção', error);
      this.logger.groupEnd();
      await this.errorHandler.handleApiError(error, 'salvar inspeção');
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
    // Não mostra tutorial nesta tela, apenas na primeira
    return;
  }

  iniciarTour() {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next'],
      allowClose: false,
      steps: [
        {
          element: '#tour-motor',
          popover: {
            title: '1. Inspeção do Motor',
            description: 'Avalie os componentes do motor: Água do Radiador, Água do Limpador, Fluido de Freio, Nível de Óleo e Tampa do Radiador. Marque "Bom" ou "Ruim".',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-motor-card',
          popover: {
            title: 'Fotos Obrigatórias',
            description: 'Se marcar qualquer item como "Ruim", você DEVE tirar uma foto do problema. O campo de foto aparecerá automaticamente.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-eletrico',
          popover: {
            title: '2. Sistema Elétrico',
            description: 'Teste o funcionamento das setas (esquerda e direita), pisca-alerta e faróis. Verifique se todos funcionam corretamente.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-limpeza',
          popover: {
            title: '3. Limpeza do Veículo',
            description: 'Avalie a limpeza interna e externa do veículo em 4 níveis: Péssima, Ruim, Satisfatória ou Ótimo.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-ferramentas',
          popover: {
            title: '4. Ferramentas e Equipamentos',
            description: 'Verifique se o veículo contém: Macaco, Chave de Roda, Chave do Estepe e Triângulo. Marque "Contém" ou "Não Contém".',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-salvar',
          popover: {
            title: '5. Salvar e Continuar',
            description: 'Após preencher todos os campos obrigatórios e tirar as fotos necessárias, clique em "Salvar Inspeção" para avançar.',
            side: 'top',
            align: 'center'
          }
        },
        {
          popover: {
            title: 'Tutorial Concluído!',
            description: 'Agora preencha todos os campos da inspeção do veículo para continuar!',
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
    // Não precisa marcar aqui, pois o tutorial só aparece na primeira tela
    return;
  }

}
