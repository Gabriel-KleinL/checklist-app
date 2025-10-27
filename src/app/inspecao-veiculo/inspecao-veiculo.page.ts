import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ChecklistDataService } from '../services/checklist-data.service';
import { LocalStorageService } from '../services/local-storage';

interface ItemMotor {
  nome: string;
  valor: 'bom' | 'ruim' | null;
  foto?: string;
}

interface ItemLimpeza {
  nome: string;
  valor: 'pessima' | 'ruim' | 'satisfatoria' | 'otimo' | null;
  foto?: string;
}

interface InspecaoVeiculo {
  motor: ItemMotor[];
  limpeza: ItemLimpeza[];
}

@Component({
  selector: 'app-inspecao-veiculo',
  templateUrl: './inspecao-veiculo.page.html',
  styleUrls: ['./inspecao-veiculo.page.scss'],
  standalone: false,
})
export class InspecaoVeiculoPage implements OnInit {

  inspecao: InspecaoVeiculo = {
    motor: [
      { nome: 'Água Radiador', valor: null },
      { nome: 'Água Limpador Parabrisa', valor: null },
      { nome: 'Fluido de Freio', valor: null },
      { nome: 'Nível de Óleo', valor: null },
      { nome: 'Tampa do Reservatório de Óleo', valor: null },
      { nome: 'Tampa do Radiador', valor: null }
    ],
    limpeza: [
      { nome: 'Limpeza Interna', valor: null },
      { nome: 'Limpeza Externa', valor: null }
    ]
  };

  opcoesMotor = ['bom', 'ruim'];
  opcoesLimpeza = ['pessima', 'ruim', 'satisfatoria', 'otimo'];

  constructor(
    private router: Router,
    private checklistData: ChecklistDataService,
    private localStorage: LocalStorageService
  ) { }

  async ngOnInit() {
    await this.recuperarDadosSalvos();
  }

  async recuperarDadosSalvos() {
    const dadosSalvos = await this.localStorage.recuperarInspecaoVeiculo();
    if (dadosSalvos) {
      this.inspecao = dadosSalvos;
    }
  }

  async salvarLocalmente() {
    await this.localStorage.salvarInspecaoVeiculo(this.inspecao);
  }

  validarFormulario(): boolean {
    // Valida se todos os campos foram preenchidos (fotos não são mais obrigatórias)
    const motorValido = this.inspecao.motor.every(item => {
      return item.valor !== null;
    });

    const limpezaValida = this.inspecao.limpeza.every(item => {
      return item.valor !== null;
    });

    return motorValido && limpezaValida;
  }

  precisaFotoMotor(item: ItemMotor): boolean {
    return item.valor === 'ruim';
  }

  precisaFotoLimpeza(item: ItemLimpeza): boolean {
    return item.valor === 'ruim' || item.valor === 'pessima';
  }

  async tirarFotoMotor(index: number) {
    try {
      const image = await Camera.getPhoto({
        quality: 30,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 400,
        height: 400
      });

      this.inspecao.motor[index].foto = image.dataUrl;
      await this.salvarLocalmente();
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
    }
  }

  async tirarFotoLimpeza(index: number) {
    try {
      const image = await Camera.getPhoto({
        quality: 30,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 400,
        height: 400
      });

      this.inspecao.limpeza[index].foto = image.dataUrl;
      await this.salvarLocalmente();
    } catch (error) {
      console.log('Foto cancelada ou erro:', error);
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

  async onValorMotorChange(item: ItemMotor) {
    // Se mudou para "bom", remove a foto
    if (item.valor === 'bom') {
      item.foto = undefined;
    }
    await this.salvarLocalmente();
  }

  async onValorLimpezaChange(item: ItemLimpeza) {
    // Se mudou para "satisfatória" ou "ótimo", remove a foto
    if (item.valor === 'satisfatoria' || item.valor === 'otimo') {
      item.foto = undefined;
    }
    await this.salvarLocalmente();
  }

  getCorStatus(valor: string): string {
    switch (valor) {
      case 'bom':
      case 'otimo':
        return 'success';
      case 'satisfatoria':
        return 'warning';
      case 'ruim':
        return 'danger';
      case 'pessima':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getLabelLimpeza(valor: string): string {
    const labels: { [key: string]: string } = {
      'pessima': 'Péssima',
      'ruim': 'Ruim',
      'satisfatoria': 'Satisfatória',
      'otimo': 'Ótimo'
    };
    return labels[valor] || valor;
  }

  async salvarInspecao() {
    if (!this.validarFormulario()) {
      alert('Por favor, preencha todos os campos da inspeção.');
      return;
    }

    // Salva os dados no serviço compartilhado
    this.checklistData.setInspecaoVeiculo(this.inspecao);
    console.log('Dados da inspeção do veículo salvos');

    // Navega para a próxima tela
    this.router.navigate(['/fotos-veiculo']);
  }

  voltar() {
    this.router.navigate(['/home']);
  }

}
