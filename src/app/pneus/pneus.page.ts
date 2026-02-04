import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ChecklistDataService } from '../services/checklist-data.service';
import { ApiService } from '../services/api.service';
import { ConfigItensService } from '../services/config-itens.service';
import { ConfigPneuPosicoesService } from '../services/config-pneu-posicoes.service';
import { AlertController, ToastController } from '@ionic/angular';
import { LocalStorageService } from '../services/local-storage';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { TempoTelasService } from '../services/tempo-telas.service';
import { driver } from 'driver.js';

interface RegraInspecao {
  nome: string;
  valor: string | null;
  foto?: string;
  descricao?: string;
  tipo_resposta: string;
  opcoes_resposta?: string[];
  tem_foto: boolean;
  foto_nao_conforme: boolean;
  obrigatorio: boolean;
}

interface PosicaoPneu {
  posicao_id: number;
  posicao_nome: string;
  pressao?: number;
  regras: RegraInspecao[];
}

@Component({
  selector: 'app-pneus',
  templateUrl: './pneus.page.html',
  styleUrls: ['./pneus.page.scss'],
  standalone: false,
})
export class PneusPage implements OnInit, OnDestroy {

  private posicoesPadrao = [
    { nome: 'Dianteiro Direito', id: 0 },
    { nome: 'Dianteiro Esquerdo', id: 0 },
    { nome: 'Traseiro Direito', id: 0 },
    { nome: 'Traseiro Esquerdo', id: 0 },
    { nome: 'Estepe', id: 0 }
  ];

  posicoes: PosicaoPneu[] = [];
  salvando = false;
  exibirAjuda = false;

  constructor(
    private router: Router,
    private checklistData: ChecklistDataService,
    private apiService: ApiService,
    private configItensService: ConfigItensService,
    private configPneuPosicoesService: ConfigPneuPosicoesService,
    private alertController: AlertController,
    private toastController: ToastController,
    private localStorage: LocalStorageService,
    private authService: AuthService,
    private tempoTelasService: TempoTelasService
  ) { }

  async ngOnInit() {
    this.tempoTelasService.iniciarTela('pneus');

    await this.carregarItensPneusConfig();
    await this.recuperarDadosSalvos();

    const inspecaoId = await this.checklistData.getInspecaoId();
    if (inspecaoId) {
      console.log('[Pneus] Inspecao ID encontrado:', inspecaoId);
    } else {
      console.warn('[Pneus] Inspecao ID nao encontrado.');
    }

    await this.verificarPrimeiroAcesso();
  }

  private async carregarItensPneusConfig() {
    try {
      const tipoVeiculoIdStr = await this.localStorage.getItem('tipo_veiculo_id');
      const tipoVeiculoId = tipoVeiculoIdStr ? parseInt(tipoVeiculoIdStr, 10) : 1;

      // Carrega posicoes e regras em paralelo
      const [posicoes, regras] = await Promise.all([
        this.configPneuPosicoesService.buscarPorTipoVeiculo(tipoVeiculoId, true).toPromise(),
        this.configItensService.buscarPorTipoVeiculo(tipoVeiculoId, 'PNEU', true).toPromise()
      ]);

      const posicoesCarregadas = posicoes && posicoes.length > 0
        ? posicoes
        : this.posicoesPadrao.map(p => ({ id: p.id, nome: p.nome, habilitado: true, ordem: 0 }));

      this.posicoes = posicoesCarregadas.map(pos => ({
        posicao_id: pos.id,
        posicao_nome: pos.nome,
        pressao: undefined,
        regras: (regras || []).map(regra => ({
          nome: regra.nome_item,
          valor: null,
          tipo_resposta: regra.tipo_resposta || 'conforme_nao_conforme',
          opcoes_resposta: this.parseOpcoes(regra.opcoes_resposta),
          tem_foto: !!regra.tem_foto,
          foto_nao_conforme: regra.foto_nao_conforme !== undefined ? !!regra.foto_nao_conforme : true,
          obrigatorio: regra.obrigatorio !== undefined ? !!regra.obrigatorio : true
        }))
      }));

      console.log(`[Pneus] ${posicoesCarregadas.length} posicoes, ${(regras || []).length} regras carregadas`);
    } catch (error) {
      console.warn('[Pneus] Erro ao carregar config, usando padrao:', error);
      this.posicoes = this.posicoesPadrao.map(p => ({
        posicao_id: p.id,
        posicao_nome: p.nome,
        pressao: undefined,
        regras: []
      }));
    }
  }

