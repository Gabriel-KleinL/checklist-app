import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChecklistCompleto } from './checklist-data.service';
import { PhotoCompressionService } from './photo-compression.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private photoCompression: PhotoCompressionService) { }

  testarConexao(): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_veicular_get.php?acao=todos&limite=1`);
  }

  testarConexaoSimples(): Observable<any> {
    return this.http.get(`${this.baseUrl}/test_connection.php`);
  }

  salvarChecklist(dados: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('=== SALVANDO CHECKLIST ===');
    console.log('URL:', `${this.baseUrl}/b_veicular_set.php`);
    console.log('Headers:', headers);
    console.log('Dados:', dados);
    console.log('Tamanho dos dados:', JSON.stringify(dados).length, 'bytes');

    return this.http.post(`${this.baseUrl}/b_veicular_set.php`, dados, { headers });
  }

  criarInspecaoInicial(dados: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('=== CRIANDO INSPEÇÃO INICIAL ===');
    console.log('URL:', `${this.baseUrl}/b_veicular_set.php`);
    console.log('Dados:', dados);

    return this.http.post(`${this.baseUrl}/b_veicular_set.php`, dados, { headers });
  }

  atualizarInspecao(inspecaoId: number, dados: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const dadosCompletos = {
      inspecao_id: inspecaoId,
      ...dados
    };

    console.log('=== ATUALIZANDO INSPEÇÃO ===');
    console.log('URL:', `${this.baseUrl}/b_veicular_update.php`);
    console.log('Dados:', dadosCompletos);

    return this.http.post(`${this.baseUrl}/b_veicular_update.php`, dadosCompletos, { headers });
  }

  async salvarChecklistSimples(checklistCompleto: ChecklistCompleto): Promise<Observable<any>> {
    console.log('=== COMPRIMINDO FOTOS ===');

    // Comprime todas as fotos antes de enviar
    const dadosComprimidos = await this.photoCompression.compressAllPhotos(checklistCompleto);
    const dadosApi = this.transformarParaApiFormat(dadosComprimidos);

    console.log('Fotos comprimidas com sucesso');
    return this.salvarChecklist(dadosApi);
  }

  buscarTodos(limite: number = 100): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_veicular_get.php?acao=todos&limite=${limite}`);
  }

  buscarPorPlaca(placa: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_veicular_get.php?acao=placa&placa=${placa}`);
  }

  validarPlaca(placa: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_veicular_get.php?acao=validar_placa&placa=${encodeURIComponent(placa)}`);
  }

  buscarPorId(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_veicular_get.php?acao=id&id=${id}`);
  }

  buscarCompleto(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_veicular_get.php?acao=completo&id=${id}`);
  }

  buscarPorPeriodo(dataInicio: string, dataFim: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_veicular_get.php?acao=periodo&data_inicio=${dataInicio}&data_fim=${dataFim}`);
  }

  buscarAnomalias(tipo: string = 'ativas'): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_veicular_anomalias.php?tipo=${tipo}`);
  }

  buscarPlacas(termo: string = '', limite: number = 20): Observable<any> {
    const params = termo ? `?termo=${encodeURIComponent(termo)}&limite=${limite}` : `?limite=${limite}`;
    return this.http.get(`${this.baseUrl}/b_buscar_placas.php${params}`);
  }

  aprovarAnomalia(placa: string, categoria: string, item: string, usuarioId?: number): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.baseUrl}/b_anomalia_status.php`, {
      placa,
      categoria,
      item,
      acao: 'aprovar',
      usuario_id: usuarioId
    }, { headers });
  }

  reprovarAnomalia(placa: string, categoria: string, item: string, observacao?: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.baseUrl}/b_anomalia_status.php`, {
      placa,
      categoria,
      item,
      acao: 'reprovar',
      observacao
    }, { headers });
  }

  finalizarAnomalia(placa: string, categoria: string, item: string, observacao?: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.baseUrl}/b_anomalia_status.php`, {
      placa,
      categoria,
      item,
      acao: 'finalizar',
      observacao
    }, { headers });
  }

  // ============================================
  // Métodos para Checklist Completo
  // ============================================

  salvarChecklistCompleto(dados: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('=== SALVANDO CHECKLIST COMPLETO ===');
    console.log('URL:', `${this.baseUrl}/b_checklist_completo_set.php`);
    console.log('Dados:', dados);

    return this.http.post(`${this.baseUrl}/b_checklist_completo_set.php`, dados, { headers });
  }

  buscarChecklistCompleto(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_checklist_completo_get.php?acao=id&id=${id}`);
  }

  buscarChecklistsCompletos(limite: number = 100): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_checklist_completo_get.php?acao=todos&limite=${limite}`);
  }

  buscarChecklistCompletosPorPlaca(placa: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_checklist_completo_get.php?acao=placa&placa=${placa}`);
  }

  buscarChecklistCompletosPorPeriodo(dataInicio: string, dataFim: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/b_checklist_completo_get.php?acao=periodo&data_inicio=${dataInicio}&data_fim=${dataFim}`);
  }

  transformarParaApiFormat(checklist: ChecklistCompleto): any {
    const inspecaoInicial = checklist.inspecaoInicial;
    const inspecaoVeiculo = checklist.inspecaoVeiculo;
    const fotosVeiculo = checklist.fotosVeiculo || [];
    const pneus = checklist.pneus || [];

    console.log('=== TRANSFORMANDO DADOS DINAMICAMENTE ===');
    console.log('Checklist completo:', checklist);

    // Monta array de itens de inspeção de forma DINÂMICA
    const itensInspecao: any[] = [];

    // MOTOR - adiciona todos os itens dinamicamente
    (inspecaoVeiculo?.motor || []).forEach(item => {
      itensInspecao.push({
        categoria: 'MOTOR',
        item: item.nome,
        status: item.valor,
        foto: item.foto || null
      });
    });

    // ELÉTRICOS - adiciona todos os itens dinamicamente
    (inspecaoVeiculo?.eletricos || []).forEach(item => {
      itensInspecao.push({
        categoria: 'ELETRICO',
        item: item.nome,
        status: item.valor,
        foto: item.foto || null
      });
    });

    // LIMPEZA - adiciona todos os itens dinamicamente
    (inspecaoVeiculo?.limpeza || []).forEach(item => {
      itensInspecao.push({
        categoria: 'LIMPEZA',
        item: item.nome,
        status: item.valor,
        foto: item.foto || null
      });
    });

    // FERRAMENTAS - adiciona todos os itens dinamicamente
    (inspecaoVeiculo?.ferramentas || []).forEach(item => {
      itensInspecao.push({
        categoria: 'FERRAMENTA',
        item: item.nome,
        status: item.valor,
        foto: item.foto || null
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
    const fotosMapeadas: any = {};
    const mapaTiposFotos: any = {
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

    console.log('Total de itens de inspeção:', itensInspecao.length);
    console.log('Total de pneus:', itensPneus.length);
    console.log('Fotos mapeadas:', Object.keys(fotosMapeadas));

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

    // Log final dos dados que serão enviados
    console.log('=== DADOS FINAIS DINÂMICOS PARA ENVIO ===');
    console.log('Itens de inspeção:', dadosFinais.itens_inspecao.length);
    console.log('Itens de pneus:', dadosFinais.itens_pneus.length);
    console.log('Dados completos:', dadosFinais);

    return dadosFinais;
  }
}
