import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TipoVeiculo } from '../models/checklist.models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TiposVeiculoService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private apiService: ApiService) { }

  /**
   * Adiciona prefixo ao arquivo PHP quando em ambiente staging/homolog
   * Remove o prefixo 'b_' e adiciona o novo prefixo do environment
   */
  private getPhpFile(filename: string): string {
    return this.apiService.getPhpFile(filename);
  }

  /**
   * Lista todos os tipos de veículos ativos
   */
  listarTipos(incluirInativos: boolean = false): Observable<TipoVeiculo[]> {
    const filename = this.getPhpFile('b_tipos_veiculo.php');
    const url = incluirInativos 
      ? `${this.baseUrl}/${filename}?acao=todos&incluir_inativos=true`
      : `${this.baseUrl}/${filename}?acao=todos`;
    
    return this.http.get<TipoVeiculo[]>(url).pipe(
      map((tipos: any[]) => tipos.map(tipo => ({
        ...tipo,
        ativo: tipo.ativo === 1 || tipo.ativo === true
      })))
    );
  }

  /**
   * Busca um tipo de veículo por ID
   */
  buscarPorId(id: number): Observable<TipoVeiculo> {
    const filename = this.getPhpFile('b_tipos_veiculo.php');
    const url = `${this.baseUrl}/${filename}?acao=por_id&id=${id}`;
    
    return this.http.get<TipoVeiculo>(url).pipe(
      map((tipo: any) => ({
        ...tipo,
        ativo: tipo.ativo === 1 || tipo.ativo === true
      }))
    );
  }

  /**
   * Cria um novo tipo de veículo
   */
  criarTipo(tipo: Partial<TipoVeiculo>): Observable<TipoVeiculo> {
    const filename = this.getPhpFile('b_tipos_veiculo.php');
    const url = `${this.baseUrl}/${filename}`;
    const body = {
      acao: 'criar',
      nome: tipo.nome,
      descricao: tipo.descricao || null,
      ativo: tipo.ativo !== undefined ? tipo.ativo : true,
      icone: tipo.icone || null,
      usuario_id: tipo.usuario_id || null
    };

    return this.http.post<any>(url, body).pipe(
      map((response: any) => {
        const tipoRetornado = response.tipo || response;
        return {
          ...tipoRetornado,
          ativo: tipoRetornado.ativo === 1 || tipoRetornado.ativo === true
        };
      })
    );
  }

  /**
   * Atualiza um tipo de veículo existente
   */
  atualizarTipo(id: number, tipo: Partial<TipoVeiculo>): Observable<TipoVeiculo> {
    const filename = this.getPhpFile('b_tipos_veiculo.php');
    const url = `${this.baseUrl}/${filename}`;
    const body = {
      acao: 'atualizar',
      id: id,
      nome: tipo.nome,
      descricao: tipo.descricao || null,
      icone: tipo.icone || null
    };

    return this.http.post<any>(url, body).pipe(
      map((response: any) => {
        const tipoRetornado = response.tipo || response;
        return {
          ...tipoRetornado,
          ativo: tipoRetornado.ativo === 1 || tipoRetornado.ativo === true
        };
      })
    );
  }

  /**
   * Ativa ou desativa um tipo de veículo
   */
  toggleAtivo(id: number): Observable<TipoVeiculo> {
    const filename = this.getPhpFile('b_tipos_veiculo.php');
    const url = `${this.baseUrl}/${filename}`;
    const body = {
      acao: 'toggle_ativo',
      id: id
    };

    return this.http.post<any>(url, body).pipe(
      map((response: any) => {
        const tipoRetornado = response.tipo || response;
        return {
          ...tipoRetornado,
          ativo: tipoRetornado.ativo === 1 || tipoRetornado.ativo === true
        };
      })
    );
  }
}
