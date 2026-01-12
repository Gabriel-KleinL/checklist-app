import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { PhotoCompressionService } from './photo-compression.service';
import { LoggerService } from './logger.service';
import { API_CONFIG } from '../config/app.constants';
import {
  ChecklistSimples,
  ChecklistDetalhado,
  ChecklistCompleto,
  ApiResponse,
  VeiculoComAnomalias,
  CategoriaItem
} from '../models/checklist.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(
    private http: HttpClient,
    private photoCompression: PhotoCompressionService,
    private logger: LoggerService
  ) { }

  /**
   * Adiciona prefixo ao arquivo PHP quando em ambiente staging
   * Remove o prefixo 'b_' e adiciona o novo prefixo do environment
   */
  private getPhpFile(filename: string): string {
    const prefix = environment.filePrefix || 'b_';
    // Remove o prefixo 'b_' se existir
    const nameWithoutPrefix = filename.startsWith('b_') ? filename.substring(2) : filename;
    return `${prefix}${nameWithoutPrefix}`;
  }

  // ============================================
  // TESTES DE CONEXÃO
  // ============================================

  testarConexao(): Observable<ApiResponse> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_get.php')}?acao=todos&limite=1`;
    this.logger.apiRequest('GET', url);

    return this.http.get<ApiResponse>(url).pipe(
      tap(response => this.logger.apiResponse('GET', url, response)),
      catchError(error => {
        this.logger.apiError('GET', url, error);
        return throwError(() => error);
      })
    );
  }

  testarConexaoSimples(): Observable<ApiResponse> {
    const url = `${this.baseUrl}/test_connection.php`;
    this.logger.apiRequest('GET', url);

    return this.http.get<ApiResponse>(url).pipe(
      tap(response => this.logger.apiResponse('GET', url, response)),
      catchError(error => {
        this.logger.apiError('GET', url, error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // OPERAÇÕES DE CHECKLIST
  // ============================================

  salvarChecklist(dados: Partial<ChecklistCompleto>): Observable<ApiResponse> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_set.php')}`;
    const tamanho = JSON.stringify(dados).length;

    this.logger.group('Salvando Checklist');
    this.logger.info(`URL: ${url}`);
    this.logger.info(`Tamanho dos dados: ${tamanho} bytes`);
    this.logger.debug('Dados:', dados);
    this.logger.groupEnd();

    return this.http.post<ApiResponse>(url, dados, { headers: this.headers }).pipe(
      tap(response => {
        this.logger.info('Checklist salvo com sucesso');
        this.logger.debug('Response:', response);
      }),
      catchError(error => {
        this.logger.error('Erro ao salvar checklist', error);
        return throwError(() => error);
      })
    );
  }

  criarInspecaoInicial(dados: Partial<ChecklistSimples>): Observable<ApiResponse> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_set.php')}`;

    this.logger.group('Criando Inspeção Inicial');
    this.logger.info(`URL: ${url}`);
    this.logger.debug('Dados:', dados);
    this.logger.groupEnd();

    return this.http.post<ApiResponse>(url, dados, { headers: this.headers }).pipe(
      tap(response => this.logger.info('Inspeção inicial criada com sucesso')),
      catchError(error => {
        this.logger.error('Erro ao criar inspeção inicial', error);
        return throwError(() => error);
      })
    );
  }

  atualizarInspecao(inspecaoId: number, dados: Partial<ChecklistSimples>): Observable<ApiResponse> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_update.php')}`;
    const dadosCompletos = { inspecao_id: inspecaoId, ...dados };

    this.logger.group('Atualizando Inspeção');
    this.logger.info(`URL: ${url}`);
    this.logger.info(`ID: ${inspecaoId}`);
    this.logger.debug('Dados:', dadosCompletos);
    this.logger.groupEnd();

    return this.http.post<ApiResponse>(url, dadosCompletos, { headers: this.headers }).pipe(
      tap(response => this.logger.info('Inspeção atualizada com sucesso')),
      catchError(error => {
        this.logger.error('Erro ao atualizar inspeção', error);
        return throwError(() => error);
      })
    );
  }

  async salvarChecklistSimples(checklistCompleto: ChecklistCompleto): Promise<Observable<ApiResponse>> {
    this.logger.time('Compressão de fotos');
    this.logger.info('Comprimindo fotos do checklist...');

    // Comprime todas as fotos antes de enviar
    const dadosComprimidos = await this.photoCompression.compressAllPhotos(checklistCompleto);
    const dadosApi = this.transformarParaApiFormat(dadosComprimidos);

    this.logger.timeEnd('Compressão de fotos');
    this.logger.info('Fotos comprimidas com sucesso');

    return this.salvarChecklist(dadosApi);
  }

  // ============================================
  // CONSULTAS DE CHECKLIST
  // ============================================

  buscarTodos(limite: number = API_CONFIG.DEFAULT_LIMIT): Observable<ChecklistSimples[]> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_get.php')}?acao=todos&limite=${limite}`;
    this.logger.debug(`Buscando todos os checklists (limite: ${limite})`);

    return this.http.get<ChecklistSimples[]>(url).pipe(
      tap(response => this.logger.debug(`${response.length} checklists encontrados`)),
      catchError(error => {
        this.logger.error('Erro ao buscar checklists', error);
        return throwError(() => error);
      })
    );
  }

  buscarPorPlaca(placa: string): Observable<ChecklistSimples[]> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_get.php')}?acao=placa&placa=${placa}`;
    this.logger.debug(`Buscando checklists da placa: ${placa}`);

    return this.http.get<ChecklistSimples[]>(url).pipe(
      tap(response => this.logger.debug(`${response.length} checklists encontrados para placa ${placa}`)),
      catchError(error => {
        this.logger.error(`Erro ao buscar checklists da placa ${placa}`, error);
        return throwError(() => error);
      })
    );
  }

  validarPlaca(placa: string): Observable<ApiResponse<boolean>> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_get.php')}?acao=validar_placa&placa=${encodeURIComponent(placa)}`;
    this.logger.debug(`Validando placa: ${placa}`);

    return this.http.get<ApiResponse<boolean>>(url).pipe(
      tap(response => this.logger.debug(`Placa ${placa} válida: ${response.dados}`)),
      catchError(error => {
        this.logger.error(`Erro ao validar placa ${placa}`, error);
        return throwError(() => error);
      })
    );
  }

  buscarPorId(id: number): Observable<ChecklistSimples> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_get.php')}?acao=id&id=${id}`;
    this.logger.debug(`Buscando checklist ID: ${id}`);

    return this.http.get<ChecklistSimples>(url).pipe(
      tap(() => this.logger.debug(`Checklist ${id} encontrado`)),
      catchError(error => {
        this.logger.error(`Erro ao buscar checklist ${id}`, error);
        return throwError(() => error);
      })
    );
  }

  buscarCompleto(id: number): Observable<ChecklistDetalhado> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_get.php')}?acao=completo&id=${id}`;
    this.logger.debug(`Buscando checklist completo ID: ${id}`);

    return this.http.get<ChecklistDetalhado>(url).pipe(
      tap(() => this.logger.debug(`Checklist completo ${id} encontrado`)),
      catchError(error => {
        this.logger.error(`Erro ao buscar checklist completo ${id}`, error);
        return throwError(() => error);
      })
    );
  }

  buscarPorPeriodo(dataInicio: string, dataFim: string): Observable<ChecklistSimples[]> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_get.php')}?acao=periodo&data_inicio=${dataInicio}&data_fim=${dataFim}`;
    this.logger.debug(`Buscando checklists entre ${dataInicio} e ${dataFim}`);

    return this.http.get<ChecklistSimples[]>(url).pipe(
      tap(response => this.logger.debug(`${response.length} checklists encontrados no período`)),
      catchError(error => {
        this.logger.error('Erro ao buscar checklists por período', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // ANOMALIAS
  // ============================================

  buscarAnomalias(tipo: 'ativas' | 'finalizadas' = 'ativas'): Observable<VeiculoComAnomalias[]> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_anomalias.php')}?tipo=${tipo}`;
    this.logger.debug(`Buscando anomalias ${tipo}`);

    return this.http.get<VeiculoComAnomalias[]>(url, {
      observe: 'response',
      responseType: 'json'
    }).pipe(
      map(response => {
        // Valida se a resposta é válida
        if (!response.body) {
          this.logger.warn(`Resposta vazia ao buscar anomalias ${tipo}`);
          return [];
        }

        // Valida se é um array
        if (!Array.isArray(response.body)) {
          this.logger.error(`Resposta inválida ao buscar anomalias ${tipo}: não é um array`, response.body);
          throw new Error('Resposta do servidor não é um array válido');
        }

        this.logger.debug(`${response.body.length} veículos com anomalias ${tipo}`);
        return response.body;
      }),
      catchError(error => {
        // Trata erros de parsing JSON
        if (error.error instanceof ProgressEvent || (error.error && typeof error.error === 'string')) {
          this.logger.error(`Erro de parsing JSON ao buscar anomalias ${tipo}. Resposta pode estar malformada.`, error);
          return throwError(() => new Error('Erro ao processar resposta do servidor. A resposta não é um JSON válido.'));
        }

        // Trata erros HTTP
        if (error.status === 200 && !error.ok) {
          this.logger.error(`Erro de parsing: status 200 mas resposta inválida ao buscar anomalias ${tipo}`, error);
          return throwError(() => new Error('Erro ao processar resposta do servidor. A resposta não é um JSON válido.'));
        }

        // Trata outros erros
        this.logger.error(`Erro ao buscar anomalias ${tipo}`, error);
        
        // Extrai mensagem de erro mais amigável
        let mensagemErro = 'Erro ao buscar anomalias';
        if (error.error?.erro) {
          mensagemErro = error.error.erro;
        } else if (error.error?.message) {
          mensagemErro = error.error.message;
        } else if (error.message) {
          mensagemErro = error.message;
        }

        return throwError(() => new Error(mensagemErro));
      })
    );
  }

  buscarPlacas(termo: string = '', limite: number = 20): Observable<string[]> {
    const params = termo ? `?termo=${encodeURIComponent(termo)}&limite=${limite}` : `?limite=${limite}`;
    const url = `${this.baseUrl}/${this.getPhpFile('b_buscar_placas.php')}${params}`;

    return this.http.get<{sucesso: boolean; total: number; placas: string[]}>(url).pipe(
      tap(response => this.logger.debug(`${response.placas?.length || 0} placas encontradas`)),
      map(response => response.placas || []),
      catchError(error => {
        this.logger.error('Erro ao buscar placas', error);
        return throwError(() => error);
      })
    );
  }

  aprovarAnomalia(placa: string, categoria: CategoriaItem, item: string, usuarioId?: number): Observable<ApiResponse> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_anomalia_status.php')}`;
    const dados = { placa, categoria, item, acao: 'aprovar', usuario_id: usuarioId };

    this.logger.info(`Aprovando anomalia: ${item} da placa ${placa}`);

    return this.http.post<ApiResponse>(url, dados, { headers: this.headers }).pipe(
      tap(() => this.logger.info('Anomalia aprovada com sucesso')),
      catchError(error => {
        this.logger.error('Erro ao aprovar anomalia', error);
        return throwError(() => error);
      })
    );
  }

  reprovarAnomalia(placa: string, categoria: CategoriaItem, item: string, observacao?: string): Observable<ApiResponse> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_anomalia_status.php')}`;
    const dados = { placa, categoria, item, acao: 'reprovar', observacao };

    this.logger.warn(`Reprovando anomalia: ${item} da placa ${placa}`);

    return this.http.post<ApiResponse>(url, dados, { headers: this.headers }).pipe(
      tap(() => this.logger.info('Anomalia reprovada')),
      catchError(error => {
        this.logger.error('Erro ao reprovar anomalia', error);
        return throwError(() => error);
      })
    );
  }

  finalizarAnomalia(placa: string, categoria: CategoriaItem, item: string, observacao?: string): Observable<ApiResponse> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_anomalia_status.php')}`;
    const dados = { placa, categoria, item, acao: 'finalizar', observacao };

    this.logger.info(`Finalizando anomalia: ${item} da placa ${placa}`);

    return this.http.post<ApiResponse>(url, dados, { headers: this.headers }).pipe(
      tap(() => this.logger.info('Anomalia finalizada com sucesso')),
      catchError(error => {
        this.logger.error('Erro ao finalizar anomalia', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Métodos para Checklist Completo
  // ============================================

  salvarChecklistCompleto(dados: Partial<ChecklistCompleto>): Observable<ApiResponse> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_checklist_completo_set.php')}`;

    this.logger.group('Salvando Checklist Completo');
    this.logger.info(`URL: ${url}`);
    this.logger.debug('Dados:', dados);
    this.logger.groupEnd();

    return this.http.post<ApiResponse>(url, dados, { headers: this.headers }).pipe(
      tap(() => this.logger.info('Checklist completo salvo com sucesso')),
      catchError(error => {
        this.logger.error('Erro ao salvar checklist completo', error);
        return throwError(() => error);
      })
    );
  }

  buscarChecklistCompleto(id: number): Observable<ChecklistCompleto> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_checklist_completo_get.php')}?acao=id&id=${id}`;
    this.logger.debug(`Buscando checklist completo ID: ${id}`);

    return this.http.get<ChecklistCompleto>(url).pipe(
      tap(() => this.logger.debug(`Checklist completo ${id} encontrado`)),
      catchError(error => {
        this.logger.error(`Erro ao buscar checklist completo ${id}`, error);
        return throwError(() => error);
      })
    );
  }

  buscarChecklistsCompletos(limite: number = API_CONFIG.DEFAULT_LIMIT): Observable<ChecklistCompleto[]> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_checklist_completo_get.php')}?acao=todos&limite=${limite}`;
    this.logger.debug(`Buscando checklists completos (limite: ${limite})`);

    return this.http.get<ChecklistCompleto[]>(url).pipe(
      tap(response => this.logger.debug(`${response.length} checklists completos encontrados`)),
      catchError(error => {
        this.logger.error('Erro ao buscar checklists completos', error);
        return throwError(() => error);
      })
    );
  }

  buscarChecklistCompletosPorPlaca(placa: string): Observable<ChecklistCompleto[]> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_checklist_completo_get.php')}?acao=placa&placa=${placa}`;
    this.logger.debug(`Buscando checklists completos da placa: ${placa}`);

    return this.http.get<ChecklistCompleto[]>(url).pipe(
      tap(response => this.logger.debug(`${response.length} checklists completos encontrados para placa ${placa}`)),
      catchError(error => {
        this.logger.error(`Erro ao buscar checklists completos da placa ${placa}`, error);
        return throwError(() => error);
      })
    );
  }

  buscarChecklistCompletosPorPeriodo(dataInicio: string, dataFim: string): Observable<ChecklistCompleto[]> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_checklist_completo_get.php')}?acao=periodo&data_inicio=${dataInicio}&data_fim=${dataFim}`;
    this.logger.debug(`Buscando checklists completos entre ${dataInicio} e ${dataFim}`);

    return this.http.get<ChecklistCompleto[]>(url).pipe(
      tap(response => this.logger.debug(`${response.length} checklists completos encontrados no período`)),
      catchError(error => {
        this.logger.error('Erro ao buscar checklists completos por período', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // TRANSFORMAÇÃO DE DADOS
  // ============================================

  transformarParaApiFormat(checklist: ChecklistCompleto): Partial<ChecklistCompleto> {
    const inspecaoInicial = checklist.inspecaoInicial;
    const inspecaoVeiculo = checklist.inspecaoVeiculo;
    const fotosVeiculo = checklist.fotosVeiculo || [];
    const pneus = checklist.pneus || [];

    this.logger.group('Transformando dados para formato API', true);
    this.logger.debug('Checklist completo:', checklist);

    // Monta array de itens de inspeção de forma DINÂMICA
    const itensInspecao: any[] = [];

    // MOTOR - adiciona todos os itens dinamicamente
    (inspecaoVeiculo?.motor || []).forEach(item => {
      itensInspecao.push({
        categoria: 'MOTOR',
        item: item.nome,
        status: item.valor,
        foto: item.foto || null,
        descricao: item.descricao || null
      });
    });

    // ELÉTRICOS - adiciona todos os itens dinamicamente
    (inspecaoVeiculo?.eletricos || []).forEach(item => {
      itensInspecao.push({
        categoria: 'ELETRICO',
        item: item.nome,
        status: item.valor,
        foto: item.foto || null,
        descricao: item.descricao || null
      });
    });

    // LIMPEZA - adiciona todos os itens dinamicamente
    (inspecaoVeiculo?.limpeza || []).forEach(item => {
      itensInspecao.push({
        categoria: 'LIMPEZA',
        item: item.nome,
        status: item.valor,
        foto: item.foto || null,
        descricao: item.descricao || null
      });
    });

    // FERRAMENTAS - adiciona todos os itens dinamicamente
    (inspecaoVeiculo?.ferramentas || []).forEach(item => {
      itensInspecao.push({
        categoria: 'FERRAMENTA',
        item: item.nome,
        status: item.valor,
        foto: item.foto || null,
        descricao: item.descricao || null
      });
    });

    // PNEUS - adiciona todos os itens dinamicamente
    const itensPneus: any[] = [];
    pneus.forEach(pneu => {
      itensPneus.push({
        item: pneu.nome,
        status: pneu.valor,
        foto: pneu.foto || null,
        pressao: pneu.pressao || null
      });
    });

    // FOTOS DO VEÍCULO - mapeia tipos dinamicamente
    const fotosMapeadas: Record<string, string> = {};
    const mapaTiposFotos: Record<string, string> = {
      'Foto Frontal': 'foto_frontal',
      'Foto Traseira': 'foto_traseira',
      'Foto Lateral Direita': 'foto_lateral_direita',
      'Foto Lateral Esquerda': 'foto_lateral_esquerda'
    };

    fotosVeiculo.forEach(foto => {
      const chave = mapaTiposFotos[foto.tipo];
      if (chave) {
        fotosMapeadas[chave] = foto.foto || '';
      }
    });

    this.logger.info(`Transformação concluída: ${itensInspecao.length} itens, ${itensPneus.length} pneus, ${Object.keys(fotosMapeadas).length} fotos`);
    this.logger.groupEnd();

    // Monta o objeto final com os arrays dinâmicos
    const dadosFinais = {
      // Dados da inspeção inicial
      placa: inspecaoInicial?.placa || '',
      km_inicial: inspecaoInicial?.kmInicial || 0,
      nivel_combustivel: inspecaoInicial?.nivelCombustivel || '0%',
      foto_painel: inspecaoInicial?.fotoPainel || '',
      observacao_painel: inspecaoInicial?.observacaoPainel || '',
      usuario_id: checklist.usuario_id || null,

      // Arrays dinâmicos
      itens_inspecao: itensInspecao,
      itens_pneus: itensPneus,

      // Fotos do veículo (mantém formato antigo para compatibilidade)
      ...fotosMapeadas
    };

    return dadosFinais;
  }

  // ============================================
  // RELATÓRIOS
  // ============================================

  buscarVeiculosSemChecklist(): Observable<{veiculos: any[], total: number}> {
    const url = `${this.baseUrl}/${this.getPhpFile('b_veicular_relatorios.php')}?acao=veiculos_sem_checklist`;
    this.logger.debug('Buscando veículos sem checklist');

    return this.http.get<{veiculos: any[], total: number}>(url).pipe(
      tap(response => this.logger.debug(`${response.total} veículos sem checklist encontrados`)),
      catchError(error => {
        this.logger.error('Erro ao buscar veículos sem checklist', error);
        return throwError(() => error);
      })
    );
  }
}
