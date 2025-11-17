import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConfigItemCompleto {
  id: number;
  categoria: 'PARTE1_INTERNA' | 'PARTE2_EQUIPAMENTOS' | 'PARTE3_DIANTEIRA' | 'PARTE4_TRASEIRA' | 'PARTE5_ESPECIAL';
  nome_item: string;
  habilitado: boolean;
  usuario_id?: number;
  usuario_nome?: string;
}

export interface AtualizarItemCompletoRequest {
  id: number;
  habilitado: boolean;
}

export interface AdicionarItemCompletoRequest {
  categoria: 'PARTE1_INTERNA' | 'PARTE2_EQUIPAMENTOS' | 'PARTE3_DIANTEIRA' | 'PARTE4_TRASEIRA' | 'PARTE5_ESPECIAL';
  nome_item: string;
  habilitado?: boolean;
  usuario_id?: number;
  usuario_nome?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigItensCompletoService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Busca todos os itens de configuração do checklist completo
   */
  buscarTodos(): Observable<ConfigItemCompleto[]> {
    return this.http.get<ConfigItemCompleto[]>(`${this.baseUrl}/b_checklist_completo_config_itens.php?acao=todos`);
  }

  /**
   * Busca itens de uma categoria específica
   */
  buscarPorCategoria(categoria: string): Observable<ConfigItemCompleto[]> {
    return this.http.get<ConfigItemCompleto[]>(`${this.baseUrl}/b_checklist_completo_config_itens.php?acao=categoria&categoria=${categoria}`);
  }

  /**
   * Busca apenas itens habilitados
   */
  buscarHabilitados(categoria?: string): Observable<ConfigItemCompleto[]> {
    const url = categoria
      ? `${this.baseUrl}/b_checklist_completo_config_itens.php?acao=habilitados&categoria=${categoria}`
      : `${this.baseUrl}/b_checklist_completo_config_itens.php?acao=habilitados`;
    return this.http.get<ConfigItemCompleto[]>(url);
  }

  /**
   * Busca itens agrupados por parte
   */
  buscarPorParte(): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_checklist_completo_config_itens.php?acao=por_parte`);
  }

  /**
   * Atualiza um item específico
   */
  atualizarItem(dados: AtualizarItemCompletoRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      acao: 'atualizar_item',
      ...dados
    };

    const url = `${this.baseUrl}/b_checklist_completo_config_itens.php`;

    console.log('=== ATUALIZANDO ITEM COMPLETO ===');
    console.log('URL:', url);
    console.log('Body:', body);

    return this.http.post(url, body, { headers });
  }

  /**
   * Atualiza múltiplos itens de uma vez
   */
  atualizarMultiplos(itens: AtualizarItemCompletoRequest[]): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      acao: 'atualizar_multiplos',
      itens: itens
    };

    return this.http.post(`${this.baseUrl}/b_checklist_completo_config_itens.php`, body, { headers });
  }

  /**
   * Adiciona um novo item customizado
   */
  adicionarItem(dados: AdicionarItemCompletoRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      acao: 'adicionar_item',
      ...dados
    };

    return this.http.post(`${this.baseUrl}/b_checklist_completo_config_itens.php`, body, { headers });
  }

  /**
   * Remove um item
   */
  removerItem(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = { id: id };

    return this.http.request('DELETE', `${this.baseUrl}/b_checklist_completo_config_itens.php`, {
      headers: headers,
      body: body
    });
  }
}
