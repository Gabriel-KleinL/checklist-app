import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-test',
  templateUrl: './test.page.html',
  styleUrls: ['./test.page.scss'],
  standalone: false,
})
export class TestPage implements OnInit {
  resultados: string[] = [];
  carregando = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router
  ) { }

  ngOnInit() {
    this.adicionarResultado('Página de testes carregada');
  }

  adicionarResultado(mensagem: string, tipo: 'info' | 'success' | 'error' = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefixo = tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️';
    this.resultados.unshift(`[${timestamp}] ${prefixo} ${mensagem}`);

    // Mantém apenas os últimos 50 resultados
    if (this.resultados.length > 50) {
      this.resultados = this.resultados.slice(0, 50);
    }
  }

  limparResultados() {
    this.resultados = [];
    this.adicionarResultado('Resultados limpos');
  }

  // ============================================
  // TESTES DE CONEXÃO
  // ============================================

  async testarConexaoSimples() {
    this.carregando = true;
    this.adicionarResultado('Testando conexão simples...');

    this.apiService.testarConexaoSimples().subscribe({
      next: (response) => {
        this.adicionarResultado(`Conexão OK: ${JSON.stringify(response)}`, 'success');
        this.carregando = false;
      },
      error: (error) => {
        this.adicionarResultado(`Erro na conexão: ${error.message}`, 'error');
        this.carregando = false;
      }
    });
  }

  async testarConexao() {
    this.carregando = true;
    this.adicionarResultado('Testando conexão com banco...');

    this.apiService.testarConexao().subscribe({
      next: (response) => {
        this.adicionarResultado(`Conexão com banco OK: ${JSON.stringify(response)}`, 'success');
        this.carregando = false;
      },
      error: (error) => {
        this.adicionarResultado(`Erro na conexão com banco: ${error.message}`, 'error');
        this.carregando = false;
      }
    });
  }

  // ============================================
  // TESTES DE AUTENTICAÇÃO
  // ============================================

  async testarUsuarioAtual() {
    const usuario = this.authService.currentUserValue;
    if (usuario) {
      this.adicionarResultado(`Usuário logado: ${usuario.nome} (ID: ${usuario.id}) - Tipo: ${usuario.tipo_usuario}`, 'success');
    } else {
      this.adicionarResultado('Nenhum usuário logado', 'error');
    }
  }

  async testarLogin() {
    const alert = await this.alertController.create({
      header: 'Testar Login',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email',
          value: 'admin@example.com'
        },
        {
          name: 'senha',
          type: 'password',
          placeholder: 'Senha',
          value: '123456'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Login',
          handler: (data) => {
            this.carregando = true;
            this.adicionarResultado(`Tentando login com ${data.email}...`);

            this.authService.login(data.email, data.senha).subscribe({
              next: (response) => {
                this.adicionarResultado(`Login OK: ${JSON.stringify(response)}`, 'success');
                this.carregando = false;
              },
              error: (error) => {
                this.adicionarResultado(`Erro no login: ${error.message}`, 'error');
                this.carregando = false;
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // ============================================
  // TESTES DE CHECKLISTS SIMPLES
  // ============================================

  async buscarChecklists() {
    this.carregando = true;
    this.adicionarResultado('Buscando checklists simples...');

    this.apiService.buscarTodos(10).subscribe({
      next: (response) => {
        this.adicionarResultado(`${response.length} checklists encontrados`, 'success');
        this.adicionarResultado(`Primeiro: ${JSON.stringify(response[0] || 'Nenhum')}`);
        this.carregando = false;
      },
      error: (error) => {
        this.adicionarResultado(`Erro ao buscar checklists: ${error.message}`, 'error');
        this.carregando = false;
      }
    });
  }

  async buscarChecklistPorId() {
    const alert = await this.alertController.create({
      header: 'Buscar Checklist por ID',
      inputs: [
        {
          name: 'id',
          type: 'number',
          placeholder: 'ID do checklist',
          value: '1'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Buscar',
          handler: (data) => {
            this.carregando = true;
            this.adicionarResultado(`Buscando checklist ID ${data.id}...`);

            this.apiService.buscarPorId(data.id).subscribe({
              next: (response) => {
                this.adicionarResultado(`Checklist encontrado: ${JSON.stringify(response)}`, 'success');
                this.carregando = false;
              },
              error: (error) => {
                this.adicionarResultado(`Erro ao buscar checklist: ${error.message}`, 'error');
                this.carregando = false;
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // ============================================
  // TESTES DE CHECKLISTS COMPLETOS
  // ============================================

  async buscarChecklistsCompletos() {
    this.carregando = true;
    this.adicionarResultado('Buscando checklists completos...');

    this.apiService.buscarChecklistsCompletos(10).subscribe({
      next: (response) => {
        this.adicionarResultado(`${response.length} checklists completos encontrados`, 'success');
        this.adicionarResultado(`Primeiro: ${JSON.stringify(response[0] || 'Nenhum')}`);
        this.carregando = false;
      },
      error: (error) => {
        this.adicionarResultado(`Erro ao buscar checklists completos: ${error.message}`, 'error');
        this.carregando = false;
      }
    });
  }

  async criarChecklistTeste() {
    const usuarioId = this.authService.currentUserValue?.id;

    if (!usuarioId) {
      this.adicionarResultado('Usuário não logado. Faça login primeiro.', 'error');
      return;
    }

    const checklistTeste = {
      placa: 'TST1234',
      km_inicial: 1000,
      nivel_combustivel: '50%' as const,
      foto_painel: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      observacao_painel: 'Teste automático',
      usuario_id: usuarioId,
      itens_inspecao: [],
      itens_pneus: []
    };

    this.carregando = true;
    this.adicionarResultado('Criando checklist de teste...');

    this.apiService.criarInspecaoInicial(checklistTeste).subscribe({
      next: (response) => {
        this.adicionarResultado(`Checklist criado com sucesso! ID: ${response.id}`, 'success');
        this.carregando = false;
      },
      error: (error) => {
        this.adicionarResultado(`Erro ao criar checklist: ${error.message}`, 'error');
        this.carregando = false;
      }
    });
  }

  // ============================================
  // TESTES DE ANOMALIAS
  // ============================================

  async buscarAnomalias() {
    this.carregando = true;
    this.adicionarResultado('Buscando anomalias ativas...');

    this.apiService.buscarAnomalias('ativas').subscribe({
      next: (response) => {
        this.adicionarResultado(`${response.length} veículos com anomalias`, 'success');
        this.adicionarResultado(`Dados: ${JSON.stringify(response.slice(0, 2))}`);
        this.carregando = false;
      },
      error: (error) => {
        this.adicionarResultado(`Erro ao buscar anomalias: ${error.message}`, 'error');
        this.carregando = false;
      }
    });
  }

  // ============================================
  // TESTES DE PLACAS
  // ============================================

  async buscarPlacas() {
    this.carregando = true;
    this.adicionarResultado('Buscando placas cadastradas...');

    this.apiService.buscarPlacas('', 20).subscribe({
      next: (response) => {
        this.adicionarResultado(`${response.length} placas encontradas`, 'success');
        this.adicionarResultado(`Primeiras: ${response.slice(0, 5).join(', ')}`);
        this.carregando = false;
      },
      error: (error) => {
        this.adicionarResultado(`Erro ao buscar placas: ${error.message}`, 'error');
        this.carregando = false;
      }
    });
  }

  async validarPlaca() {
    const alert = await this.alertController.create({
      header: 'Validar Placa',
      inputs: [
        {
          name: 'placa',
          type: 'text',
          placeholder: 'Digite a placa',
          value: 'ABC1234'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Validar',
          handler: (data) => {
            this.carregando = true;
            this.adicionarResultado(`Validando placa ${data.placa}...`);

            this.apiService.validarPlaca(data.placa).subscribe({
              next: (response) => {
                const valida = response.dados ? 'válida' : 'inválida';
                this.adicionarResultado(`Placa ${data.placa} é ${valida}`, 'success');
                this.carregando = false;
              },
              error: (error) => {
                this.adicionarResultado(`Erro ao validar placa: ${error.message}`, 'error');
                this.carregando = false;
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // ============================================
  // NAVEGAÇÃO
  // ============================================

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }

  async mostrarToast(mensagem: string, cor: string = 'primary') {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2000,
      color: cor,
      position: 'bottom'
    });
    await toast.present();
  }
}
