import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PneuPosicao {
  id: number;
  nome: string;
  tipo_regra?: string;
  habilitado: boolean;
  ordem: number;
  usuario_id?: number;
  data_criacao?: string;
  tipos_veiculo_associados?: string;
}

export interface AdicionarPosicaoRequest {
  nome: string;
  tipo_regra?: string;
  habilitado?: boolean;
  ordem?: number;
  usuario_id?: number;
  tipos_veiculo_associados?: number[];
}

export interface AtualizarPosicaoRequest {
  id: number;
  nome?: string;
  habilitado?: boolean;
  ordem?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigPneuPosicoesService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Busca posições de pneu por tipo de veículo
   */
  buscarPorTipoVeiculo(tipoVeiculoId: number, apenasHabilitados = true): Observable<PneuPosicao[]> {
    let url = `${this.baseUrl}/b_config_pneu_posicoes.php?acao=por_tipo_veiculo&tipo_veiculo_id=${tipoVeiculoId}`;
    if (apenasHabilitados) {
      url += `&apenas_habilitados=true`;
    }
    return this.http.get<PneuPosicao[]>(url);
  }

  /**
   * Busca todas as posições
   */
  buscarTodas(apenasHabilitados = false): Observable<PneuPosicao[]> {
    let url = `${this.baseUrl}/b_config_pneu_posicoes.php?acao=todos`;
    if (apenasHabilitados) {
      url += `&apenas_habilitados=true`;
    }
    return this.http.get<PneuPosicao[]>(url);
  }

  /**
   * Adiciona uma nova posição de pneu
   */
  adicionarPosicao(dados: AdicionarPosicaoRequest): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = {
      acao: 'adicionar_posicao',
      ...dados
    };
    return this.http.post(`${this.baseUrl}/b_config_pneu_posicoes.php`, body, { headers });
  }

  /**
   * Atualiza uma posição existente
   */
  atualizarPosicao(dados: AtualizarPosicaoRequest): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = {
      acao: 'atualizar_posicao',
      ...dados
    };
    return this.http.post(`${this.baseUrl}/b_config_pneu_posicoes.php`, body, { headers });
  }

  /**
   * Atualiza associações de tipos de veículo de uma posição
   */
  atualizarAssociacoes(posicaoId: number, tiposVeiculoAssociados: number[]): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = {
      acao: 'atualizar_associacoes',
      id: posicaoId,
      tipos_veiculo_associados: tiposVeiculoAssociados
    };
    return this.http.post(`${this.baseUrl}/b_config_pneu_posicoes.php`, body, { headers });
  }
}
