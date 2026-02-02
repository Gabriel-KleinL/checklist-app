import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CampoInspecao {
  id: number;
  nome_campo: string;
  label: string;
  tipo_campo: 'text' | 'number' | 'select' | 'textarea';
  opcoes?: string[] | string | null; // Array de opções para campos do tipo 'select'
  obrigatorio: boolean;
  tem_foto: boolean;
  habilitado: boolean;
  ordem: number | null;
  tipo_veiculo_id: number | null;
  tipo_veiculo_nome?: string;
  tipo_veiculo_icone?: string;
  data_criacao?: string;
}

export interface CampoInspecaoRequest {
  nome_campo: string;
  label: string;
  tipo_campo?: 'text' | 'number' | 'select' | 'textarea';
  opcoes?: string[] | string | null;
  obrigatorio?: boolean;
  tem_foto?: boolean;
  habilitado?: boolean;
  ordem?: number;
  tipo_veiculo_id?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigCamposInspecaoService {
  private apiUrl = `${environment.apiUrl}/api/config/campos-inspecao`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todos os campos de inspeção
   */
  listarCampos(tipoVeiculoId?: number): Observable<CampoInspecao[]> {
    let url = this.apiUrl;
    if (tipoVeiculoId) {
      url += `?tipo_veiculo_id=${tipoVeiculoId}`;
    }
    return this.http.get<{ success: boolean; data: CampoInspecao[] }>(url).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Lista apenas campos habilitados para um tipo de veículo
   */
  listarCamposHabilitados(tipoVeiculoId: number): Observable<CampoInspecao[]> {
    return this.http.get<{ success: boolean; data: CampoInspecao[] }>(
      `${this.apiUrl}/habilitados/${tipoVeiculoId}`
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Adiciona um novo campo de inspeção
   */
  adicionarCampo(campo: CampoInspecaoRequest): Observable<{ success: boolean; id: number }> {
    return this.http.post<{ success: boolean; id: number }>(this.apiUrl, campo);
  }

  /**
   * Atualiza um campo de inspeção
   */
  atualizarCampo(id: number, campo: Partial<CampoInspecaoRequest>): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/${id}`, campo);
  }

  /**
   * Alterna o estado habilitado/desabilitado de um campo
   */
  toggleCampo(id: number): Observable<{ success: boolean; habilitado: boolean }> {
    return this.http.patch<{ success: boolean; habilitado: boolean }>(
      `${this.apiUrl}/${id}/toggle`,
      {}
    );
  }

  /**
   * Remove um campo de inspeção
   */
  removerCampo(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }
}
