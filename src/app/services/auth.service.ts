import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: number;
  nome: string;
  ativo: boolean;
  tipo_usuario: 'admin' | 'comum';
  tutorial_concluido: boolean;
}

export interface LoginResponse {
  sucesso: boolean;
  mensagem: string;
  usuario?: Usuario;
  token?: string;
  precisa_criar_senha?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser: Observable<Usuario | null>;

  constructor(private http: HttpClient) {
    const usuarioSalvo = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(
      usuarioSalvo ? JSON.parse(usuarioSalvo) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  login(nome: string, senha: string): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      acao: 'login',
      nome: nome,
      senha: senha
    };

    console.log('=== LOGIN ===');
    console.log('URL:', `${this.baseUrl}/b_veicular_auth.php`);
    console.log('Dados:', { nome, senha: '***' });

    return this.http.post<LoginResponse>(`${this.baseUrl}/b_veicular_auth.php`, body, { headers })
      .pipe(
        tap(response => {
          console.log('Resposta do login:', response);
          if (response.sucesso && response.usuario) {
            // Salva o usuário no localStorage
            localStorage.setItem('currentUser', JSON.stringify(response.usuario));
            localStorage.setItem('authToken', response.token || '');
            this.currentUserSubject.next(response.usuario);
            console.log('Usuário autenticado:', response.usuario);
          }
        })
      );
  }

  async logout() {
    // Remove o usuário do localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);

    // Limpa credenciais salvas
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.remove({ key: 'saved_nome' });
      await Preferences.remove({ key: 'saved_password' });
      await Preferences.remove({ key: 'remember_password' });
    } catch (error) {
      console.log('Erro ao limpar credenciais no logout:', error);
    }

    console.log('Usuário deslogado');
  }

  isLoggedIn(): boolean {
    return this.currentUserValue !== null;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAdmin(): boolean {
    return this.currentUserValue?.tipo_usuario === 'admin';
  }

  definirSenha(usuarioId: number, novaSenha: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      acao: 'definir_senha',
      usuario_id: usuarioId,
      nova_senha: novaSenha
    };

    return this.http.post(`${this.baseUrl}/b_veicular_auth.php`, body, { headers });
  }

  // Verifica se o usuário já completou o tutorial
  tutorialConcluido(): boolean {
    const user = this.currentUserValue;
    return user ? user.tutorial_concluido : true; // Se não há usuário, retorna true para não mostrar tutorial
  }

  // Marca o tutorial como concluído no servidor
  marcarTutorialConcluido(): Observable<any> {
    const user = this.currentUserValue;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      acao: 'marcar_tutorial_concluido',
      usuario_id: user.id
    };

    return this.http.post(`${this.baseUrl}/b_veicular_auth.php`, body, { headers })
      .pipe(
        tap(response => {
          console.log('Tutorial marcado como concluído:', response);
          // Atualiza o usuário local
          if (user) {
            user.tutorial_concluido = true;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        })
      );
  }
}
