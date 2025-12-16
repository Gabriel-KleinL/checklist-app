// ============================================
// INTERFACES DE CHECKLIST
// ============================================

export type StatusGeral = 'aprovado' | 'reprovado' | 'pendente';
export type StatusItem = 'bom' | 'ruim';
export type StatusLimpeza = 'pessima' | 'ruim' | 'satisfatoria' | 'otimo';
export type StatusFerramenta = 'contem' | 'nao_contem';
export type NivelCombustivel = '0%' | '25%' | '50%' | '75%' | '100%';

// ============================================
// CHECKLIST SIMPLES
// ============================================

export interface ChecklistSimples {
  id: number;
  placa: string;
  km_inicial: number;
  nivel_combustivel: NivelCombustivel;
  data_realizacao: string;
  status_geral?: StatusGeral;
  usuario_nome?: string;
  usuario_id?: number;
  observacao_painel?: string;
}

export interface ChecklistDetalhado extends ChecklistSimples {
  foto_painel?: string;
  itens: ItemInspecao[];
  fotos: FotoVeiculo[];
  pneus: PneuInspecao[];
}

// ============================================
// ITENS DE INSPEÇÃO
// ============================================

export interface ItemInspecao {
  id?: number;
  inspecao_id?: number;
  categoria: CategoriaItem;
  item: string;
  status: string;
  foto?: string;
  descricao?: string;
  data_registro?: string;
}

export interface ItemMotor {
  nome: string;
  valor: StatusItem | null;
  foto?: string;
  descricao?: string;
}

export interface ItemEletrico {
  nome: string;
  valor: StatusItem | null;
  foto?: string;
  descricao?: string;
}

export interface ItemLimpeza {
  nome: string;
  valor: StatusLimpeza | null;
  foto?: string;
  descricao?: string;
}

export interface ItemFerramenta {
  nome: string;
  valor: StatusFerramenta | null;
  foto?: string;
  descricao?: string;
}

// ============================================
// INSPEÇÃO DE VEÍCULO
// ============================================

export interface InspecaoVeiculo {
  motor: ItemMotor[];
  limpeza: ItemLimpeza[];
  eletricos: ItemEletrico[];
  ferramentas: ItemFerramenta[];
}

// ============================================
// PNEUS
// ============================================

export interface PneuInspecao {
  id?: number;
  inspecao_id?: number;
  nome: string;
  posicao?: string;
  valor: StatusItem | null;
  pressao?: number;
  foto?: string;
  data_registro?: string;
}

// ============================================
// FOTOS DO VEÍCULO
// ============================================

export type TipoFoto = 'Foto Frontal' | 'Foto Traseira' | 'Foto Lateral Direita' | 'Foto Lateral Esquerda';

export interface FotoVeiculo {
  id?: number;
  inspecao_id?: number;
  tipo: TipoFoto;
  foto: string;
  data_registro?: string;
}

// ============================================
// CONFIGURAÇÃO DE ITENS
// ============================================

export type CategoriaItem = 'MOTOR' | 'ELETRICO' | 'LIMPEZA' | 'FERRAMENTA' | 'PNEU';
export type CategoriaItemCompleto = 'PARTE1_INTERNA' | 'PARTE2_EQUIPAMENTOS' | 'PARTE3_DIANTEIRA' | 'PARTE4_TRASEIRA' | 'PARTE5_ESPECIAL';

export interface ConfigItem {
  id: number;
  categoria: CategoriaItem;
  nome_item: string;
  habilitado: boolean;
  usuario_id?: number;
  usuario_nome?: string;
  data_criacao?: string;
}

export interface ConfigItemCompleto {
  id: number;
  categoria: CategoriaItemCompleto;
  nome_item: string;
  habilitado: boolean;
  usuario_id?: number;
  usuario_nome?: string;
  data_criacao?: string;
}

// ============================================
// ANOMALIAS
// ============================================

export type StatusAnomalia = 'ativo' | 'aprovado' | 'reprovado' | 'finalizado';

export interface Anomalia {
  id?: number;
  placa: string;
  categoria: CategoriaItem;
  item: string;
  status: string;
  status_anomalia?: StatusAnomalia;
  foto?: string;
  descricao?: string;
  observacao?: string;
  data_registro?: string;
  data_resolucao?: string;
  usuario_registro?: string;
  usuario_resolucao?: string;
}

export interface VeiculoComAnomalias {
  placa: string;
  total_problemas: number;
  anomalias: Anomalia[];
  usuarios?: string[];
}

// ============================================
// TEMPO DE TELAS
// ============================================

export type NomeTela = 'inspecao-inicial' | 'inspecao-veiculo' | 'fotos-veiculo' | 'pneus';

export interface TempoTela {
  id?: number;
  inspecao_id?: number;
  usuario_id?: number;
  nome_tela: NomeTela;
  tempo_segundos: number;
  data_registro?: string;
}

// ============================================
// USUÁRIO
// ============================================

export type TipoUsuario = 'admin' | 'inspetor';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  tutorial_concluido?: boolean;
  data_criacao?: string;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  sucesso?: boolean;
  erro?: string;
  mensagem?: string;
  dados?: T;
  detalhes?: string;
}

export interface ApiErrorResponse {
  erro: string;
  mensagem?: string;
  detalhes?: string;
  codigo?: number;
}

// ============================================
// CHECKLIST COMPLETO (Sistema V2)
// ============================================

export interface ChecklistCompleto {
  id?: number;
  placa: string;
  km_inicial: number;
  nivel_combustivel: NivelCombustivel;
  data_realizacao?: string;
  usuario_id?: number;
  usuario_nome?: string;
  inspecaoInicial?: InspecaoInicial;
  inspecaoVeiculo?: InspecaoVeiculo;
  fotosVeiculo?: FotoVeiculo[];
  pneus?: PneuInspecao[];
}

export interface InspecaoInicial {
  placa: string;
  kmInicial: number;
  nivelCombustivel: NivelCombustivel;
  fotoPainel?: string;
  observacaoPainel?: string;
}
