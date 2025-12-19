# 📦 Modelos de Dados

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

Documentação completa de todos os modelos de dados (interfaces TypeScript) utilizados no aplicativo.

**Arquivo Principal:** `/home/user/checklist-app/src/app/models/checklist.models.ts`

---

## 📋 ChecklistSimples

### Descrição
Modelo principal para inspeções simples de veículos.

### Interface
```typescript
export interface ChecklistSimples {
  id?: number;
  placa: string;
  km_inicial: number | null;
  nivel_combustivel: '0%' | '25%' | '50%' | '75%' | '100%';
  data_realizacao?: string; // ISO 8601
  status_geral?: 'aprovado' | 'reprovado' | 'pendente';
  usuario_nome?: string;
  usuario_id?: number;
  observacao_painel?: string;

  // Relacionamentos
  itens_inspecao?: ItemInspecao[];
  itens_pneus?: PneuInspecao[];
  fotos?: FotoVeiculo[];

  // Fotos principais
  foto_painel?: string; // base64
  foto_frontal?: string;
  foto_traseira?: string;
  foto_lateral_direita?: string;
  foto_lateral_esquerda?: string;
}
```

### Exemplo de Uso
```typescript
const checklist: ChecklistSimples = {
  placa: 'ABC-1234',
  km_inicial: 50000,
  nivel_combustivel: '50%',
  status_geral: 'aprovado',
  usuario_id: 1,
  usuario_nome: 'João Silva'
};
```

---

## 🔧 ItemInspecao

### Descrição
Representa um item avaliado durante a inspeção (motor, elétrico, limpeza, ferramentas).

### Interface
```typescript
export interface ItemInspecao {
  id?: number;
  inspecao_id?: number;
  categoria: CategoriaItem;
  item: string;
  status: StatusItem;
  foto?: string; // base64
  descricao?: string;
  data_registro?: string;
}

export type CategoriaItem =
  | 'MOTOR'
  | 'ELETRICO'
  | 'LIMPEZA'
  | 'FERRAMENTA'
  | 'PNEU';

export type StatusItem =
  | 'bom'
  | 'ruim'
  | 'pessima'
  | 'satisfatoria'
  | 'otimo'
  | 'contem'
  | 'nao_contem';
```

### Exemplo de Uso
```typescript
const item: ItemInspecao = {
  categoria: 'MOTOR',
  item: 'Água do Radiador',
  status: 'ruim',
  foto: 'data:image/jpeg;base64,...',
  descricao: 'Vazamento detectado'
};
```

---

## 🛞 PneuInspecao

### Descrição
Dados de avaliação de um pneu específico.

### Interface
```typescript
export interface PneuInspecao {
  id?: number;
  inspecao_id?: number;
  nome: string; // "Dianteira Direita", etc.
  posicao?: string;
  valor: 'bom' | 'ruim' | null;
  pressao?: number; // PSI
  foto?: string; // base64
  descricao?: string;
  data_registro?: string;
}
```

### Exemplo de Uso
```typescript
const pneu: PneuInspecao = {
  nome: 'Dianteira Direita',
  valor: 'bom',
  pressao: 32,
  descricao: 'Pneu em boas condições'
};
```

---

## 📸 FotoVeiculo

### Descrição
Fotos das 4 perspectivas obrigatórias do veículo.

### Interface
```typescript
export interface FotoVeiculo {
  id?: number;
  inspecao_id?: number;
  tipo: TipoFoto;
  foto: string; // base64
  data_registro?: string;
}

export type TipoFoto =
  | 'Foto Frontal'
  | 'Foto Traseira'
  | 'Foto Lateral Direita'
  | 'Foto Lateral Esquerda';
```

### Exemplo de Uso
```typescript
const foto: FotoVeiculo = {
  tipo: 'Foto Frontal',
  foto: 'data:image/jpeg;base64,...'
};
```

---

## 📋 ChecklistCompleto

### Descrição
Modelo para inspeções completas (5 partes) de veículos pesados.

### Interface
```typescript
export interface ChecklistCompleto {
  id?: number;
  placa: string;
  km_inicial?: number;
  nivel_combustivel: NivelCombustivel;
  data_realizacao?: string;
  usuario_id?: number;
  usuario_nome?: string;
  foto_painel?: string;
  observacao_painel?: string;

  // 5 Partes da inspeção
  parte1: Parte1; // Interna
  parte2: Parte2; // Equipamentos
  parte3: Parte3; // Dianteira
  parte4: Parte4; // Traseira
  parte5: Parte5; // Veículos Pesados
}

export type NivelCombustivel = '0%' | '25%' | '50%' | '75%' | '100%';
```

---

## 🚌 Partes do Checklist Completo

### Parte1 (Interna)
```typescript
export interface Parte1 {
  buzina?: ItemAvaliacao;
  cintos?: ItemAvaliacao;
  espelho_interno?: ItemAvaliacao;
  freio_mao?: ItemAvaliacao;
  limpadores?: ItemAvaliacao;
  quebra_sol?: ItemAvaliacao;
  velocimetro?: ItemAvaliacao;
  luzes_painel?: ItemAvaliacao;
  luz_interna?: ItemAvaliacao;
  puxadores?: ItemAvaliacao;
  estado_interno?: ItemAvaliacao;
}
```

### Parte2 (Equipamentos)
```typescript
export interface Parte2 {
  espelho_esquerdo?: ItemAvaliacao;
  espelho_direito?: ItemAvaliacao;
  extintor?: ItemAvaliacao;
  chave_roda?: ItemAvaliacao;
  macaco?: ItemAvaliacao;
  triangulo?: ItemAvaliacao;
  estepe?: ItemAvaliacao;
}
```

