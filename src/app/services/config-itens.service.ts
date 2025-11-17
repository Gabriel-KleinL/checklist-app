import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConfigItem {
  id: number;
  categoria: 'MOTOR' | 'ELETRICO' | 'LIMPEZA' | 'FERRAMENTA' | 'PNEU';
  nome_item: string;
  habilitado: boolean;
  usuario_id?: number;
  usuario_nome?: string;
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface AtualizarItemRequest {
  id: number;
  habilitado: boolean;
}

export interface AdicionarItemRequest {
  categoria: 'MOTOR' | 'ELETRICO' | 'LIMPEZA' | 'FERRAMENTA' | 'PNEU';
  nome_item: string;
  habilitado?: boolean;
  usuario_id?: number;
  usuario_nome?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigItensService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Busca todos os itens de configuração
   */
  buscarTodos(): Observable<ConfigItem[]> {
    return this.http.get<ConfigItem[]>(`${this.baseUrl}/b_veicular_config_itens.php?acao=todos`);
  }

  /**
   * Busca itens de uma categoria específica
   */
  buscarPorCategoria(categoria: string): Observable<ConfigItem[]> {
    return this.http.get<ConfigItem[]>(`${this.baseUrl}/b_veicular_config_itens.php?acao=categoria&categoria=${categoria}`);
  }

  /**
   * Busca apenas itens habilitados
   */
  buscarHabilitados(categoria?: string): Observable<ConfigItem[]> {
    const url = categoria
      ? `${this.baseUrl}/b_veicular_config_itens.php?acao=habilitados&categoria=${categoria}`
      : `${this.baseUrl}/b_veicular_config_itens.php?acao=habilitados`;
    return this.http.get<ConfigItem[]>(url);
  }

  /**
   * Atualiza um item específico
   */
  atualizarItem(dados: AtualizarItemRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      acao: 'atualizar_item',
      ...dados
    };

    const url = `${this.baseUrl}/b_veicular_config_itens.php`;

    console.log('=== ATUALIZANDO ITEM ===');
    console.log('URL:', url);
    console.log('Body:', body);
    console.log('Headers:', headers);

    return this.http.post(url, body, { headers });
  }

  /**
   * Atualiza múltiplos itens de uma vez
   */
  atualizarMultiplos(itens: AtualizarItemRequest[]): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      acao: 'atualizar_multiplos',
      itens: itens
    };

    return this.http.post(`${this.baseUrl}/b_veicular_config_itens.php`, body, { headers });
  }

  /**
   * Adiciona um novo item customizado
   */
  adicionarItem(dados: AdicionarItemRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      acao: 'adicionar_item',
      ...dados
    };

    return this.http.post(`${this.baseUrl}/b_veicular_config_itens.php`, body, { headers });
  }

  /**
   * Remove um item
   */
  removerItem(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = { id: id };

    return this.http.request('DELETE', `${this.baseUrl}/b_veicular_config_itens.php`, {
      headers: headers,
      body: body
    });
  }
}
