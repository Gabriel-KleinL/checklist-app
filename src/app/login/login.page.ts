import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MicrosoftAuthService } from '../services/microsoft-auth.service';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  nome: string = '';
  senha: string = '';
  mostrarSenha: boolean = false;
  lembrarSenha: boolean = false;

  constructor(
    private authService: AuthService,
    private microsoftAuthService: MicrosoftAuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  async ngOnInit() {
    // Verifica se já está logado
    if (this.authService.isLoggedIn()) {
      // Redireciona baseado no tipo de usuário
      if (this.authService.isAdmin()) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/home']);
      }
      return;
    }

    // Carrega credenciais salvas
    await this.carregarCredenciaisSalvas();
  }

  async carregarCredenciaisSalvas() {
    try {
      const { Preferences } = await import('@capacitor/preferences');

      const { value: nomeSalvo } = await Preferences.get({ key: 'saved_nome' });
      const { value: senhaSalva } = await Preferences.get({ key: 'saved_password' });
      const { value: lembrar } = await Preferences.get({ key: 'remember_password' });

      if (lembrar === 'true' && nomeSalvo && senhaSalva) {
        this.nome = nomeSalvo;
        this.senha = senhaSalva;
        this.lembrarSenha = true;
      }
    } catch (error) {
      console.log('Erro ao carregar credenciais salvas:', error);
    }
  }

  async salvarCredenciais() {
    try {
      const { Preferences } = await import('@capacitor/preferences');

      if (this.lembrarSenha) {
        await Preferences.set({ key: 'saved_nome', value: this.nome });
        await Preferences.set({ key: 'saved_password', value: this.senha });
        await Preferences.set({ key: 'remember_password', value: 'true' });
      } else {
        await this.limparCredenciais();
      }
    } catch (error) {
      console.log('Erro ao salvar credenciais:', error);
    }
  }

  async limparCredenciais() {
    try {
      const { Preferences } = await import('@capacitor/preferences');

      await Preferences.remove({ key: 'saved_nome' });
      await Preferences.remove({ key: 'saved_password' });
      await Preferences.remove({ key: 'remember_password' });
    } catch (error) {
      console.log('Erro ao limpar credenciais:', error);
    }
  }

  toggleMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  async login() {
    // Validação básica - apenas nome é obrigatório
    if (!this.nome) {
      await this.mostrarAlerta('Erro', 'Por favor, preencha o nome de usuário.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Autenticando...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.login(this.nome, this.senha).subscribe({
      next: async (response) => {
        await loading.dismiss();

        // Verifica se o usuário precisa criar senha
        if (response.precisa_criar_senha && response.usuario) {
          await this.mostrarModalCriarSenha(response.usuario);
          return;
        }

        if (response.sucesso) {
          console.log('Login bem-sucedido!');

          // Salva ou limpa credenciais baseado na preferência
          await this.salvarCredenciais();

          // Redireciona baseado no tipo de usuário
          if (response.usuario?.tipo_usuario === 'admin') {
            console.log('Redirecionando para tela de admin...');
            this.router.navigate(['/admin']);
          } else {
            console.log('Redirecionando para tela de checklist...');
            this.router.navigate(['/home']);
          }
        } else {
          await this.mostrarAlerta('Erro de Login', response.mensagem || 'Nome de usuário ou senha inválidos.');
        }
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Erro no login:', error);
        console.error('Status:', error.status);
        console.error('Error object:', error.error);
        console.error('Error text:', error.error?.text);
        console.error('Response type:', typeof error.error);
        console.error('Full error response:', JSON.stringify(error.error));

        let mensagemErro = 'Não foi possível conectar ao servidor. Verifique sua conexão.';

        // Tenta pegar a mensagem do erro retornado pela API
        if (error.error?.mensagem) {
          mensagemErro = error.error.mensagem;
        } else if (error.status === 401) {
          // Erro 401 - Credenciais inválidas
          mensagemErro = 'Nome de usuário ou senha inválidos.';

          // Se o erro contém uma mensagem, usa ela
          if (typeof error.error === 'object' && error.error.mensagem) {
            mensagemErro = error.error.mensagem;
          }
        } else if (error.status === 0) {
          mensagemErro = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
        } else if (error.status === 404) {
          mensagemErro = 'Servidor não encontrado. Verifique a URL da API.';
        } else if (error.status === 200) {
          mensagemErro = 'Erro ao processar resposta do servidor. Corpo da resposta: ' + JSON.stringify(error.error);
        }

        await this.mostrarAlerta('Erro', mensagemErro);
      }
    });
  }

  async mostrarAlerta(titulo: string, mensagem: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensagem,
      buttons: ['OK']
    });
    await alert.present();
  }

  validarFormulario(): boolean {
    return !!(this.nome && this.nome.length > 0);
  }

  async mostrarModalCriarSenha(usuario: any) {
    const alert = await this.alertController.create({
      header: 'Criar Senha',
      message: `Olá, ${usuario.nome}! Você precisa criar uma senha para acessar o sistema.`,
      inputs: [
        {
          name: 'novaSenha',
          type: 'password',
          placeholder: 'Digite sua nova senha',
          attributes: {
            minlength: 4
          }
        },
        {
          name: 'confirmarSenha',
          type: 'password',
          placeholder: 'Confirme sua senha',
          attributes: {
            minlength: 4
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Criar Senha',
          handler: async (data) => {
            // Valida as senhas
            if (!data.novaSenha || data.novaSenha.length < 4) {
              await this.mostrarAlerta('Erro', 'A senha deve ter no mínimo 4 caracteres.');
              return false;
            }

            if (data.novaSenha !== data.confirmarSenha) {
              await this.mostrarAlerta('Erro', 'As senhas não coincidem.');
              return false;
            }

            // Chama o serviço para definir a senha
            const loading = await this.loadingController.create({
              message: 'Criando senha...',
              spinner: 'crescent'
            });
            await loading.present();

            this.authService.definirSenha(usuario.id, data.novaSenha).subscribe({
              next: async (response) => {
                await loading.dismiss();

                if (response.sucesso) {
                  await this.mostrarAlerta('Sucesso', response.mensagem);
                  // Limpa o campo de senha para o usuário fazer login novamente
                  this.senha = '';
                } else {
                  await this.mostrarAlerta('Erro', response.mensagem);
                }
              },
              error: async (error) => {
                await loading.dismiss();
                console.error('Erro ao criar senha:', error);
                await this.mostrarAlerta('Erro', 'Não foi possível criar a senha. Tente novamente.');
              }
            });

            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  async loginComMicrosoft() {
    const loading = await this.loadingController.create({
      message: 'Conectando com Microsoft...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const result = await this.microsoftAuthService.login();

      await loading.dismiss();

      if (result.success && result.user) {
        // Login bem-sucedido com Microsoft
        console.log('Usuário Microsoft:', result.user);

        // Aqui você pode:
        // 1. Salvar os dados do usuário no seu backend
        // 2. Criar uma sessão local
        // 3. Redirecionar para a home ou admin

        await this.mostrarAlerta(
          'Bem-vindo!',
          `Login realizado com sucesso! Olá, ${result.user.name}`
        );

        // Redireciona para home (ajuste conforme necessário)
        this.router.navigate(['/home']);
      } else {
        await this.mostrarAlerta(
          'Erro no Login',
          result.error || 'Não foi possível fazer login com Microsoft'
        );
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Erro no login Microsoft:', error);
      await this.mostrarAlerta(
        'Erro',
        'Ocorreu um erro ao tentar fazer login com Microsoft'
      );
    }
  }
}
