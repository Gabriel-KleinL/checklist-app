import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ChecklistDataService } from '../services/checklist-data.service';
import { ApiService } from '../services/api.service';
import { AlertController, ToastController } from '@ionic/angular';
import { LocalStorageService } from '../services/local-storage';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { TempoTelasService } from '../services/tempo-telas.service';
import { ConfigItensService } from '../services/config-itens.service';
import { driver } from 'driver.js';

interface Pneu {
  nome: string;
  posicao: string;
  valor: 'bom' | 'ruim' | null;
  foto?: string;
  pressao?: number;
  descricao?: string;
}

@Component({
  selector: 'app-pneus',
  templateUrl: './pneus.page.html',
  styleUrls: ['./pneus.page.scss'],
  standalone: false,
})
export class PneusPage implements OnInit, OnDestroy {

  pneus: Pneu[] = [
    { nome: 'Dianteira Direita', posicao: 'dianteira-direita', valor: null },
    { nome: 'Dianteira Esquerda', posicao: 'dianteira-esquerda', valor: null },
    { nome: 'Traseira Direita', posicao: 'traseira-direita', valor: null },
    { nome: 'Traseira Esquerda', posicao: 'traseira-esquerda', valor: null },
    { nome: 'Estepe', posicao: 'estepe', valor: null }
  ];

  opcoesPneu = ['bom', 'ruim'];
  salvando = false;

  exibirAjuda = false;

  constructor(
    private router: Router,
    private checklistData: ChecklistDataService,
    private apiService: ApiService,
    private alertController: AlertController,
    private toastController: ToastController,
    private localStorage: LocalStorageService,
    private authService: AuthService,
    private tempoTelasService: TempoTelasService,
    private configItensService: ConfigItensService
  ) { }