  private parseOpcoes(opcoes: any): string[] {
    if (!opcoes) return [];
    if (Array.isArray(opcoes)) return opcoes;
    try {
      const parsed = JSON.parse(opcoes);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  precisaFotoRegra(regra: RegraInspecao): boolean {
    if (regra.tipo_resposta === 'apenas_foto') return true;
    if (regra.tem_foto) return true;
    if (regra.tipo_resposta === 'conforme_nao_conforme' || !regra.tipo_resposta) {
      if (regra.valor === 'nao_conforme') {
        return regra.foto_nao_conforme !== false;
      }
    }
    return false;
  }

  mostrarFotoRegra(regra: RegraInspecao): boolean {
    return this.precisaFotoRegra(regra);
  }

  onValorChange() {
    this.salvarLocalmente();
  }

  ngOnDestroy() {
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
    const dadosSalvos = await this.localStorage.recuperarPneus();
    if (dadosSalvos && Array.isArray(dadosSalvos) && dadosSalvos.length > 0) {
      for (const posicao of this.posicoes) {
        const saved = dadosSalvos.find((s: any) => s.posicao_nome === posicao.posicao_nome);
        if (saved) {
          posicao.pressao = saved.pressao;
          if (saved.regras && Array.isArray(saved.regras)) {
            for (const regra of posicao.regras) {
              const savedRegra = saved.regras.find((sr: any) => sr.nome === regra.nome);
              if (savedRegra) {
                regra.valor = savedRegra.valor;
                regra.foto = savedRegra.foto;
                regra.descricao = savedRegra.descricao;
              }
            }
          }
        }
      }
    }
  }

  async salvarLocalmente() {
    await this.localStorage.salvarPneus(this.posicoes);
  }

  async tirarFotoRegra(posicaoIndex: number, regraIndex: number) {
    try {
      const image = await Camera.getPhoto({
        quality: 45,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 800,
        height: 800
      });

      this.posicoes[posicaoIndex].regras[regraIndex].foto = image.dataUrl;
      await this.salvarLocalmente();
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
    }
  }

  async removerFotoRegra(posicaoIndex: number, regraIndex: number) {
    this.posicoes[posicaoIndex].regras[regraIndex].foto = undefined;
    await this.salvarLocalmente();
  }

  async atualizarPressao(posicaoIndex: number, event: any) {
    const valor = event.target.value;
    this.posicoes[posicaoIndex].pressao = valor ? parseFloat(valor) : undefined;
    await this.salvarLocalmente();
  }

  validarFormulario(): boolean {
    return this.posicoes.every(posicao =>
      posicao.regras.every(regra => {
        if (regra.obrigatorio === false && (regra.valor === null || regra.valor === '') && regra.tipo_resposta !== 'apenas_foto') {
          return true;
        }
        if (regra.tipo_resposta === 'apenas_foto') {
          if (regra.obrigatorio === false) return true;
          return !!regra.foto;
        }
        const valorPreenchido = regra.valor !== null && regra.valor !== '';
        const fotoFaltando = this.precisaFotoRegra(regra) && !regra.foto;
        return valorPreenchido && !fotoFaltando;
      })
    );
  }

  async finalizarChecklist() {
    if (!this.validarFormulario()) {
      alert('Por favor, preencha todas as regras obrigatorias para cada pneu. Tire a foto quando necessario. A pressao e opcional.');
      return;
    }

    try {
      this.salvando = true;

      const usuarioId = this.authService.currentUserValue?.id;
      console.log('[Pneus] Buscando inspecaoId para salvar pneus...');
      const inspecaoId = await this.checklistData.getInspecaoId();
      console.log('[Pneus] InspecaoId recebido:', inspecaoId, 'Tipo:', typeof inspecaoId);

      if (!inspecaoId) {
        console.error('[Pneus] ERRO: ID da inspecao nao encontrado!');
        const alert = await this.alertController.create({
          header: 'Erro',
          message: 'ID da inspecao nao encontrado. Por favor, reinicie o processo do inicio.',
          buttons: ['OK']
        });
        await alert.present();
        this.salvando = false;
        return;
      }

      console.log('[Pneus] Prosseguindo com inspecaoId:', inspecaoId);

      // Salva dados no servico compartilhado
      this.checklistData.setPneus(this.posicoes);

      // Monta array de itens de pneus para a API
      const itensPneus: any[] = [];
      this.posicoes.forEach(posicao => {
        // Linha de pressao (por posicao)
        if (posicao.pressao) {
          itensPneus.push({
            item: posicao.posicao_nome,
            sub_item: null,
            status: 'registrado',
            foto: null,
            pressao: posicao.pressao,
            descricao: null
          });
        }
        // Uma linha por regra por posicao
        posicao.regras.forEach(regra => {
          if (regra.valor || regra.foto) {
            itensPneus.push({
              item: posicao.posicao_nome,
              sub_item: regra.nome,
              status: regra.valor,
              foto: regra.foto || null,
              pressao: null,
              descricao: regra.descricao || null
            });
          }
        });
      });

      console.log('[Inspecao] Atualizando inspecao com pneus...');
      await this.apiService.atualizarInspecao(inspecaoId, {
        itens_pneus: itensPneus
      }).toPromise();

      console.log('[Inspecao] Pneus atualizados com sucesso');

      const observable = this.tempoTelasService.finalizarTela(inspecaoId, usuarioId);
      if (observable) {
        try {
          await observable.toPromise();
          console.log('[Tempo] Tempo da tela pneus salvo com inspecao_id:', inspecaoId);
        } catch (error) {
          console.error('[Tempo] Erro ao salvar tempo:', error);
        }
      }

      this.router.navigate(['/observacao-adicional']);

    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      await this.mostrarErro(error);
    } finally {
      this.salvando = false;
    }
  }

  voltar() {
    this.router.navigate(['/fotos-veiculo']);
  }

  mostrarAjuda() {
    this.exibirAjuda = true;
  }

  fecharAjuda() {
    this.exibirAjuda = false;
  }

  async mostrarErro(error: any) {
    if (error.status === 409 && error.error) {
      const mensagem = error.error.mensagem || 'Esta placa ja possui um registro recente. Aguarde antes de registrar novamente.';
      const ultimoRegistro = error.error.ultimo_registro;

      let mensagemCompleta = mensagem;
      if (ultimoRegistro) {
        mensagemCompleta += `\n\nUltimo registro: ${new Date(ultimoRegistro).toLocaleString('pt-BR')}`;
      }

      const alert = await this.alertController.create({
        header: 'Registro Duplicado',
        message: mensagemCompleta,
        buttons: ['OK']
      });

      await alert.present();
      return;
    }

    let mensagemErro = 'Erro desconhecido';
    let detalhesCompletos = '';

    if (error?.error) {
      mensagemErro = error.error.erro || error.error.message || 'Erro na API';
      if (error.error.detalhes) {
        detalhesCompletos += `Detalhes: ${error.error.detalhes}\n`;
      }
      if (error.status) {
        detalhesCompletos += `Status HTTP: ${error.status}\n`;
      }
      if (error.statusText) {
        detalhesCompletos += `Status Text: ${error.statusText}\n`;
      }
      if (error.url) {
        detalhesCompletos += `URL: ${error.url}\n`;
      }
    } else if (error?.message) {
      mensagemErro = error.message;
      detalhesCompletos += `Tipo: ${error.name || 'Error'}\n`;
      if (error.stack) {
        detalhesCompletos += `Stack:\n${error.stack}\n`;
      }
    } else if (typeof error === 'string') {
      mensagemErro = error;
    } else {
      try {
        detalhesCompletos = JSON.stringify(error, null, 2);
      } catch {
        detalhesCompletos = String(error);
      }
    }

    const textoCompleto = `${mensagemErro}\n\n${detalhesCompletos}`;

    const alert = await this.alertController.create({
      header: 'Erro ao Salvar Checklist',
      message: `
        <div style="text-align: left; font-size: 12px;">
          <strong>Mensagem:</strong><br>
          <p style="word-break: break-word;">${mensagemErro}</p>
          ${detalhesCompletos ? `
            <strong>Detalhes Tecnicos:</strong><br>
            <pre style="font-size: 10px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">${detalhesCompletos}</pre>
          ` : ''}
        </div>
      `,
      buttons: [
        {
          text: 'Copiar Erro',
          handler: () => {
            this.copiarParaClipboard(textoCompleto);
            return false;
          }
        },
        {
          text: 'Fechar',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async copiarParaClipboard(texto: string) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(texto);
        this.mostrarToast('Erro copiado para a area de transferencia!');
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.mostrarToast('Erro copiado para a area de transferencia!');
      }
    } catch (err) {
      console.error('Erro ao copiar:', err);
      this.mostrarToast('Nao foi possivel copiar o erro');
    }
  }

  async mostrarToast(mensagem: string) {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  async verificarPrimeiroAcesso() {
    return;
  }

  iniciarTour() {
    const steps: any[] = [];
    this.posicoes.forEach((posicao, i) => {
      steps.push({
        element: `#tour-pneu-${i}`,
        popover: {
          title: `${i + 1}. ${posicao.posicao_nome}`,
          description: `Preencha todas as regras de inspecao para o pneu ${posicao.posicao_nome}. A pressao e opcional.`,
          side: 'bottom',
          align: 'start'
        }
      });
    });
    steps.push({
      element: '#tour-finalizar',
      popover: {
        title: `${this.posicoes.length + 1}. Finalizar Checklist`,
        description: 'Apos avaliar todos os pneus, clique em "Finalizar e Salvar Checklist" para enviar.',
        side: 'top',
        align: 'center'
      }
    });
    steps.push({
      popover: {
        title: 'Tutorial Concluido!',
        description: 'Agora inspecione todos os pneus e finalize o checklist!',
      }
    });

    const driverObj = driver({
      showProgress: true,
      showButtons: ['next'],
      allowClose: false,
      steps,
      onDestroyStarted: async () => {
        driverObj.destroy();
      },
    });

    driverObj.drive();
  }
}
