import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { LocalStorageService } from '../services/local-storage';
import { AlertController } from '@ionic/angular';
import { TiposVeiculoService } from '../services/tipos-veiculo.service';
import { TipoVeiculo } from '../models/checklist.models';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  tiposVeiculo: TipoVeiculo[] = [];
  tipoVeiculoSelecionado: number | null = null;
  carregandoTipos = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private localStorage: LocalStorageService,
    private alertController: AlertController,
    private tiposVeiculoService: TiposVeiculoService
  ) {}

  async ngOnInit() {
    await this.carregarTiposVeiculo();
    await this.verificarDadosPendentes();
  }

  async carregarTiposVeiculo() {
    this.carregandoTipos = true;

    // Define tipo padrão como "Carro" (ID 1) SEMPRE
    this.tipoVeiculoSelecionado = 1;
    await this.localStorage.setItem('tipo_veiculo_id', '1');

    try {
      this.tiposVeiculo = await this.tiposVeiculoService.listarTipos().toPromise() || [];

      // Desabilitar todos os tipos exceto "Carro"
      this.tiposVeiculo = this.tiposVeiculo.map(tipo => ({
        ...tipo,
        ativo: tipo.nome.toLowerCase() === 'carro'
      }));

      // Se encontrar o Carro na lista, atualiza o ID selecionado
      const carro = this.tiposVeiculo.find(t => t.nome.toLowerCase() === 'carro');
      if (carro) {
        this.tipoVeiculoSelecionado = carro.id;
        await this.localStorage.setItem('tipo_veiculo_id', carro.id.toString());
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de veículos:', error);
      // Mesmo com erro, mantém tipo padrão 1 (Carro)
      console.log('Usando tipo padrão: Carro (ID: 1)');
    } finally {
      this.carregandoTipos = false;
    }
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

  async selecionarTipoVeiculo(tipoId: number) {
    const tipo = this.tiposVeiculo.find(t => t.id === tipoId);

    if (!tipo) {
      return;
    }

    if (!tipo.ativo) {
      // Mostra mensagem informativa para tipos desabilitados
      const alert = await this.alertController.create({
        header: 'Tipo de Veículo Indisponível',
        message: `O tipo "${tipo.nome}" está temporariamente indisponível. Apenas veículos do tipo "Carro" podem ser inspecionados no momento.`,
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Tipo ativo - pode ser selecionado
    this.tipoVeiculoSelecionado = tipoId;
    // Salva imediatamente no localStorage
    await this.localStorage.setItem('tipo_veiculo_id', tipoId.toString());
  }

  iniciarChecklist() {
    // Garante que sempre tem um tipo de veículo (padrão: 1 - Carro)
    const tipoVeiculoId = this.tipoVeiculoSelecionado || 1;

    // Salva o tipo de veículo no localStorage
    this.localStorage.setItem('tipo_veiculo_id', tipoVeiculoId.toString()).then(() => {
      // Navega para a primeira tela do checklist
      this.router.navigate(['/inspecao-inicial']);
    });
  }

  async mostrarErro(mensagem: string) {
    const alert = await this.alertController.create({
      header: 'Atenção',
      message: mensagem,
      buttons: ['OK']
    });
    await alert.present();
  }

  voltar() {
    this.router.navigate(['/admin']);
  }

}
