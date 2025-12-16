// ============================================
// CONSTANTES DA APLICAÇÃO
// ============================================

export const APP_CONSTANTS = {
  // Configuração de Câmera
  CAMERA: {
    QUALITY: 45,
    QUALITY_HIGH: 100,
    MAX_WIDTH: 800,
    MAX_HEIGHT: 800,
    MAX_WIDTH_LARGE: 1200,
  },

  // Configuração de Compressão de Fotos
  COMPRESSION: {
    DEFAULT_QUALITY: 0.6,
    DEFAULT_MAX_WIDTH: 1200,
    MIN_QUALITY: 0.1,
    MAX_QUALITY: 1.0,
  },

  // Cache
  CACHE: {
    DURATION_MS: 5 * 60 * 1000, // 5 minutos
    ANOMALIAS_DURATION_MS: 5 * 60 * 1000,
  },

  // Limites de Requisição
  API: {
    DEFAULT_LIMIT: 100,
    MAX_LIMIT: 1000,
    TIMEOUT_MS: 30000, // 30 segundos
  },

  // Mensagens de Erro Padrão
  MESSAGES: {
    ERROR: {
      GENERIC: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
      NETWORK: 'Erro de conexão. Verifique sua internet.',
      TIMEOUT: 'A requisição demorou muito. Tente novamente.',
      NOT_FOUND: 'Recurso não encontrado.',
      UNAUTHORIZED: 'Você não tem permissão para esta ação.',
      VALIDATION: 'Por favor, preencha todos os campos obrigatórios.',
      PHOTO_REQUIRED: 'Por favor, tire uma foto do item marcado como problema.',
    },
    SUCCESS: {
      SAVED: 'Dados salvos com sucesso!',
      UPDATED: 'Atualizado com sucesso!',
      DELETED: 'Removido com sucesso!',
      APPROVED: 'Aprovado com sucesso!',
    },
  },

  // Toast/Alert Configurações
  TOAST: {
    DURATION: 3000,
    DURATION_SHORT: 2000,
    DURATION_LONG: 5000,
    POSITION: 'bottom' as const,
  },

  // Categorias
  CATEGORIAS: {
    SIMPLES: [
      { key: 'MOTOR', label: 'Motor', icon: 'construct-outline', color: '#3880ff' },
      { key: 'ELETRICO', label: 'Elétrico', icon: 'flash-outline', color: '#ffc409' },
      { key: 'LIMPEZA', label: 'Limpeza', icon: 'water-outline', color: '#2dd36f' },
      { key: 'FERRAMENTA', label: 'Ferramentas', icon: 'build-outline', color: '#eb445a' },
      { key: 'PNEU', label: 'Pneus', icon: 'ellipse-outline', color: '#3dc2ff' },
    ],
    COMPLETO: [
      { key: 'PARTE1_INTERNA', label: 'Parte 1 - Interna', icon: 'car-outline', color: '#3880ff' },
      { key: 'PARTE2_EQUIPAMENTOS', label: 'Parte 2 - Equipamentos', icon: 'construct-outline', color: '#ffc409' },
      { key: 'PARTE3_DIANTEIRA', label: 'Parte 3 - Dianteira', icon: 'arrow-up-outline', color: '#2dd36f' },
      { key: 'PARTE4_TRASEIRA', label: 'Parte 4 - Traseira', icon: 'arrow-down-outline', color: '#eb445a' },
      { key: 'PARTE5_ESPECIAL', label: 'Parte 5 - Veículos Pesados', icon: 'bus-outline', color: '#3dc2ff' },
    ],
  },

  // Mapeamento de Cores por Status
  STATUS_COLORS: {
    bom: 'success',
    otimo: 'success',
    satisfatoria: 'warning',
    ruim: 'danger',
    pessima: 'danger',
    regular: 'warning',
    critico: 'danger',
    contem: 'success',
    nao_contem: 'danger',
  },

  // Mapeamento de Labels
  STATUS_LABELS: {
    pessima: 'Péssima',
    ruim: 'Ruim',
    satisfatoria: 'Satisfatória',
    otimo: 'Ótimo',
    bom: 'Bom',
    contem: 'Contém',
    nao_contem: 'Não Contém',
  },

  // Nomes de Telas
  TELA_NAMES: {
    'inspecao-inicial': 'Inspeção Inicial',
    'inspecao-veiculo': 'Inspeção do Veículo',
    'fotos-veiculo': 'Fotos do Veículo',
    'pneus': 'Pneus',
  },

  // Mapeamento de Categorias
  CATEGORIA_LABELS: {
    MOTOR: 'Motor',
    ELETRICO: 'Elétrico',
    LIMPEZA: 'Limpeza',
    FERRAMENTA: 'Ferramentas',
    PNEU: 'Pneus',
    PARTE1_INTERNA: 'Parte 1 - Interna',
    PARTE2_EQUIPAMENTOS: 'Parte 2 - Equipamentos',
    PARTE3_DIANTEIRA: 'Parte 3 - Dianteira',
    PARTE4_TRASEIRA: 'Parte 4 - Traseira',
    PARTE5_ESPECIAL: 'Parte 5 - Veículos Pesados',
  },

  // Emojis de Categorias
  CATEGORIA_EMOJIS: {
    MOTOR: '🔧',
    ELETRICO: '⚡',
    LIMPEZA: '💧',
    FERRAMENTA: '🔨',
    PNEU: '⭕',
    PARTE1_INTERNA: '🚗',
    PARTE2_EQUIPAMENTOS: '🔧',
    PARTE3_DIANTEIRA: '⬆️',
    PARTE4_TRASEIRA: '⬇️',
    PARTE5_ESPECIAL: '🚛',
  },

  // Cores de gráficos
  CHART_COLORS: [
    '#3880ff', '#2dd36f', '#ffc409', '#eb445a', '#3dc2ff',
    '#5260ff', '#2fdf75', '#ffd534', '#ff4961', '#50c8ff',
    '#7044ff', '#10dc60', '#ffce00', '#f04141', '#7a49f8',
  ],

  // Validação
  VALIDATION: {
    PLACA_REGEX: /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/,
    MIN_KM: 0,
    MAX_KM: 9999999,
  },

  // LocalStorage Keys
  STORAGE_KEYS: {
    INSPECAO_INICIAL: 'inspecao_inicial',
    INSPECAO_VEICULO: 'inspecao_veiculo',
    FOTOS_VEICULO: 'fotos_veiculo',
    PNEUS: 'pneus',
    USER_TOKEN: 'user_token',
    USER_DATA: 'user_data',
    TUTORIAL_COMPLETED: 'tutorial_completed',
  },
};

// Exporta individualmente para facilitar importação
export const CAMERA_CONFIG = APP_CONSTANTS.CAMERA;
export const COMPRESSION_CONFIG = APP_CONSTANTS.COMPRESSION;
export const CACHE_CONFIG = APP_CONSTANTS.CACHE;
export const API_CONFIG = APP_CONSTANTS.API;
export const MESSAGES = APP_CONSTANTS.MESSAGES;
export const TOAST_CONFIG = APP_CONSTANTS.TOAST;
export const CATEGORIAS = APP_CONSTANTS.CATEGORIAS;
export const STATUS_COLORS = APP_CONSTANTS.STATUS_COLORS;
export const STATUS_LABELS = APP_CONSTANTS.STATUS_LABELS;
export const TELA_NAMES = APP_CONSTANTS.TELA_NAMES;
export const CATEGORIA_LABELS = APP_CONSTANTS.CATEGORIA_LABELS;
export const CATEGORIA_EMOJIS = APP_CONSTANTS.CATEGORIA_EMOJIS;
export const CHART_COLORS = APP_CONSTANTS.CHART_COLORS;
export const VALIDATION = APP_CONSTANTS.VALIDATION;
export const STORAGE_KEYS = APP_CONSTANTS.STORAGE_KEYS;
