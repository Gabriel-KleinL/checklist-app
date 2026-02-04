import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ChecklistDataService } from '../services/checklist-data.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { TempoTelasService } from '../services/tempo-telas.service';
import { LocalStorageService } from '../services/local-storage';

@Component({
  selector: 'app-observacao-adicional',
  templateUrl: './observacao-adicional.page.html',
  styleUrls: ['./observacao-adicional.page.scss'],
  standalone: false,
})
export class ObservacaoAdicionalPage implements OnInit {
  observacao = '';
  salvando = false;

  private readonly STORAGE_KEY = 'checklist_observacao_adicional';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private checklistData: ChecklistDataService,
    private apiService: ApiService,
    private authService: AuthService,
    private tempoTelasService: TempoTelasService,
    private localStorage: LocalStorageService
  ) {}

  async ngOnInit() {
    this.tempoTelasService.iniciarTela('observacao-adicional');
    const salvo = await this.localStorage.getItem(this.STORAGE_KEY);
    if (salvo) {
      this.observacao = salvo;
    }
  }

  async salvarLocalmente() {
    await this.localStorage.setItem(this.STORAGE_KEY, this.observacao);
  }

  async finalizarChecklist() {
    try {
      this.salvando = true;

      const usuarioId = this.authService.currentUserValue?.id;
      const inspecaoId = await this.checklistData.getInspecaoId();

      if (!inspecaoId) {
        const alert = await this.alertController.create({
          header: 'Erro',
          message: 'ID da inspeção não encontrado. Por favor, reinicie o processo do início.',
          buttons: ['OK']
        });
        await alert.present();
        this.salvando = false;
        return;
      }

      // Salva observação adicional na API (mesmo que vazia)
      await this.apiService.atualizarInspecao(inspecaoId, {
        observacao_adicional: this.observacao || ''
      } as any).toPromise();

      // Finaliza tempo da tela
      const observable = this.tempoTelasService.finalizarTela(inspecaoId, usuarioId);
      if (observable) {
        try {
          await observable.toPromise();
        } catch (error) {
          console.error('[Tempo] Erro ao salvar tempo:', error);
        }
      }

      // Limpa dados locais
      await this.localStorage.limparTodosDados();

      const successAlert = await this.alertController.create({
        header: 'Sucesso!',
        message: 'Checklist salvo no banco de dados com sucesso!',
        buttons: [
          {
            text: 'OK',
            handler: async () => {
              await this.checklistData.limparChecklist();
              this.router.navigate(['/home']);
            }
          }
        ]
      });
      await successAlert.present();

    } catch (error) {
      console.error('Erro ao finalizar checklist:', error);
      const alert = await this.alertController.create({
        header: 'Erro',
        message: 'Erro ao salvar o checklist. Tente novamente.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      this.salvando = false;
    }
  }

  voltar() {
    this.router.navigate(['/pneus']);
  }
}
