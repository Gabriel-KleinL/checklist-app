import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ConfigItensCompletoService, ConfigItemCompleto } from '../services/config-itens-completo.service';
import { AlertController, LoadingController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface ItemChecklist {
  descricao: string;
  valor: string | boolean;
  tipo: 'boolean' | 'text' | 'checkbox-group';
  opcoes?: string[];
}

// Interfaces para as partes do checklist com propriedades dinâmicas
interface Parte1 {
  [key: string]: any;
  buzina?: boolean;
  cintoSegurancaDianteiro?: boolean;
  cintoSegurancaTraseiro?: boolean;
  espelhoRetrovisorInterno?: boolean;
  freioMao?: boolean;
  limpadorParabrisa?: boolean;
  paraSol?: boolean;
  velocimetro?: boolean;
  luzPainel?: boolean;
  luzInterna?: boolean;
  alcaTransporte?: boolean;
  estadoConservacaoInterna?: string;
}

interface Parte2 {
  [key: string]: any;
  espelhoRetrovisorExtDireito?: boolean;
  espelhoRetrovisorExtEsquerdo?: boolean;
  extintor?: string;
  chaveRoda?: boolean;
  macaco?: boolean;
  triangulo?: boolean;
  pneuSobressalente?: boolean;
}

interface Parte3 {
  [key: string]: any;
  faroleteDianteiroDireito?: boolean;
  faroleteDianteiroEsquerdo?: boolean;
  farolAltoDireito?: boolean;
  farolBaixoDireito?: boolean;
  farolAltoEsquerdo?: boolean;
  farolBaixoEsquerdo?: boolean;
  setaDianteiraDireita?: boolean;
  setaDianteiraEsquerda?: boolean;
  pneuDianteiroDireito?: string;
  parafusosPneuDianteiroDireito?: number;
  pneuDianteiroEsquerdo?: string;
  parafusosPneuDianteiroEsquerdo?: number;
  paraChoqueDianteiro?: string;
  // Fotos dos itens marcados como ruim
  fotoPneuDianteiroDireito?: string;
  fotoPneuDianteiroEsquerdo?: string;
  fotoParaChoqueDianteiro?: string;
}

interface Parte4 {
  [key: string]: any;
  lanternaTraseiraDireita?: boolean;
  lanternaTraseiraEsquerda?: boolean;
  lanternaMarchaReDireita?: boolean;
  lanternaMarchaReEsquerda?: boolean;
  iluminacaoPlacaTraseira?: boolean;
  setaTraseiraDireita?: boolean;
  setaTraseiraEsquerda?: boolean;
  luzIndicadoraParada?: boolean;
  alerta?: boolean;
  paraChoqueTraseiro?: string;
  lacrePlaca?: string;
  pneuTraseiroDireito?: string;
  parafusosPneuTraseiroDireito?: number;
  pneuTraseiroEsquerdo?: string;
  parafusosPneuTraseiroEsquerdo?: number;
  protetoresRodasTraseiras?: boolean;
  estadoCarroceria?: string;
  silencioso?: boolean;
  corrosaoLataria?: string;
  corrosaoFundo?: string;
  freiosEstacionamento?: boolean;
  logomarca?: boolean;
  vazamentos?: boolean;
  // Fotos dos itens marcados como ruim
  fotoParaChoqueTraseiro?: string;
  fotoPneuTraseiroDireito?: string;
  fotoPneuTraseiroEsquerdo?: string;
}

interface Parte5 {
  [key: string]: any;
  certificadoCeturb?: boolean;
  fumacaPreta?: string;
  corrosaoCavalo?: string;
  corrosaoCarroceria?: string;
  corrosaoCarreta?: string;
  alcaEixoCardan?: boolean;
  protetoresRodasTraseiras?: boolean;
  freioMarcha?: boolean;
  alarmeSonoroRe?: boolean;
  enlonamento?: boolean;
  bombaRecalque?: boolean;
  adesivosRefletores?: boolean;
  alturaParaChoque?: boolean;
  estadoMangueiras?: string;
}

@Component({
  selector: 'app-checklist-completo',
  templateUrl: './checklist-completo.page.html',
  styleUrls: ['./checklist-completo.page.scss'],
  standalone: false,
})
export class ChecklistCompletoPage implements OnInit {
  // Controle de navegação entre partes
  parteAtual: number = 0;
  totalPartes: number = 6; // Dados iniciais + 5 partes

  // Steps para o stepper moderno
  steps = [
    { title: 'Dados Iniciais', subtitle: 'Informações do veículo' },
    { title: 'Parte Interna', subtitle: 'Componentes internos' },
    { title: 'Equipamentos', subtitle: 'Itens obrigatórios' },
    { title: 'Ext. Dianteira', subtitle: 'Frente do veículo' },
    { title: 'Ext. Traseira', subtitle: 'Traseira do veículo' },
    { title: 'Veículos Pesados', subtitle: 'Itens específicos' }
  ];

  // Dados básicos
  placa: string = '';
  kmInicial: number | null = null;
  nivelCombustivel: string = '';
  fotoPainel: string | undefined = undefined;
  observacaoPainel: string = '';

  // Níveis de combustível disponíveis
  opcoesCombustivel = [
    { valor: 'vazio', label: 'Vazio' },
    { valor: '1/4', label: '1/4' },
    { valor: '1/2', label: '1/2' },
    { valor: '3/4', label: '3/4' },
    { valor: 'cheio', label: 'Cheio' }
  ];
  niveisDisponiveis = ['Vazio', '1/4', '1/2', '3/4', 'Cheio'];

  // PARTE 1 - INTERNA (agora com índice dinâmico para suportar itens do banco)
  parte1: Parte1 = {
    buzina: false,
    cintoSegurancaDianteiro: false,
    cintoSegurancaTraseiro: false,
    espelhoRetrovisorInterno: false,
    freioMao: false,
    limpadorParabrisa: false,
    paraSol: false,
    velocimetro: false,
    luzPainel: false,
    luzInterna: false,
    alcaTransporte: false,
    estadoConservacaoInterna: ''
  };

  // PARTE 2 - PEÇAS / EQUIPAMENTOS OBRIGATÓRIOS
  parte2: Parte2 = {
    espelhoRetrovisorExtDireito: false,
    espelhoRetrovisorExtEsquerdo: false,
    extintor: '', // 'sem', 'com_cheio', 'com_vazio'
    chaveRoda: false,
    macaco: false,
    triangulo: false,
    pneuSobressalente: false
  };

  // PARTE 3 - EXTERNA DIANTEIRA
  parte3: Parte3 = {
    faroleteDianteiroDireito: false,
    faroleteDianteiroEsquerdo: false,
    farolAltoDireito: false,
    farolBaixoDireito: false,
    farolAltoEsquerdo: false,
    farolBaixoEsquerdo: false,
    setaDianteiraDireita: false,
    setaDianteiraEsquerda: false,
    pneuDianteiroDireito: '', // 'bom', 'regular', 'ruim'
    parafusosPneuDianteiroDireito: 4,
    pneuDianteiroEsquerdo: '', // 'bom', 'regular', 'ruim'
    parafusosPneuDianteiroEsquerdo: 4,
    paraChoqueDianteiro: '' // 'bom', 'regular', 'ruim'
  };

  // PARTE 4 - EXTERNA TRASEIRA
  parte4: Parte4 = {
    lanternaTraseiraDireita: false,
    lanternaTraseiraEsquerda: false,
    lanternaMarchaReDireita: false,
    lanternaMarchaReEsquerda: false,
    iluminacaoPlacaTraseira: false,
    setaTraseiraDireita: false,
    setaTraseiraEsquerda: false,
    luzIndicadoraParada: false,
    alerta: false,
    paraChoqueTraseiro: '', // 'bom', 'regular', 'ruim'
    lacrePlaca: '', // 'com', 'sem', 'violado'
    pneuTraseiroDireito: '', // 'bom', 'regular', 'ruim'
    parafusosPneuTraseiroDireito: 4,
    pneuTraseiroEsquerdo: '', // 'bom', 'regular', 'ruim'
    parafusosPneuTraseiroEsquerdo: 4,
    protetoresRodasTraseiras: false,
    estadoCarroceria: '',
    silencioso: false,
    corrosaoLataria: '', // 'p10', 'p20', 'p30'
    corrosaoFundo: '', // 'p10', 'p20', 'p30'
    freiosEstacionamento: false,
    logomarca: false,
    vazamentos: false
  };

  // PARTE 5 - ÔNIBUS / CAMINHÕES / CARRO TANQUE
  parte5: Parte5 = {
    certificadoCeturb: false,
    fumacaPreta: '', // 'd20', 'd40', 'd60', 'd80', 'd100'
    corrosaoCavalo: '', // 'p10', 'p20', 'p30'
    corrosaoCarroceria: '', // 'p10', 'p20', 'p30'
    corrosaoCarreta: '', // 'p10', 'p20', 'p30'
    alcaEixoCardan: false,
    protetoresRodasTraseiras: false,
    freioMarcha: false,
    alarmeSonoroRe: false,
    enlonamento: false,
    bombaRecalque: false,
    adesivosRefletores: false,
    alturaParaChoque: false,
    estadoMangueiras: ''
  };

  // Itens carregados do banco de dados
  itensHabilitadosPorCategoria: { [key: string]: ConfigItemCompleto[] } = {};
  carregandoItens = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private configItensCompletoService: ConfigItensCompletoService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.carregarItensConfigurados();
  }

  carregarItensConfigurados() {
    this.carregandoItens = true;
    this.configItensCompletoService.buscarHabilitados().subscribe({
      next: (itens) => {
        console.log('Itens habilitados carregados:', itens);
        this.organizarItensPorCategoria(itens);
        this.carregandoItens = false;
      },
      error: (error) => {
        console.error('Erro ao carregar itens configurados:', error);
        this.carregandoItens = false;
        // Continua com os itens padrão hardcoded se houver erro
      }
    });
  }

  organizarItensPorCategoria(itens: ConfigItemCompleto[]) {
    this.itensHabilitadosPorCategoria = {};
    itens.forEach(item => {
      if (!this.itensHabilitadosPorCategoria[item.categoria]) {
        this.itensHabilitadosPorCategoria[item.categoria] = [];
      }
      this.itensHabilitadosPorCategoria[item.categoria].push(item);
    });

    console.log('Itens organizados por categoria:', this.itensHabilitadosPorCategoria);
  }

  // Método auxiliar para verificar se um item está habilitado
  isItemHabilitado(categoria: string, nomeItem: string): boolean {
    const itensDaCategoria = this.itensHabilitadosPorCategoria[categoria];
    if (!itensDaCategoria) return false;

    return itensDaCategoria.some(item =>
      item.nome_item.toLowerCase() === nomeItem.toLowerCase() && item.habilitado
    );
  }

  // Método para obter todos os itens de uma categoria
  getItensDaCategoria(categoria: string): ConfigItemCompleto[] {
    return this.itensHabilitadosPorCategoria[categoria] || [];
  }

  // Navegação entre partes
  proximaParte() {
    if (this.parteAtual < this.totalPartes - 1) {
      this.parteAtual++;
      window.scrollTo(0, 0);
    }
  }

  parteAnterior() {
    if (this.parteAtual > 0) {
      this.parteAtual--;
      window.scrollTo(0, 0);
    }
  }

  irParaParte(parte: number) {
    this.parteAtual = parte;
    window.scrollTo(0, 0);
  }

  podeAvancar(): boolean {
    // No checklist completo, não há campos obrigatórios
    return true;
  }

  // Métodos para foto do painel
  async tirarFotoPainel() {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 800,
        height: 800
      });

      this.fotoPainel = image.dataUrl;
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
    }
  }

  async removerFotoPainel() {
    this.fotoPainel = undefined;
  }

  // Método genérico para tirar foto de itens marcados como "ruim"
  async tirarFotoItem(nomeItem: string) {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 800,
        height: 800
      });

      // Mapeia o nome do item para a propriedade de foto correspondente
      const mapeamentoFotos: { [key: string]: { parte: string, prop: string } } = {
        'pneuDianteiroDireito': { parte: 'parte3', prop: 'fotoPneuDianteiroDireito' },
        'pneuDianteiroEsquerdo': { parte: 'parte3', prop: 'fotoPneuDianteiroEsquerdo' },
        'paraChoqueDianteiro': { parte: 'parte3', prop: 'fotoParaChoqueDianteiro' },
        'paraChoqueTraseiro': { parte: 'parte4', prop: 'fotoParaChoqueTraseiro' },
        'pneuTraseiroDireito': { parte: 'parte4', prop: 'fotoPneuTraseiroDireito' },
        'pneuTraseiroEsquerdo': { parte: 'parte4', prop: 'fotoPneuTraseiroEsquerdo' }
      };

      const config = mapeamentoFotos[nomeItem];
      if (config) {
        (this as any)[config.parte][config.prop] = image.dataUrl;
      }
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
    }
  }

  // Método para remover foto de um item específico
  removerFotoItem(parte: string, propriedade: string) {
    (this as any)[parte][propriedade] = undefined;
  }

  validarPlaca(placa: string): boolean {
    if (!placa) return false;

    // Remove espaços e converte para maiúsculas
    const placaLimpa = placa.trim().toUpperCase();

    // Formato Mercosul: AAA1A11
    const regexMercosul = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;

    // Formato Antigo: AAA1111
    const regexAntigo = /^[A-Z]{3}[0-9]{4}$/;

    return regexMercosul.test(placaLimpa) || regexAntigo.test(placaLimpa);
  }

  formatarPlaca() {
    if (this.placa) {
      // Remove espaços e hifens e converte para maiúsculas
      this.placa = this.placa.replace(/[\s-]/g, '').toUpperCase();
    }
  }

  getProgresso(): number {
    return ((this.parteAtual + 1) / this.totalPartes) * 100;
  }

  async salvarChecklist() {
    // Validação básica - apenas aviso se placa estiver preenchida incorretamente
    if (this.placa && !this.validarPlaca(this.placa)) {
      const confirmar = confirm('A placa informada está em formato inválido. Deseja continuar mesmo assim?');
      if (!confirmar) {
        this.irParaParte(0);
        return;
      }
    }

    const loading = await this.loadingController.create({
      message: 'Salvando checklist...',
      spinner: 'crescent'
    });
    await loading.present();

    // Obtém o usuário logado
    const usuarioId = this.authService.currentUserValue?.id;

    // Monta o objeto com todos os dados
    const checklistCompleto = {
      placa: this.placa,
      km_inicial: this.kmInicial,
      nivel_combustivel: this.nivelCombustivel,
      foto_painel: this.fotoPainel,
      observacao_painel: this.observacaoPainel,
      usuario_id: usuarioId,
      data_realizacao: new Date().toISOString(),
      parte1: this.parte1,
      parte2: this.parte2,
      parte3: this.parte3,
      parte4: this.parte4,
      parte5: this.parte5
    };

    console.log('Checklist completo:', checklistCompleto);

    // Salva via API
    this.apiService.salvarChecklistCompleto(checklistCompleto).subscribe({
      next: async (response) => {
        await loading.dismiss();
        await this.mostrarAlerta('Sucesso', 'Checklist salvo com sucesso!');
        this.limparFormulario();
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Erro ao salvar checklist:', error);
        await this.mostrarAlerta('Erro', 'Erro ao salvar o checklist. Tente novamente.');
      }
    });
  }

  limparFormulario() {
    this.placa = '';
    this.kmInicial = null;
    this.nivelCombustivel = '';
    this.fotoPainel = undefined;
    this.observacaoPainel = '';
    this.parteAtual = 0;

    // Reseta todas as partes (mantendo a tipagem com índice dinâmico)
    this.parte1 = {
      buzina: false,
      cintoSegurancaDianteiro: false,
      cintoSegurancaTraseiro: false,
      espelhoRetrovisorInterno: false,
      freioMao: false,
      limpadorParabrisa: false,
      paraSol: false,
      velocimetro: false,
      luzPainel: false,
      luzInterna: false,
      alcaTransporte: false,
      estadoConservacaoInterna: ''
    };

    this.parte2 = {
      espelhoRetrovisorExtDireito: false,
      espelhoRetrovisorExtEsquerdo: false,
      extintor: '',
      chaveRoda: false,
      macaco: false,
      triangulo: false,
      pneuSobressalente: false
    };

    this.parte3 = {
      faroleteDianteiroDireito: false,
      faroleteDianteiroEsquerdo: false,
      farolAltoDireito: false,
      farolBaixoDireito: false,
      farolAltoEsquerdo: false,
      farolBaixoEsquerdo: false,
      setaDianteiraDireita: false,
      setaDianteiraEsquerda: false,
      pneuDianteiroDireito: '',
      parafusosPneuDianteiroDireito: 4,
      pneuDianteiroEsquerdo: '',
      parafusosPneuDianteiroEsquerdo: 4,
      paraChoqueDianteiro: '',
      fotoPneuDianteiroDireito: undefined,
      fotoPneuDianteiroEsquerdo: undefined,
      fotoParaChoqueDianteiro: undefined
    };

    this.parte4 = {
      lanternaTraseiraDireita: false,
      lanternaTraseiraEsquerda: false,
      lanternaMarchaReDireita: false,
      lanternaMarchaReEsquerda: false,
      iluminacaoPlacaTraseira: false,
      setaTraseiraDireita: false,
      setaTraseiraEsquerda: false,
      luzIndicadoraParada: false,
      alerta: false,
      paraChoqueTraseiro: '',
      lacrePlaca: '',
      pneuTraseiroDireito: '',
      parafusosPneuTraseiroDireito: 4,
      pneuTraseiroEsquerdo: '',
      parafusosPneuTraseiroEsquerdo: 4,
      protetoresRodasTraseiras: false,
      estadoCarroceria: '',
      silencioso: false,
      corrosaoLataria: '',
      corrosaoFundo: '',
      freiosEstacionamento: false,
      logomarca: false,
      vazamentos: false,
      fotoParaChoqueTraseiro: undefined,
      fotoPneuTraseiroDireito: undefined,
      fotoPneuTraseiroEsquerdo: undefined
    };

    this.parte5 = {
      certificadoCeturb: false,
      fumacaPreta: '',
      corrosaoCavalo: '',
      corrosaoCarroceria: '',
      corrosaoCarreta: '',
      alcaEixoCardan: false,
      protetoresRodasTraseiras: false,
      freioMarcha: false,
      alarmeSonoroRe: false,
      enlonamento: false,
      bombaRecalque: false,
      adesivosRefletores: false,
      alturaParaChoque: false,
      estadoMangueiras: ''
    };
  }

  async mostrarAlerta(titulo: string, mensagem: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensagem,
      buttons: ['OK']
    });
    await alert.present();
  }

  voltar() {
    this.router.navigate(['/admin']);
  }
}
