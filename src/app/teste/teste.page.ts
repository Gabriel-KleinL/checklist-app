import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ChecklistDataService, ChecklistCompleto } from '../services/checklist-data.service';

@Component({
  selector: 'app-teste',
  templateUrl: './teste.page.html',
  styleUrls: ['./teste.page.scss'],
  standalone: false,
})
export class TestePage implements OnInit {

  dadosEnviados: any = null;
  dadosTransformados: any = null;
  checklistCompleto: ChecklistCompleto = {};
  resultado: any = null;
  erro: string = '';

  constructor(
    private apiService: ApiService,
    private checklistData: ChecklistDataService
  ) { }

  ngOnInit() {
    this.carregarDadosExemplo();
  }

  carregarDadosExemplo() {
    // Simula dados de exemplo como se fossem coletados pelo app
    this.checklistCompleto = {
      inspecaoInicial: {
        placa: 'ABC1234',
        kmInicial: 50000,
        nivelCombustivel: '75%',
        fotoKmInicial: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
        fotoCombustivel: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
        fotoPainel: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'
      },
      inspecaoVeiculo: {
        motor: [
          { nome: 'Água Radiador', valor: 'bom', foto: '' },
          { nome: 'Água Limpador Parabrisa', valor: 'ruim', foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' },
          { nome: 'Fluido de Freio', valor: 'bom', foto: '' },
          { nome: 'Nível de Óleo', valor: 'bom', foto: '' },
          { nome: 'Tampa do Reservatório de Óleo', valor: 'ruim', foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' },
          { nome: 'Tampa do Radiador', valor: 'bom', foto: '' }
        ],
        limpeza: [
          { nome: 'Limpeza Interna', valor: 'satisfatoria', foto: '' },
          { nome: 'Limpeza Externa', valor: 'otimo', foto: '' }
        ]
      },
      fotosVeiculo: [
        { tipo: 'Foto Frontal', icone: 'arrow-up', foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' },
        { tipo: 'Foto Traseira', icone: 'arrow-down', foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' },
        { tipo: 'Foto Lateral Direita', icone: 'arrow-forward', foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' },
        { tipo: 'Foto Lateral Esquerda', icone: 'arrow-back', foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' }
      ],
      pneus: [
        { nome: 'Dianteira Direita', posicao: 'dianteira-direita', valor: 'bom', foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' },
        { nome: 'Dianteira Esquerda', posicao: 'dianteira-esquerda', valor: 'bom', foto: '' },
        { nome: 'Traseira Direita', posicao: 'traseira-direita', valor: 'ruim', foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' },
        { nome: 'Traseira Esquerda', posicao: 'traseira-esquerda', valor: 'bom', foto: '' },
        { nome: 'Estepe', posicao: 'estepe', valor: 'bom', foto: '' }
      ]
    };
  }

  transformarDados() {
    console.log('=== TRANSFORMAÇÃO DE DADOS ===');
    console.log('Checklist completo:', this.checklistCompleto);
    
    // Usa o método público
    this.dadosTransformados = this.apiService.transformarParaApiFormat(this.checklistCompleto);
    
    console.log('Dados transformados:', this.dadosTransformados);
  }

  async enviarDados() {
    this.erro = '';
    this.resultado = null;
    
    try {
      console.log('=== ENVIANDO DADOS ===');
      console.log('Dados que serão enviados:', this.dadosTransformados);
      
      const observable = await this.apiService.salvarChecklistCompleto(this.checklistCompleto);
      observable.subscribe({
        next: (response) => {
          console.log('Resposta do servidor:', response);
          this.resultado = response;
        },
        error: (error) => {
          console.error('Erro ao enviar:', error);
          this.erro = error.error?.erro || 'Erro desconhecido';
        }
      });
    } catch (error) {
      console.error('Erro:', error);
      this.erro = 'Erro ao processar dados';
    }
  }

  testarConexao() {
    console.log('=== TESTANDO CONEXÃO ===');
    this.apiService.testarConexaoSimples().subscribe({
      next: (response) => {
        console.log('Teste de conexão bem-sucedido:', response);
        this.resultado = response;
        this.erro = '';
      },
      error: (error) => {
        console.error('Erro no teste de conexão:', error);
        this.erro = `Erro: ${error.message || error.statusText || 'Erro desconhecido'}`;
        this.resultado = null;
      }
    });
  }

  limparDados() {
    this.dadosTransformados = null;
    this.resultado = null;
    this.erro = '';
  }

  voltar() {
    window.history.back();
  }
}