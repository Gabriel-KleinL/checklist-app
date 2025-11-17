import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TempoTelaData {
  inspecao_id?: number | null;
  usuario_id?: number | null;
  tela: string;
  tempo_segundos: number;
  data_hora_inicio: string;
  data_hora_fim: string;
}

@Injectable({
  providedIn: 'root'
})
export class TempoTelasService {
  private baseUrl = environment.apiUrl;
  private inicioTela: Date | null = null;
  private telaAtual: string | null = null;

  constructor(private http: HttpClient) { }

  /**
   * Inicia o rastreamento de tempo para uma tela
   * @param nomeTela Nome da tela (ex: 'inspecao-inicial', 'inspecao-veiculo', 'fotos-veiculo', 'pneus')
   */
  iniciarTela(nomeTela: string) {
    this.telaAtual = nomeTela;
    this.inicioTela = new Date();
    console.log(`[Tempo] Iniciado rastreamento da tela: ${nomeTela} às ${this.inicioTela.toISOString()}`);
  }

  /**
   * Finaliza o rastreamento e salva o tempo no servidor
   * @param inspecaoId ID da inspeção (opcional)
   * @param usuarioId ID do usuário (opcional)
   * @returns Observable com a resposta do servidor
   */
  finalizarTela(inspecaoId?: number, usuarioId?: number): Observable<any> | null {
    if (!this.inicioTela || !this.telaAtual) {
      console.warn('[Tempo] Tentativa de finalizar tela sem ter iniciado rastreamento');
      return null;
    }

    const fimTela = new Date();
    const tempoSegundos = Math.round((fimTela.getTime() - this.inicioTela.getTime()) / 1000);

    const dados: TempoTelaData = {
      tela: this.telaAtual,
      tempo_segundos: tempoSegundos,
      data_hora_inicio: this.formatarDataHora(this.inicioTela),
      data_hora_fim: this.formatarDataHora(fimTela),
      inspecao_id: inspecaoId || null,
      usuario_id: usuarioId || null
    };

    console.log(`[Tempo] Finalizando tela: ${this.telaAtual}, tempo: ${tempoSegundos}s`, dados);

    // Limpa as variáveis
    this.inicioTela = null;
    this.telaAtual = null;

    // Envia para o servidor
    return this.salvarTempo(dados);
  }

  /**
   * Cancela o rastreamento atual sem salvar
   */
  cancelarRastreamento() {
    if (this.telaAtual) {
      console.log(`[Tempo] Cancelando rastreamento da tela: ${this.telaAtual}`);
    }
    this.inicioTela = null;
    this.telaAtual = null;
  }

  /**
   * Salva o tempo de uma tela no servidor
   */
  private salvarTempo(dados: TempoTelaData): Observable<any> {
    return this.http.post(`${this.baseUrl}/b_veicular_tempotelas.php`, dados);
  }

  /**
   * Busca tempos de uma inspeção específica
   */
  buscarPorInspecao(inspecaoId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_veicular_tempotelas.php?acao=inspecao&inspecao_id=${inspecaoId}`);
  }

  /**
   * Busca tempos de um usuário específico
   */
  buscarPorUsuario(usuarioId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_veicular_tempotelas.php?acao=usuario&usuario_id=${usuarioId}`);
  }

  /**
   * Busca estatísticas gerais de tempo por tela
   */
  buscarEstatisticas(): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_veicular_tempotelas.php?acao=estatisticas`);
  }

  /**
   * Formata data para o formato MySQL (YYYY-MM-DD HH:MM:SS)
   */
  private formatarDataHora(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    const segundo = String(data.getSeconds()).padStart(2, '0');

    return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
  }

  /**
   * Retorna o tempo atual de tela em segundos (para debug)
   */
  getTempoAtualSegundos(): number {
    if (!this.inicioTela) {
      return 0;
    }
    return Math.round((new Date().getTime() - this.inicioTela.getTime()) / 1000);
  }

  /**
   * Verifica se há rastreamento ativo
   */
  isRastreamentoAtivo(): boolean {
    return this.inicioTela !== null;
  }

  /**
   * Retorna o nome da tela atual sendo rastreada
   */
  getTelaAtual(): string | null {
    return this.telaAtual;
  }
}
