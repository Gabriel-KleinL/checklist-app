import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ChecklistDataService } from '../services/checklist-data.service';
import { ApiService } from '../services/api.service';
import { AlertController, ToastController } from '@ionic/angular';
import { LocalStorageService } from '../services/local-storage';
import { environment } from '../../environments/environment';

interface Pneu {
  nome: string;
  posicao: string;
  valor: 'bom' | 'ruim' | null;
  foto?: string;
}

@Component({
  selector: 'app-pneus',
  templateUrl: './pneus.page.html',
  styleUrls: ['./pneus.page.scss'],
  standalone: false,
})
export class PneusPage implements OnInit {

  pneus: Pneu[] = [
    { nome: 'Dianteira Direita', posicao: 'dianteira-direita', valor: null },
    { nome: 'Dianteira Esquerda', posicao: 'dianteira-esquerda', valor: null },
    { nome: 'Traseira Direita', posicao: 'traseira-direita', valor: null },
    { nome: 'Traseira Esquerda', posicao: 'traseira-esquerda', valor: null },
    { nome: 'Estepe', posicao: 'estepe', valor: null }
  ];

  opcoesPneu = ['bom', 'ruim'];
  salvando = false;

  constructor(
    private router: Router,
    private checklistData: ChecklistDataService,
    private apiService: ApiService,
    private alertController: AlertController,
    private toastController: ToastController,
    private localStorage: LocalStorageService
  ) { }

  async ngOnInit() {
    await this.recuperarDadosSalvos();
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
        quality: 30,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 400,
        height: 400
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

  validarFormulario(): boolean {
    return this.pneus.every(pneu => {
      // Todos devem ter valor selecionado (fotos não são mais obrigatórias)
      return pneu.valor !== null;
    });
  }

  async finalizarChecklist() {
    if (!this.validarFormulario()) {
      alert('Por favor, avalie todos os pneus.');
      return;
    }

    try {
      this.salvando = true;

      // Salva os dados dos pneus no serviço compartilhado
      this.checklistData.setPneus(this.pneus);
      console.log('Dados dos pneus salvos');

      // Obtém todos os dados do checklist
      const checklistCompleto = this.checklistData.getChecklistCompleto();
      console.log('=== CHECKLIST COMPLETO ===');
      console.log('Dados brutos:', JSON.stringify(checklistCompleto, null, 2));

      // Validação adicional antes de enviar
      if (!checklistCompleto.inspecaoInicial?.placa) {
        throw new Error('Placa não informada no checklist');
      }

      // Salva os dados na API
      console.log('Enviando para API:', environment.apiUrl);
      await this.salvarNaApi(checklistCompleto);

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

  private async salvarNaApi(checklistCompleto: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('=== INICIANDO SALVAMENTO NA API ===');
        console.log('URL da API:', environment.apiUrl);
        console.log('Timestamp:', new Date().toISOString());

        const observable = await this.apiService.salvarChecklistCompleto(checklistCompleto);
        observable.subscribe({
          next: (response) => {
            console.log('=== SUCESSO AO SALVAR NA API ===');
            console.log('Resposta:', response);
            resolve();
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

  async mostrarErro(error: any) {
    // Extrai informações detalhadas do erro
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
}
