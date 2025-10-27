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
    return this.http.get(`${this.baseUrl}/veicular_get.php?acao=todos&limite=1`);
  }

  testarConexaoSimples(): Observable<any> {
    return this.http.get(`${this.baseUrl}/test_connection.php`);
  }

  salvarChecklist(dados: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('=== SALVANDO CHECKLIST ===');
    console.log('URL:', `${this.baseUrl}/veicular_set.php`);
    console.log('Headers:', headers);
    console.log('Dados:', dados);
    console.log('Tamanho dos dados:', JSON.stringify(dados).length, 'bytes');

    return this.http.post(`${this.baseUrl}/veicular_set.php`, dados, { headers });
  }

  async salvarChecklistCompleto(checklistCompleto: ChecklistCompleto): Promise<Observable<any>> {
    console.log('=== COMPRIMINDO FOTOS ===');
    
    // Comprime todas as fotos antes de enviar
    const dadosComprimidos = await this.photoCompression.compressAllPhotos(checklistCompleto);
    const dadosApi = this.transformarParaApiFormat(dadosComprimidos);
    
    console.log('Fotos comprimidas com sucesso');
    return this.salvarChecklist(dadosApi);
  }

  buscarTodos(limite: number = 100): Observable<any> {
    return this.http.get(`${this.baseUrl}/veicular_get.php?acao=todos&limite=${limite}`);
  }

  buscarPorPlaca(placa: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/veicular_get.php?acao=placa&placa=${placa}`);
  }

  buscarPorId(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/veicular_get.php?acao=id&id=${id}`);
  }

  buscarPorPeriodo(dataInicio: string, dataFim: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/veicular_get.php?acao=periodo&data_inicio=${dataInicio}&data_fim=${dataFim}`);
  }

  transformarParaApiFormat(checklist: ChecklistCompleto): any {
    const inspecaoInicial = checklist.inspecaoInicial;
    const inspecaoVeiculo = checklist.inspecaoVeiculo;
    const fotosVeiculo = checklist.fotosVeiculo || [];
    const pneus = checklist.pneus || [];

    // Debug logs
    console.log('Checklist completo:', checklist);
    console.log('Inspecao veiculo:', inspecaoVeiculo);
    console.log('Fotos veiculo:', fotosVeiculo);

    // Encontra itens específicos do motor
    const motorItens = inspecaoVeiculo?.motor || [];
    const aguaRadiador = motorItens.find(i => i.nome === 'Água Radiador');
    const aguaParabrisa = motorItens.find(i => i.nome === 'Água Limpador Parabrisa');
    const fluidoFreio = motorItens.find(i => i.nome === 'Fluido de Freio');
    const nivelOleo = motorItens.find(i => i.nome === 'Nível de Óleo');
    const tampaReservatorio = motorItens.find(i => i.nome === 'Tampa do Reservatório de Óleo');
    const tampaRadiador = motorItens.find(i => i.nome === 'Tampa do Radiador');

    // Encontra itens de limpeza
    const limpezaItens = inspecaoVeiculo?.limpeza || [];
    const limpezaInterna = limpezaItens.find(i => i.nome === 'Limpeza Interna');
    const limpezaExterna = limpezaItens.find(i => i.nome === 'Limpeza Externa');

    // Encontra fotos do veículo
    const fotoFrontal = fotosVeiculo.find(f => f.tipo === 'Foto Frontal');
    const fotoTraseira = fotosVeiculo.find(f => f.tipo === 'Foto Traseira');
    const fotoLateralDireita = fotosVeiculo.find(f => f.tipo === 'Foto Lateral Direita');
    const fotoLateralEsquerda = fotosVeiculo.find(f => f.tipo === 'Foto Lateral Esquerda');

    // Debug logs específicos - Motor
    console.log('=== MOTOR ===');
    console.log('Água Radiador encontrado:', aguaRadiador);
    console.log('Água Parabrisa encontrado:', aguaParabrisa);
    console.log('Fluido Freio encontrado:', fluidoFreio);
    console.log('Nível Óleo encontrado:', nivelOleo);
    console.log('Tampa Reservatório encontrado:', tampaReservatorio);
    console.log('Tampa Radiador encontrado:', tampaRadiador);
    
    // Debug logs específicos - Limpeza
    console.log('=== LIMPEZA ===');
    console.log('Limpeza Interna encontrada:', limpezaInterna);
    console.log('Limpeza Externa encontrada:', limpezaExterna);
    
    // Debug logs específicos - Fotos
    console.log('=== FOTOS VEÍCULO ===');
    console.log('Foto Frontal encontrada:', fotoFrontal);
    console.log('Foto Traseira encontrada:', fotoTraseira);
    console.log('Foto Lateral Direita encontrada:', fotoLateralDireita);
    console.log('Foto Lateral Esquerda encontrada:', fotoLateralEsquerda);

    // Encontra dados dos pneus
    const pneuDianteiraDireita = pneus.find(p => p.posicao === 'dianteira-direita');
    const pneuDianteiraEsquerda = pneus.find(p => p.posicao === 'dianteira-esquerda');
    const pneuTraseiraDireita = pneus.find(p => p.posicao === 'traseira-direita');
    const pneuTraseiraEsquerda = pneus.find(p => p.posicao === 'traseira-esquerda');
    const pneuEstepe = pneus.find(p => p.posicao === 'estepe');
    
    // Debug logs específicos - Pneus
    console.log('=== PNEUS ===');
    console.log('Pneu Dianteira Direita encontrado:', pneuDianteiraDireita);
    console.log('Pneu Dianteira Esquerda encontrado:', pneuDianteiraEsquerda);
    console.log('Pneu Traseira Direita encontrado:', pneuTraseiraDireita);
    console.log('Pneu Traseira Esquerda encontrado:', pneuTraseiraEsquerda);
    console.log('Pneu Estepe encontrado:', pneuEstepe);

    const dadosFinais = {
      placa: inspecaoInicial?.placa || '',
      km_inicial: inspecaoInicial?.kmInicial || 0,
      nivel_combustivel: inspecaoInicial?.nivelCombustivel || '0%',
      foto_km_inicial: inspecaoInicial?.fotoKmInicial || '',
      foto_combustivel: inspecaoInicial?.fotoCombustivel || '',
      foto_painel: inspecaoInicial?.fotoPainel || '',

      motor_agua_radiador: aguaRadiador?.valor || null,
      motor_agua_radiador_foto: aguaRadiador?.foto || '',
      motor_agua_parabrisa: aguaParabrisa?.valor || null,
      motor_agua_parabrisa_foto: aguaParabrisa?.foto || '',
      motor_fluido_freio: fluidoFreio?.valor || null,
      motor_fluido_freio_foto: fluidoFreio?.foto || '',
      motor_nivel_oleo: nivelOleo?.valor || null,
      motor_nivel_oleo_foto: nivelOleo?.foto || '',
      motor_tampa_reservatorio: tampaReservatorio?.valor || null,
      motor_tampa_reservatorio_foto: tampaReservatorio?.foto || '',
      motor_tampa_radiador: tampaRadiador?.valor || null,
      motor_tampa_radiador_foto: tampaRadiador?.foto || '',

      limpeza_interna: limpezaInterna?.valor || null,
      limpeza_interna_foto: limpezaInterna?.foto || '',
      limpeza_externa: limpezaExterna?.valor || null,
      limpeza_externa_foto: limpezaExterna?.foto || '',

      foto_frontal: fotoFrontal?.foto || '',
      foto_traseira: fotoTraseira?.foto || '',
      foto_lateral_direita: fotoLateralDireita?.foto || '',
      foto_lateral_esquerda: fotoLateralEsquerda?.foto || '',

      pneu_dianteira_direita: pneuDianteiraDireita?.valor || null,
      pneu_dianteira_direita_foto: pneuDianteiraDireita?.foto || '',
      pneu_dianteira_esquerda: pneuDianteiraEsquerda?.valor || null,
      pneu_dianteira_esquerda_foto: pneuDianteiraEsquerda?.foto || '',
      pneu_traseira_direita: pneuTraseiraDireita?.valor || null,
      pneu_traseira_direita_foto: pneuTraseiraDireita?.foto || '',
      pneu_traseira_esquerda: pneuTraseiraEsquerda?.valor || null,
      pneu_traseira_esquerda_foto: pneuTraseiraEsquerda?.foto || '',
      pneu_estepe: pneuEstepe?.valor || null,
      pneu_estepe_foto: pneuEstepe?.foto || ''
    };
    
    // Log final dos dados que serão enviados
    console.log('=== DADOS FINAIS PARA ENVIO ===');
    console.log('Total de campos:', Object.keys(dadosFinais).length);
    console.log('Dados completos:', dadosFinais);
    
    return dadosFinais;
  }
}
