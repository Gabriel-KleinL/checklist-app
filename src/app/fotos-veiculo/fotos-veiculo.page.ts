import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ChecklistDataService } from '../services/checklist-data.service';
import { LocalStorageService } from '../services/local-storage';
import { AuthService } from '../services/auth.service';
import { TempoTelasService } from '../services/tempo-telas.service';
import { ApiService } from '../services/api.service';
import { driver } from 'driver.js';

interface FotoVeiculo {
  tipo: string;
  icone: string;
  foto?: string;
  fotoOriginal?: string;
}

@Component({
  selector: 'app-fotos-veiculo',
  templateUrl: './fotos-veiculo.page.html',
  styleUrls: ['./fotos-veiculo.page.scss'],
  standalone: false,
})
export class FotosVeiculoPage implements OnInit, OnDestroy {

  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  fotos: FotoVeiculo[] = [
    { tipo: 'Foto Frontal', icone: 'arrow-up', foto: undefined },
    { tipo: 'Foto Traseira', icone: 'arrow-down', foto: undefined },
    { tipo: 'Foto Lateral Direita', icone: 'arrow-forward', foto: undefined },
    { tipo: 'Foto Lateral Esquerda', icone: 'arrow-back', foto: undefined }
  ];

  // Variáveis para marcação de fotos
  mostrarMarcacao = false;
  fotoAtualIndex = -1;
  imagemCarregada: HTMLImageElement | null = null;
  desenhando = false;
  corMarcacao = '#ff0000';
  espessuraLinha = 10;

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
    this.tempoTelasService.iniciarTela('fotos-veiculo');

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
    const dadosSalvos = await this.localStorage.recuperarFotosVeiculo();
    if (dadosSalvos) {
      this.fotos = dadosSalvos;
    }
  }

  async salvarLocalmente() {
    await this.localStorage.salvarFotosVeiculo(this.fotos);
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

      this.fotos[index].foto = image.dataUrl;
      this.fotos[index].fotoOriginal = image.dataUrl;
      await this.salvarLocalmente();
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
    }
  }

  async removerFoto(index: number) {
    this.fotos[index].foto = undefined;
    this.fotos[index].fotoOriginal = undefined;
    await this.salvarLocalmente();
  }

  abrirMarcacao(index: number) {
    this.fotoAtualIndex = index;
    this.mostrarMarcacao = true;

    // Aguarda o próximo ciclo para garantir que o canvas existe
    setTimeout(() => {
      this.carregarImagemNoCanvas();
    }, 100);
  }

  carregarImagemNoCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      this.imagemCarregada = img;

      // Ajusta o tamanho do canvas para a imagem
      canvas.width = img.width;
      canvas.height = img.height;

      // Desenha a imagem no canvas
      ctx.drawImage(img, 0, 0);

      // Se já houver marcações, desenha a foto atual
      if (this.fotos[this.fotoAtualIndex].foto !== this.fotos[this.fotoAtualIndex].fotoOriginal) {
        const imgMarcada = new Image();
        imgMarcada.onload = () => {
          ctx.drawImage(imgMarcada, 0, 0);
        };
        imgMarcada.src = this.fotos[this.fotoAtualIndex].foto!;
      }
    };
    img.src = this.fotos[this.fotoAtualIndex].fotoOriginal!;
  }

  iniciarDesenho(event: any) {
    this.desenhando = true;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

    // Ajusta coordenadas para a escala real do canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo(x * scaleX, y * scaleY);
    ctx.strokeStyle = this.corMarcacao;
    ctx.lineWidth = this.espessuraLinha;
    ctx.lineCap = 'round';
  }

  desenhar(event: any) {
    if (!this.desenhando) return;

    event.preventDefault();
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

    // Ajusta coordenadas para a escala real do canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo(x * scaleX, y * scaleY);
    ctx.stroke();
  }

  pararDesenho() {
    this.desenhando = false;
  }

  limparMarcacoes() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx || !this.imagemCarregada) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.imagemCarregada, 0, 0);
  }

  async salvarMarcacao() {
    const canvas = this.canvasRef.nativeElement;
    this.fotos[this.fotoAtualIndex].foto = canvas.toDataURL('image/jpeg', 0.9);
    this.fecharMarcacao();
    await this.salvarLocalmente();
  }

  fecharMarcacao() {
    this.mostrarMarcacao = false;
    this.fotoAtualIndex = -1;
    this.imagemCarregada = null;
    this.desenhando = false;
  }

  validarFormulario(): boolean {
    // Valida se todas as fotos foram tiradas
    return this.fotos.every(foto => foto.foto !== undefined);
  }

  async salvarFotos() {
    if (!this.validarFormulario()) {
      alert('Por favor, tire todas as fotos do veículo antes de continuar.');
      return;
    }

    const usuarioId = this.authService.currentUserValue?.id;
    console.log('[FotosVeiculo] 🔍 Buscando inspecaoId para salvar fotos...');
    const inspecaoId = await this.checklistData.getInspecaoId();
    console.log('[FotosVeiculo] InspecaoId recebido:', inspecaoId, 'Tipo:', typeof inspecaoId);

    if (!inspecaoId) {
      console.error('[FotosVeiculo] ❌ ERRO: ID da inspeção não encontrado!');
      console.error('[FotosVeiculo] UsuarioId:', usuarioId);
      alert('Erro: ID da inspeção não encontrado. Por favor, reinicie o processo.');
      return;
    }
    
    console.log('[FotosVeiculo] ✅ Prosseguindo com inspecaoId:', inspecaoId);

    try {
      // Mapeia os tipos de fotos
      const mapaTiposFotos: any = {
        'Foto Frontal': 'FRONTAL',
        'Foto Traseira': 'TRASEIRA',
        'Foto Lateral Direita': 'LATERAL_DIREITA',
        'Foto Lateral Esquerda': 'LATERAL_ESQUERDA'
      };

      // Monta array de fotos para enviar à API
      const fotosArray = this.fotos
        .filter(f => f.foto)
        .map(f => ({
          tipo: mapaTiposFotos[f.tipo],
          foto: f.foto
        }));

      // Atualiza a inspeção na API com as fotos
      console.log('[Inspeção] Atualizando inspeção com fotos...');
      await this.apiService.atualizarInspecao(inspecaoId, {
        fotos: fotosArray
      }).toPromise();

      console.log('[Inspeção] Fotos atualizadas com sucesso');

      // Salva os dados no serviço compartilhado
      this.checklistData.setFotosVeiculo(this.fotos);

      // Finaliza e salva o tempo de tela com o inspecao_id
      const observable = this.tempoTelasService.finalizarTela(inspecaoId, usuarioId);
      if (observable) {
        try {
          await observable.toPromise();
          console.log('[Tempo] Tempo da tela fotos-veiculo salvo com sucesso com inspecao_id:', inspecaoId);
        } catch (error) {
          console.error('[Tempo] Erro ao salvar tempo:', error);
        }
      }

      // Navega para a próxima tela (pneus)
      this.router.navigate(['/pneus']);
    } catch (error) {
      console.error('[Inspeção] Erro ao atualizar fotos:', error);
      alert('Erro ao salvar fotos. Por favor, tente novamente.');
    }
  }

  voltar() {
    this.router.navigate(['/inspecao-veiculo']);
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
          element: '#tour-foto-0',
          popover: {
            title: '1. Foto Frontal',
            description: 'Tire uma foto da frente do veículo. Posicione-se de frente e capture todo o para-choque, capô e faróis. A placa deve estar visível.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-foto-1',
          popover: {
            title: '2. Foto Traseira',
            description: 'Tire uma foto da parte traseira do veículo. Capture o porta-malas, para-choque traseiro e lanternas. A placa traseira deve estar visível.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-foto-2',
          popover: {
            title: '3. Foto Lateral Direita',
            description: 'Tire uma foto do lado direito do veículo. Capture todas as portas, rodas e espelhos do lado direito.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-foto-3',
          popover: {
            title: '4. Foto Lateral Esquerda',
            description: 'Tire uma foto do lado esquerdo do veículo. Capture todas as portas, rodas e espelhos do lado esquerdo.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-grid-fotos',
          popover: {
            title: 'Recurso de Marcação',
            description: 'Depois de tirar uma foto, você pode usar o botão "Marcar Foto" para destacar amassados, arranhões ou outros problemas desenhando sobre a imagem.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#tour-salvar-fotos',
          popover: {
            title: '5. Salvar e Continuar',
            description: 'Após tirar todas as 4 fotos obrigatórias, clique em "Salvar Fotos" para continuar para a próxima etapa.',
            side: 'top',
            align: 'center'
          }
        },
        {
          popover: {
            title: 'Tutorial Concluído!',
            description: 'Agora tire as 4 fotos do veículo para continuar o checklist!',
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
