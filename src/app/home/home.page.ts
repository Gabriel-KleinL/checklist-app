import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ChecklistDataService } from '../services/checklist-data.service';
import { ApiService } from '../services/api.service';
import { LocalStorageService } from '../services/local-storage';
import { AlertController } from '@ionic/angular';

interface InspecaoInicial {
  placa: string;
  kmInicial: number | null;
  fotoKmInicial: string | undefined;
  nivelCombustivel: string;
  fotoCombustivel: string | undefined;
  fotoPainel: string | undefined;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  inspecao: InspecaoInicial = {
    placa: '',
    kmInicial: null,
    fotoKmInicial: undefined,
    nivelCombustivel: '50%',
    fotoCombustivel: undefined,
    fotoPainel: undefined
  };

  niveisDisponiveis = ['0%', '25%', '50%', '75%', '100%'];

  constructor(
    private router: Router,
    private checklistData: ChecklistDataService,
    private apiService: ApiService,
    private localStorage: LocalStorageService,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    await this.verificarDadosSalvos();
  }

  async verificarDadosSalvos() {
    const dadosSalvos = await this.localStorage.recuperarInspecaoInicial();
    if (dadosSalvos) {
      // Restaura automaticamente os dados salvos
      this.inspecao = dadosSalvos;
      console.log('Dados da inspeção inicial restaurados automaticamente');
    }
  }

  async salvarLocalmente() {
    await this.localStorage.salvarInspecaoInicial(this.inspecao);
  }

  async tirarFoto(tipo: 'km' | 'combustivel' | 'painel') {
    try {
      const image = await Camera.getPhoto({
        quality: 30,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 400,
        height: 400
      });

      switch (tipo) {
        case 'km':
          this.inspecao.fotoKmInicial = image.dataUrl;
          break;
        case 'combustivel':
          this.inspecao.fotoCombustivel = image.dataUrl;
          break;
        case 'painel':
          this.inspecao.fotoPainel = image.dataUrl;
          break;
      }

      await this.salvarLocalmente();
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
    }
  }

  async removerFoto(tipo: 'km' | 'combustivel' | 'painel') {
    switch (tipo) {
      case 'km':
        this.inspecao.fotoKmInicial = undefined;
        break;
      case 'combustivel':
        this.inspecao.fotoCombustivel = undefined;
        break;
      case 'painel':
        this.inspecao.fotoPainel = undefined;
        break;
    }
    await this.salvarLocalmente();
  }

  validarFormulario(): boolean {
    console.log('=== VALIDAÇÃO DO FORMULÁRIO ===');
    console.log('Placa:', this.inspecao.placa);
    console.log('KM Inicial:', this.inspecao.kmInicial);
    console.log('Nível Combustível:', this.inspecao.nivelCombustivel);

    const valido = !!(
      this.inspecao.placa &&
      this.inspecao.kmInicial !== null &&
      this.inspecao.nivelCombustivel
    );

    console.log('Formulário válido:', valido);
    return valido;
  }

  async salvarInspecao() {
    console.log('=== SALVANDO INSPEÇÃO LOCALMENTE ===');
    console.log('Dados da inspeção:', this.inspecao);
    
    if (!this.validarFormulario()) {
      console.log('Formulário inválido - não salvando');
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      // Salva os dados no serviço compartilhado (apenas localmente)
      this.checklistData.setInspecaoInicial(this.inspecao);
      console.log('✅ Dados da inspeção inicial salvos localmente');

      // Navega para a próxima tela
      this.router.navigate(['/inspecao-veiculo']);
    } catch (error) {
      console.error('Erro ao salvar inspeção:', error);
      alert('Erro ao salvar os dados. Tente novamente.');
    }
  }

  async limparDadosSalvos() {
    const alert = await this.alertController.create({
      header: 'Limpar Dados',
      message: 'Deseja limpar todos os dados salvos e começar um novo checklist?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Limpar',
          handler: async () => {
            await this.localStorage.limparTodosDados();
            // Reseta o formulário
            this.inspecao = {
              placa: '',
              kmInicial: null,
              fotoKmInicial: undefined,
              nivelCombustivel: '50%',
              fotoCombustivel: undefined,
              fotoPainel: undefined
            };
            console.log('Dados limpos com sucesso');
          }
        }
      ]
    });
    await alert.present();
  }

  voltar() {
    this.router.navigate(['/']);
  }

  async mostrarErroDetalhado(mensagem: string, detalhes: string) {
    const alert = await this.alertController.create({
      header: '❌ ERRO AO SALVAR NO BANCO',
      message: `${mensagem}\n\nDetalhes:\n${detalhes}`,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        },
        {
          text: 'Copiar Erro',
          handler: () => {
            // Copia o erro para área de transferência se possível
            if (navigator.clipboard) {
              navigator.clipboard.writeText(`Erro: ${mensagem}\nDetalhes: ${detalhes}`);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async mostrarSucesso(mensagem: string) {
    const alert = await this.alertController.create({
      header: '✅ SUCESSO',
      message: mensagem,
      buttons: ['OK']
    });
    await alert.present();
  }
}
