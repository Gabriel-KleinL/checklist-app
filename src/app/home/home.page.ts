import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChecklistDataService } from '../services/checklist-data.service';
import { ApiService } from '../services/api.service';
import { LocalStorageService } from '../services/local-storage';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  constructor(
    private router: Router,
    private checklistData: ChecklistDataService,
    private apiService: ApiService,
    private localStorage: LocalStorageService,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    await this.verificarDadosPendentes();
  }

  async verificarDadosPendentes() {
    const temDados = await this.localStorage.temDadosSalvos();
    if (temDados) {
      const alert = await this.alertController.create({
        header: 'Dados Salvos Encontrados',
        message: 'Encontramos dados de um checklist não finalizado. Deseja continuar de onde parou?',
        buttons: [
          {
            text: 'Começar Novo',
            role: 'cancel',
            handler: async () => {
              await this.localStorage.limparTodosDados();
              console.log('Dados antigos limpos');
            }
          },
          {
            text: 'Continuar',
            handler: () => {
              // Navega para a inspeção inicial que vai carregar os dados salvos
              this.iniciarChecklist();
            }
          }
        ]
      });

      await alert.present();
    }
  }

  iniciarChecklist() {
    // Navega para a primeira tela do checklist
    this.router.navigate(['/inspecao-inicial']);
  }

  voltar() {
    this.router.navigate(['/admin']);
  }

}
