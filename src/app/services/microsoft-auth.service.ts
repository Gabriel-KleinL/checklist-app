import { Injectable } from '@angular/core';
import { PublicClientApplication, AuthenticationResult, Configuration } from '@azure/msal-browser';
import { Browser } from '@capacitor/browser';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class MicrosoftAuthService {
  private msalInstance: PublicClientApplication | null = null;

  // Configuração do Azure AD - Aplicativo: Frota
  private config: Configuration = {
    auth: {
      clientId: 'e111e4ae-abb6-40e3-9882-5660c7ecd7aa', // ID do aplicativo (cliente)
      authority: 'https://login.microsoftonline.com/b434e832-4219-4a9f-be8a-0cb8a0fae66c', // ID do diretório (locatário)
      redirectUri: this.platform.is('capacitor') ? 'capacitor://localhost' : 'http://localhost:8100'
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false
    }
  };

  constructor(private platform: Platform) {
    this.initializeMsal();
  }

  private async initializeMsal() {
    try {
      this.msalInstance = new PublicClientApplication(this.config);
      await this.msalInstance.initialize();
      console.log('MSAL inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar MSAL:', error);
    }
  }

  async login(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      if (!this.msalInstance) {
        await this.initializeMsal();
      }

      if (!this.msalInstance) {
        throw new Error('MSAL não foi inicializado');
      }

      // Define os escopos que você precisa
      const loginRequest = {
        scopes: ['User.Read', 'email', 'profile', 'openid']
      };

      let result: AuthenticationResult;

      if (this.platform.is('capacitor')) {
        // Para mobile (Capacitor)
        result = await this.msalInstance.loginPopup(loginRequest);
      } else {
        // Para web
        result = await this.msalInstance.loginPopup(loginRequest);
      }

      if (result && result.account) {
        console.log('Login bem-sucedido:', result.account);

        // Pega informações do usuário
        const userInfo = {
          id: result.account.localAccountId,
          name: result.account.name,
          email: result.account.username,
          accessToken: result.accessToken
        };

        return {
          success: true,
          user: userInfo
        };
      }

      return {
        success: false,
        error: 'Não foi possível obter informações do usuário'
      };

    } catch (error: any) {
      console.error('Erro no login Microsoft:', error);
      return {
        success: false,
        error: error.message || 'Erro ao fazer login com Microsoft'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.msalInstance) {
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          await this.msalInstance.logoutPopup({
            account: accounts[0]
          });
        }
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      if (!this.msalInstance) {
        return null;
      }

      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        return null;
      }

      const request = {
        scopes: ['User.Read'],
        account: accounts[0]
      };

      const response = await this.msalInstance.acquireTokenSilent(request);
      return response.accessToken;

    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }

  isLoggedIn(): boolean {
    if (!this.msalInstance) {
      return false;
    }
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0;
  }

  getCurrentUser(): any {
    if (!this.msalInstance) {
      return null;
    }
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }
}
