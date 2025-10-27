import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ChecklistDataService } from '../services/checklist-data.service';
import { LocalStorageService } from '../services/local-storage';

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
export class FotosVeiculoPage implements OnInit {

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

  constructor(
    private router: Router,
    private checklistData: ChecklistDataService,
    private localStorage: LocalStorageService
  ) { }

  async ngOnInit() {
    await this.recuperarDadosSalvos();
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
        quality: 30,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 400,
        height: 400
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
    return true; // Fotos não são mais obrigatórias
  }

  async salvarFotos() {
    // Fotos não são mais obrigatórias, permite continuar sem validação

    // Salva os dados no serviço compartilhado
    this.checklistData.setFotosVeiculo(this.fotos);
    console.log('Fotos do veículo salvas');

    // Navega para a próxima tela (pneus)
    this.router.navigate(['/pneus']);
  }

  voltar() {
    this.router.navigate(['/inspecao-veiculo']);
  }

}