  async ngOnInit() {
    // Inicia rastreamento de tempo
    this.tempoTelasService.iniciarTela('pneus');

    // Carrega itens de pneus habilitados do banco de dados
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

  async carregarItensHabilitados() {
    try {
      console.log('[Config Itens Pneus] Carregando itens de pneus habilitados do banco...');

      // Carrega apenas itens habilitados da categoria PNEU
      const itensHabilitados = await this.configItensService.buscarHabilitados('PNEU').toPromise();

      if (itensHabilitados && itensHabilitados.length > 0) {
        console.log('[Config Itens Pneus] Itens carregados:', itensHabilitados);

        // Mapeia itens do banco para a estrutura de pneus
        this.pneus = itensHabilitados
          .filter(item => !item.nome_item.toLowerCase().includes('caneta'))
          .map((item, index) => ({
            nome: item.nome_item,
            posicao: this.gerarPosicao(item.nome_item, index),
            valor: null
          }));

        console.log('[Config Itens Pneus] Pneus configurados com itens do banco:', this.pneus);
      } else {
        console.log('[Config Itens Pneus] Nenhum item de pneu habilitado encontrado, usando itens padrão');
      }
    } catch (error) {
      console.error('[Config Itens Pneus] Erro ao carregar itens:', error);
      console.log('[Config Itens Pneus] Mantendo itens padrão hardcoded devido ao erro');
    }
  }

  gerarPosicao(nomeItem: string, index: number): string {
    // Tenta identificar a posição pelo nome, senão usa um padrão baseado no índice
    const nomeLower = nomeItem.toLowerCase();
    if (nomeLower.includes('dianteira') && nomeLower.includes('direita')) return 'dianteira-direita';
    if (nomeLower.includes('dianteira') && nomeLower.includes('esquerda')) return 'dianteira-esquerda';
    if (nomeLower.includes('traseira') && nomeLower.includes('direita')) return 'traseira-direita';
    if (nomeLower.includes('traseira') && nomeLower.includes('esquerda')) return 'traseira-esquerda';
    if (nomeLower.includes('estepe')) return 'estepe';

    // Fallback para posições genéricas
    return `pneu-${index}`;
  }

  async recuperarDadosSalvos() {
    const dadosSalvos = await this.localStorage.recuperarPneus();
    if (dadosSalvos) {
      this.pneus = dadosSalvos;
    }
  }

  async salvarLocalmente() {
    await this.localStorage.salvarPneus(this.pneus);
  }

  async tirarFoto(index: number) {
    try {
      const image = await Camera.getPhoto({
        quality: 45,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 800,
        height: 800
      });

      this.pneus[index].foto = image.dataUrl;
      await this.salvarLocalmente();
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
    }
  }



  async removerFoto(index: number) {
    this.pneus[index].foto = undefined;
    await this.salvarLocalmente();
  }



  async atualizarPressao(index: number, event: any) {
    const valor = event.target.value;
    this.pneus[index].pressao = valor ? parseFloat(valor) : undefined;
    await this.salvarLocalmente();
  }

  validarFormulario(): boolean {
    return this.pneus.every(pneu => {
      // Todos devem ter valor selecionado
      const valorPreenchido = pneu.valor !== null;
      // Se o pneu está ruim, a foto é obrigatória
      const fotoObrigatoria = pneu.valor === 'ruim' && !pneu.foto;
      // Pressão é obrigatória
      const pressaoPreenchida = pneu.pressao !== undefined && pneu.pressao !== null;

      return valorPreenchido && !fotoObrigatoria && pressaoPreenchida;
    });
  }

  async finalizarChecklist() {
    if (!this.validarFormulario()) {
      alert('Por favor, preencha todos os campos: condição e pressão para cada pneu. Tire também a foto do pneu se estiver marcado como "ruim".');
      return;
    }

    try {
      this.salvando = true;

      const usuarioId = this.authService.currentUserValue?.id;
      const inspecaoId = this.checklistData.getInspecaoId();

      if (!inspecaoId) {
        alert('Erro: ID da inspeção não encontrado. Por favor, reinicie o processo.');
        this.salvando = false;
        return;
      }

      // Salva os dados dos pneus no serviço compartilhado
      this.checklistData.setPneus(this.pneus);
      console.log('Dados dos pneus salvos');

      // Monta array de pneus para enviar à API
      const itensPneus: any[] = [];
      this.pneus.forEach(pneu => {
        if (pneu.valor) {
          itensPneus.push({
            item: pneu.nome,
            status: pneu.valor,
            foto: pneu.foto || null,
            pressao: pneu.pressao || null,
            descricao: pneu.descricao || null
          });
        }
      });

      // Atualiza a inspeção na API com os pneus
      console.log('[Inspeção] Atualizando inspeção com pneus...');
      await this.apiService.atualizarInspecao(inspecaoId, {
        itens_pneus: itensPneus
      }).toPromise();

      console.log('[Inspeção] Pneus atualizados com sucesso');

      // Finaliza e salva o tempo de tela com o inspecao_id
      const observable = this.tempoTelasService.finalizarTela(inspecaoId, usuarioId);
      if (observable) {
        try {
          await observable.toPromise();
          console.log('[Tempo] Tempo da tela pneus salvo com sucesso com inspecao_id:', inspecaoId);
        } catch (error) {
          console.error('[Tempo] Erro ao salvar tempo:', error);
        }
      }

      // Limpa os dados salvos localmente após sucesso
      await this.localStorage.limparTodosDados();
      console.log('Dados locais limpos após salvamento bem-sucedido');

      // Mostra mensagem de sucesso
      const successAlert = await this.alertController.create({
        header: 'Sucesso!',
        message: 'Checklist salvo no banco de dados com sucesso!',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              // Limpa os dados e volta para home
              this.checklistData.limparChecklist();
              this.router.navigate(['/home']);
            }
          }
        ]
      });

