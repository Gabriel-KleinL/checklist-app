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
  id?: number;
  placa: string;
  tipo_veiculo_id?: number;
  local?: string;
  km_inicial?: number | null;
  nivel_combustivel: NivelCombustivel;
  data_realizacao?: string;
  status_geral?: StatusGeral;
  usuario_nome?: string;
  usuario_id?: number | null;
  observacao_painel?: string;
  observacao_adicional?: string;
  // Campos da API
  itens_inspecao?: any[];
  itens_pneus?: any[];
  fotos?: any[];
  foto_painel?: string;
  foto_frontal?: string;
  foto_traseira?: string;
  foto_lateral_direita?: string;
  foto_lateral_esquerda?: string;
}

export interface ChecklistDetalhado extends Omit<ChecklistSimples, 'fotos' | 'itens_inspecao' | 'itens_pneus'> {
  foto_painel?: string;
  itens?: ItemInspecao[] | { [categoria: string]: ItemInspecao[] };
  fotos?: FotoVeiculo[] | { [tipo: string]: string };
  pneus?: PneuInspecao[];
  usuario?: {
    id?: number;
    nome?: string;
  } | null;
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
  valor: string | null;
  foto?: string;
  descricao?: string;
  tipo_resposta?: string;
  opcoes_resposta?: string[];
  tem_foto?: boolean;
  obrigatorio?: boolean;
}

export interface ItemEletrico {
  nome: string;
  valor: string | null;
  foto?: string;
  descricao?: string;
  tipo_resposta?: string;
  opcoes_resposta?: string[];
  tem_foto?: boolean;
  obrigatorio?: boolean;
}

export interface ItemLimpeza {
  nome: string;
  valor: string | null;
  foto?: string;
  descricao?: string;
  tipo_resposta?: string;
  opcoes_resposta?: string[];
  tem_foto?: boolean;
  obrigatorio?: boolean;
}

export interface ItemFerramenta {
  nome: string;
  valor: string | null;
  foto?: string;
  descricao?: string;
  tipo_resposta?: string;
  opcoes_resposta?: string[];
  tem_foto?: boolean;
  obrigatorio?: boolean;
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

export interface RegraInspecaoPneu {
  nome: string;
  valor: string | null;
  foto?: string;
  descricao?: string;
  tipo_resposta: string;
  opcoes_resposta?: string[];
  tem_foto: boolean;
  obrigatorio: boolean;
}

export interface PosicaoPneuInspecao {
  posicao_id: number;
  posicao_nome: string;
  pressao?: number;
  regras: RegraInspecaoPneu[];
}

/** @deprecated Use PosicaoPneuInspecao */
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
// TIPOS DE VEÍCULOS
// ============================================

export interface TipoVeiculo {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  icone?: string;
  data_criacao?: string;
  usuario_id?: number;
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
  tem_foto?: boolean;
  obrigatorio?: boolean;
  tipo_veiculo_id?: number | null; // null = item geral (associado via tabela de relacionamento)
  tipos_veiculo_associados?: number[]; // IDs dos tipos para itens gerais
  usuario_id?: number;
  usuario_nome?: string;
  data_criacao?: string;
}

export interface ConfigItemCompleto {
  id: number;
  categoria: CategoriaItemCompleto;
  nome_item: string;
  habilitado: boolean;
  tipo_veiculo_id?: number | null; // null = item geral (associado via tabela de relacionamento)
  tipos_veiculo_associados?: number[]; // IDs dos tipos para itens gerais
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

export type NomeTela = 'inspecao-inicial' | 'inspecao-veiculo' | 'fotos-veiculo' | 'pneus' | 'observacao-adicional';

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
  id?: number;
  placas?: string[];
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
  tipo_veiculo_id?: number;
  local?: string;
  km_inicial?: number | null;
  nivel_combustivel: NivelCombustivel;
  data_realizacao?: string;
  usuario_id?: number | null;
  usuario_nome?: string;
  inspecaoInicial?: InspecaoInicial;
  inspecaoVeiculo?: InspecaoVeiculo;
  fotosVeiculo?: FotoVeiculo[];
  pneus?: PneuInspecao[];
  // Campos da API para checklist completo
  foto_painel?: string;
  observacao_painel?: string;
  parte1?: any;
  parte2?: any;
  parte3?: any;
  parte4?: any;
  parte5?: any;
}

export interface InspecaoInicial {
  placa: string;
  kmInicial: number;
  nivelCombustivel: NivelCombustivel;
  fotoPainel?: string;
  observacaoPainel?: string;
}
