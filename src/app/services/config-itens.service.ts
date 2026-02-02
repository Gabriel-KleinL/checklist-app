import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type TipoResposta = 'conforme_nao_conforme' | 'texto' | 'numero' | 'lista_opcoes' | 'apenas_foto';

export interface ConfigItem {
  id: number;
  categoria: 'MOTOR' | 'ELETRICO' | 'LIMPEZA' | 'FERRAMENTA' | 'PNEU';
  nome_item: string;
  habilitado: boolean;
  tem_foto: boolean;
  obrigatorio: boolean;
  tipo_resposta: TipoResposta;
  opcoes_resposta?: string[] | null;
  tipo_veiculo_id?: number | null;
  usuario_id?: number;
  usuario_nome?: string;
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface AtualizarItemRequest {
  id: number;
  habilitado?: boolean;
  nome_item?: string;
  tem_foto?: boolean;
  obrigatorio?: boolean;
  tipo_resposta?: TipoResposta;
  opcoes_resposta?: string[] | null;
}

export interface AdicionarItemRequest {
  categoria: 'MOTOR' | 'ELETRICO' | 'LIMPEZA' | 'FERRAMENTA' | 'PNEU';
  nome_item: string;
  habilitado?: boolean;
  tem_foto?: boolean;
  obrigatorio?: boolean;
  tipo_resposta?: TipoResposta;
  opcoes_resposta?: string[];
  tipo_veiculo_id?: number | null;
  tipos_veiculo_associados?: number[];
  usuario_id?: number;
  usuario_nome?: string;
  tipo_checklist?: string;
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
    return this.http.get<ConfigItem[]>(`${this.baseUrl}/b_config_itens.php?acao=todos`);
  }

  /**
   * Busca estrutura de herança de itens (árvore)
   */
  buscarArvoreHeranca(tipo?: string, apenasHabilitados = false): Observable<any[]> {
    let url = `${this.baseUrl}/b_config_itens.php?acao=arvore_heranca`;
    if (tipo) {
      url += `&tipo=${tipo}`;
    }
    if (apenasHabilitados) {
      url += `&apenas_habilitados=true`;
    }
    return this.http.get<any[]>(url);
  }

  /**
   * Busca itens de uma categoria específica
   */
  buscarPorCategoria(categoria: string): Observable<ConfigItem[]> {
    return this.http.get<ConfigItem[]>(`${this.baseUrl}/b_config_itens.php?acao=categoria&categoria=${categoria}`);
  }

  /**
   * Busca apenas itens habilitados
   */
  buscarHabilitados(categoria?: string): Observable<ConfigItem[]> {
    const url = categoria
      ? `${this.baseUrl}/b_config_itens.php?acao=habilitados&categoria=${categoria}`
      : `${this.baseUrl}/b_config_itens.php?acao=habilitados`;
    return this.http.get<ConfigItem[]>(url);
  }

  /**
   * Busca itens por tipo de veículo (filtrados pela tabela de associação)
   */
  buscarPorTipoVeiculo(tipoVeiculoId: number, categoria?: string, apenasHabilitados = true): Observable<ConfigItem[]> {
    let url = `${this.baseUrl}/b_config_itens.php?acao=por_tipo_veiculo&tipo_veiculo_id=${tipoVeiculoId}`;
    if (categoria) {
      url += `&categoria=${categoria}`;
    }
    if (apenasHabilitados) {
      url += `&apenas_habilitados=true`;
    }
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

    const url = `${this.baseUrl}/b_config_itens.php`;

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

    return this.http.post(`${this.baseUrl}/b_config_itens.php`, body, { headers });
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

    return this.http.post(`${this.baseUrl}/b_config_itens.php`, body, { headers });
  }

  /**
   * Remove um item
   */
  removerItem(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = { id: id };

    return this.http.request('DELETE', `${this.baseUrl}/b_config_itens.php`, {
      headers: headers,
      body: body
    });
  }

  /**
   * Move um item entre categorias
   */
  moverItem(itemId: number, novaCategoria: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      acao: 'mover_item',
      id: itemId,
      categoria: novaCategoria
    };

    return this.http.post(`${this.baseUrl}/b_config_itens.php`, body, { headers });
  }

  /**
   * Atualiza o tipo de veículo de um item específico
   */
  atualizarTipoVeiculoItem(itemId: number, tipoVeiculoId: number | null): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      acao: 'atualizar_tipo_veiculo',
      id: itemId,
      tipo_veiculo_id: tipoVeiculoId
    };

    return this.http.post(`${this.baseUrl}/b_config_itens.php`, body, { headers });
  }
}
