import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AlertController } from '@ionic/angular';

interface Checklist {
  id: number;
  placa: string;
  km_inicial: number;
  nivel_combustivel: string;
  data_realizacao: string;
}

@Component({
  selector: 'app-historico',
  templateUrl: './historico.page.html',
  styleUrls: ['./historico.page.scss'],
  standalone: false,
})
export class HistoricoPage implements OnInit {
  checklists: Checklist[] = [];
  carregando = false;
  erro = '';

  constructor(
    private router: Router,
    private apiService: ApiService,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.carregarChecklists();
  }

  carregarChecklists() {
    this.carregando = true;
    this.erro = '';

    this.apiService.buscarTodos(100).subscribe({
      next: (response) => {
        this.checklists = response;
        this.carregando = false;
        console.log('Checklists carregados:', this.checklists);
      },
      error: (error) => {
        console.error('Erro ao carregar checklists:', error);
        this.erro = 'Erro ao carregar histórico. Verifique sua conexão.';
        this.carregando = false;
      }
    });
  }

  async verDetalhes(checklist: Checklist) {
    const alert = await this.alertController.create({
      header: `Checklist - ${checklist.placa}`,
      message: `
        <strong>ID:</strong> ${checklist.id}<br>
        <strong>Placa:</strong> ${checklist.placa}<br>
        <strong>KM Inicial:</strong> ${checklist.km_inicial}<br>
        <strong>Combustível:</strong> ${checklist.nivel_combustivel}<br>
        <strong>Data:</strong> ${this.formatarData(checklist.data_realizacao)}
      `,
      buttons: ['OK']
    });

    await alert.present();
  }

  formatarData(data: string): string {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleString('pt-BR');
  }

  buscarPorPlaca(event: any) {
    const placa = event.target.value;

    if (!placa || placa.trim() === '') {
      this.carregarChecklists();
      return;
    }

    this.carregando = true;
    this.erro = '';

    this.apiService.buscarPorPlaca(placa).subscribe({
      next: (response) => {
        this.checklists = response;
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao buscar por placa:', error);
        this.erro = 'Erro ao buscar checklist.';
        this.carregando = false;
      }
    });
  }

  voltar() {
    this.router.navigate(['/home']);
  }

  recarregar(event: any) {
    this.apiService.buscarTodos(100).subscribe({
      next: (response) => {
        this.checklists = response;
        event.target.complete();
      },
      error: (error) => {
        console.error('Erro ao recarregar:', error);
        event.target.complete();
      }
    });
  }
}