### Parte3 (Dianteira)
```typescript
export interface Parte3 {
  farois?: ItemAvaliacao;
  setas_dianteiras?: ItemAvaliacao;
  lanternas_dianteiras?: ItemAvaliacao;
  pneus_dianteiros?: ItemAvaliacao;
  parachoque_dianteiro?: ItemAvaliacao;
  capo?: ItemAvaliacao;
  parabrisa?: ItemAvaliacao;
}
```

### Parte4 (Traseira)
```typescript
export interface Parte4 {
  lanternas_traseiras?: ItemAvaliacao;
  luz_re?: ItemAvaliacao;
  setas_traseiras?: ItemAvaliacao;
  luz_freio?: ItemAvaliacao;
  alarme_re?: ItemAvaliacao;
  parachoque_traseiro?: ItemAvaliacao;
  lacre_placa?: ItemAvaliacao;
  pneus_traseiros?: ItemAvaliacao;
  protetores?: ItemAvaliacao;
  carroceria?: ItemAvaliacao;
  escapamento?: ItemAvaliacao;
  ferrugem?: ItemAvaliacao;
  freios?: ItemAvaliacao;
  logotipo?: ItemAvaliacao;
  vazamentos?: ItemAvaliacao;
}
```

### Parte5 (Veículos Pesados)
```typescript
export interface Parte5 {
  certificado_ceturb?: ItemAvaliacao;
  fumaca_preta?: ItemAvaliacao;
  corrosao?: ItemAvaliacao;
  ancoragem_eixo?: ItemAvaliacao;
  protetores_roda?: ItemAvaliacao;
  freio?: ItemAvaliacao;
  alarme_re?: ItemAvaliacao;
  lona?: ItemAvaliacao;
  bomba?: ItemAvaliacao;
  adesivos_reflexivos?: ItemAvaliacao;
  altura_parachoque?: ItemAvaliacao;
  mangueiras?: ItemAvaliacao;
}
```

### ItemAvaliacao
```typescript
export interface ItemAvaliacao {
  status?: 'bom' | 'ruim' | 'contem' | 'nao_contem' | null;
  foto?: string; // base64
  descricao?: string;
}
```

---

## ⚠️ Anomalia

### Descrição
Registro de defeito/problema detectado em uma inspeção.

### Interface
```typescript
export interface Anomalia {
  id?: number;
  placa: string;
  categoria: CategoriaItem;
  item: string;
  status: StatusItem;
  status_anomalia?: StatusAnomalia;
  foto?: string; // base64
  descricao?: string;
  observacao?: string; // Observação do admin
  data_registro?: string;
  data_resolucao?: string;
  usuario_registro?: string;
  usuario_resolucao?: string;
}

export type StatusAnomalia =
  | 'ativo'
  | 'aprovado'
  | 'reprovado'
  | 'finalizado';
```

### Exemplo de Uso
```typescript
const anomalia: Anomalia = {
  placa: 'ABC-1234',
  categoria: 'MOTOR',
  item: 'Água do Radiador',
  status: 'ruim',
  status_anomalia: 'ativo',
  foto: 'data:image/jpeg;base64,...',
  descricao: 'Vazamento',
  usuario_registro: 'João Silva'
};
```

---

## ⚙️ ConfigItem

### Descrição
Configuração de itens disponíveis para inspeção.

### Interface
```typescript
export interface ConfigItem {
  id: number;
  categoria: CategoriaItem;
  nome_item: string;
  habilitado: boolean;
  usuario_id?: number;
  usuario_nome?: string;
  data_criacao?: string;
}
```

### Exemplo de Uso
```typescript
const item: ConfigItem = {
  id: 1,
  categoria: 'MOTOR',
  nome_item: 'Água do Radiador',
  habilitado: true,
  usuario_id: 1,
  usuario_nome: 'Admin'
};
```

---

## 👤 Usuario

### Descrição
Dados de usuário do sistema.

### Interface
```typescript
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  tutorial_concluido?: boolean;
  data_criacao?: string;
}

export type TipoUsuario = 'admin' | 'inspetor';
```

### Exemplo de Uso
```typescript
const usuario: Usuario = {
  id: 1,
  nome: 'João Silva',
  email: 'joao@example.com',
  tipo: 'inspetor',
  tutorial_concluido: true
};
```

---

## ⏱️ TempoTela

### Descrição
Rastreamento de tempo gasto em cada tela.

### Interface
```typescript
export interface TempoTela {
  id?: number;
  usuario_id: number;
  tela: string; // nome da tela/rota
  tempo_segundos: number;
  data: string; // ISO 8601
}
```

### Exemplo de Uso
```typescript
const tempo: TempoTela = {
  usuario_id: 1,
  tela: 'inspecao_inicial',
  tempo_segundos: 45.5,
  data: new Date().toISOString()
};
```

---

## 📊 Metricas

### Descrição
Estatísticas gerais do sistema.

### Interface
```typescript
export interface Metricas {
  totalInspecoes: number;
  anomaliasAtivas: number;
  anomaliasFinalizadas: number;
  totalVeiculos: number;
  inspecoesHoje: number;
  inspecoesSemana: number;
  taxaAprovacao: number; // porcentagem

  // Arrays para gráficos
  topVeiculosProblemas?: Array<{
    placa: string;
    total: number;
  }>;

  categoriasProblemas?: Array<{
    categoria: CategoriaItem;
    total: number;
  }>;

  inspecoesPorMes?: number[]; // últimos 12 meses
}
```

---

## 🔗 Links Relacionados

- [API](./11-api.md)
- [Serviços](./13-servicos.md)
- [Fluxo de Dados](./10-fluxo-dados.md)

---

[← Voltar ao Índice](./index.md)