      await successAlert.present();

    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      await this.mostrarErro(error);
    } finally {
      this.salvando = false;
    }
  }

  private async salvarNaApi(checklistCompleto: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('=== INICIANDO SALVAMENTO NA API ===');
        console.log('URL da API:', environment.apiUrl);
        console.log('Timestamp:', new Date().toISOString());

        const observable = await this.apiService.salvarChecklistSimples(checklistCompleto);
        observable.subscribe({
          next: (response) => {
            console.log('=== SUCESSO AO SALVAR NA API ===');
            console.log('Resposta:', response);
            resolve(response);
          },
          error: (error) => {
            console.error('=== ERRO AO SALVAR NA API ===');
            console.error('Erro completo:', error);
            console.error('Status:', error.status);
            console.error('Status Text:', error.statusText);
            console.error('URL:', error.url);
            console.error('Message:', error.message);

            if (error.error) {
              console.error('Erro da API:', error.error);
            }

            reject(error);
          }
        });
      } catch (error) {
        console.error('=== ERRO AO CRIAR OBSERVABLE ===');
        console.error('Erro:', error);
        reject(error);
      }
    });
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
    // Tratamento específico para erro de duplicata (409)
    if (error.status === 409 && error.error) {
      const mensagem = error.error.mensagem || 'Esta placa já possui um registro recente. Aguarde antes de registrar novamente.';
      const ultimoRegistro = error.error.ultimo_registro;

      let mensagemCompleta = mensagem;
      if (ultimoRegistro) {
        mensagemCompleta += `\n\nÚltimo registro: ${new Date(ultimoRegistro).toLocaleString('pt-BR')}`;
      }

      const alert = await this.alertController.create({
        header: 'Registro Duplicado',
        message: mensagemCompleta,
        buttons: ['OK']
      });

      await alert.present();
      return;
    }

    // Extrai informações detalhadas do erro (para outros erros)
    let mensagemErro = 'Erro desconhecido';
    let detalhesCompletos = '';

    if (error?.error) {
      // Erro da API
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
      // Erro JavaScript genérico
      mensagemErro = error.message;
      detalhesCompletos += `Tipo: ${error.name || 'Error'}\n`;

      if (error.stack) {
        detalhesCompletos += `Stack:\n${error.stack}\n`;
      }
    } else if (typeof error === 'string') {
      mensagemErro = error;
    } else {
      // Tenta serializar o erro como JSON
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
            <strong>Detalhes Técnicos:</strong><br>
            <pre style="font-size: 10px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">${detalhesCompletos}</pre>
          ` : ''}
        </div>
      `,
      buttons: [
        {
          text: 'Copiar Erro',
          handler: () => {
            this.copiarParaClipboard(textoCompleto);
            return false; // Não fecha o alerta
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
      // Tenta usar a API moderna do Clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(texto);
        this.mostrarToast('Erro copiado para a área de transferência!');
      } else {
        // Fallback para dispositivos que não suportam
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.mostrarToast('Erro copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Erro ao copiar:', err);
      this.mostrarToast('Não foi possível copiar o erro');
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

  getCorStatus(valor: string): string {
    switch (valor) {
      case 'bom':
        return 'success';
      case 'ruim':
        return 'danger';
      default:
        return 'medium';
    }
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
          element: '#tour-pneu-0',
          popover: {
            title: '1. Pneu Dianteiro Direito',
            description: 'Avalie a condição do pneu dianteiro direito. Verifique o estado da borracha, profundidade dos sulcos e pressão. Tire uma foto obrigatória.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-pneu-1',
          popover: {
            title: '2. Pneu Dianteiro Esquerdo',
            description: 'Avalie a condição do pneu dianteiro esquerdo. Verifique o estado da borracha, profundidade dos sulcos e pressão. Tire uma foto obrigatória.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-pneu-2',
          popover: {
            title: '3. Pneu Traseiro Direito',
            description: 'Avalie a condição do pneu traseiro direito. Verifique o estado da borracha, profundidade dos sulcos e pressão. Tire uma foto obrigatória.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-pneu-3',
          popover: {
            title: '4. Pneu Traseiro Esquerdo',
            description: 'Avalie a condição do pneu traseiro esquerdo. Verifique o estado da borracha, profundidade dos sulcos e pressão. Tire uma foto obrigatória.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-pneu-4',
          popover: {
            title: '5. Pneu Estepe',
            description: 'Avalie a condição do pneu estepe. Verifique se está em bom estado e com pressão adequada. Tire uma foto obrigatória.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-finalizar',
          popover: {
            title: '6. Finalizar Checklist',
            description: 'Após avaliar todos os 5 pneus e tirar as fotos, clique em "Finalizar e Salvar Checklist" para enviar todas as informações ao servidor.',
            side: 'top',
            align: 'center'
          }
        },
        {
          popover: {
            title: 'Tutorial Concluído!',
            description: 'Agora inspecione todos os pneus e finalize o checklist completo do veículo!',
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
