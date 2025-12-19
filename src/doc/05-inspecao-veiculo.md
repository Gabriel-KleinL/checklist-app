# 🔧 Inspeção do Veículo - Motor, Elétrico, Limpeza e Ferramentas

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

A tela de Inspeção do Veículo é a segunda etapa do checklist simples. Aqui o inspetor avalia 4 categorias principais do veículo: Motor, Elétrico, Limpeza e Ferramentas.

**Rota:** `/inspecao-veiculo`

**Arquivo:** `/home/user/checklist-app/src/app/inspecao-veiculo/inspecao-veiculo.page.ts`

**Posição no Fluxo:** Etapa 2 de 4

---

## 🎯 Objetivo

Avaliar condições técnicas e operacionais do veículo, documentando itens com problemas através de fotos e descrições.

---

## 📋 Categorias de Inspeção

### 1. MOTOR 🔴

**Itens Verificados:**
- Água do Radiador
- Água do Para-brisa
- Fluido de Freio
- Nível de Óleo
- Tampa do Radiador

**Status Possíveis:**
- ✅ **Bom** - Item em condição adequada
- ❌ **Ruim** - Item com problema (📸 foto obrigatória)

**Foto:** Obrigatória se status = "Ruim"

**Descrição:** Opcional (campo de texto)

---

### 2. ELÉTRICO 🔴

**Itens Verificados:**
- Seta Direita
- Seta Esquerda
- Pisca Alerta
- Faróis

**Status Possíveis:**
- ✅ **Bom** - Funcionando corretamente
- ❌ **Ruim** - Não funcionando ou com defeito (📸 foto obrigatória)

**Foto:** Obrigatória se status = "Ruim"

**Descrição:** Opcional

---

### 3. LIMPEZA 🔴

**Itens Verificados:**
- Limpeza Interna
- Limpeza Externa

**Status Possíveis:**
- 😞 **Péssima** - Muito suja (📸 foto obrigatória)
- 😐 **Ruim** - Suja (📸 foto obrigatória)
- 🙂 **Satisfatória** - Aceitável
- 😃 **Ótimo** - Muito limpa

**Foto:** Obrigatória se status = "Péssima" ou "Ruim"

**Descrição:** Opcional

---

### 4. FERRAMENTAS 🔴

**Itens Verificados:**
- Macaco
- Chave de Roda
- Chave de Roda Estepe
- Triângulo

**Status Possíveis:**
- ✅ **Contém** - Item presente
- ❌ **Não Contém** - Item ausente (📸 foto obrigatória)

**Foto:** Obrigatória se status = "Não Contém"

**Descrição:** Opcional

---

## 🎨 Interface

### Layout (Exemplo para Motor)
```
┌─────────────────────────────────┐
│  [Voltar]  INSPEÇÃO VEÍCULO     │
├─────────────────────────────────┤
│                                 │
│  🔧 MOTOR                       │
│  ───────────────────────────    │
│                                 │
│  Água do Radiador *             │
│  ┌──────────┬──────────┐        │
│  │   Bom    │   Ruim   │        │
│  └──────────┴──────────┘        │
│  [ ] 📷 Foto  [ ] 📝 Descrição  │
│                                 │
│  Água do Para-brisa *           │
│  ┌──────────┬──────────┐        │
│  │   Bom    │   Ruim   │        │
│  └──────────┴──────────┘        │
│                                 │
│  ... (outros itens)             │
│                                 │
│  ⚡ ELÉTRICO                    │
│  ───────────────────────────    │
│  ... (itens elétricos)          │
│                                 │
│  🧹 LIMPEZA                     │
│  ───────────────────────────    │
│  ... (itens limpeza)            │
│                                 │
│  🔨 FERRAMENTAS                 │
│  ───────────────────────────    │
│  ... (itens ferramentas)        │
│                                 │
│  ┌───────────────────────────┐ │
│  │      PRÓXIMO PASSO        │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

## ⚙️ Funcionalidades

### 1. Carregamento Dinâmico de Itens

**Itens são carregados da configuração do banco de dados:**
```typescript
async carregarItensHabilitados() {
  try {
    const response = await this.apiService.get(
      '/b_veicular_config_itens.php',
      { acao: 'habilitados' }
    );

    // Separar por categoria
    this.itensMotor = response.filter(i => i.categoria === 'MOTOR');
    this.itensEletrico = response.filter(i => i.categoria === 'ELETRICO');
    this.itensLimpeza = response.filter(i => i.categoria === 'LIMPEZA');
    this.itensFerramentas = response.filter(i => i.categoria === 'FERRAMENTA');

    // Inicializar dados dos itens
    this.inicializarDados();

  } catch (erro) {
    console.error('Erro ao carregar itens', erro);
  }
}

inicializarDados() {
  this.itensMotor.forEach(item => {
    this.dadosMotor[item.nome_item] = {
      status: null,
      foto: null,
      descricao: ''
    };
  });
  // ... repetir para outras categorias
}
```

**Estrutura de Item:**
```typescript
interface ConfigItem {
  id: number;
  categoria: 'MOTOR' | 'ELETRICO' | 'LIMPEZA' | 'FERRAMENTA';
  nome_item: string;
  habilitado: boolean;
}
```

---

### 2. Captura de Fotos por Categoria

**Motor:**
```typescript
async tirarFotoMotor(nomeItem: string) {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64
    });

    const fotoBase64 = `data:image/jpeg;base64,${image.base64String}`;

    // Comprimir
    this.dadosMotor[nomeItem].foto = await this.photoCompression.compress(
      fotoBase64,
      0.45,
      1200
    );

    // Salvar localmente
    this.salvarLocalmente();

  } catch (erro) {
    console.error('Erro ao tirar foto', erro);
  }
}
```

**Elétrico, Limpeza e Ferramentas:**
```typescript
async tirarFotoEletrico(nomeItem: string) { /* similar */ }
async tirarFotoLimpeza(nomeItem: string) { /* similar */ }
async tirarFotoFerramenta(nomeItem: string) { /* similar */ }
```

---

### 3. Validação de Fotos Obrigatórias

**Antes de permitir avançar:**
```typescript
validarFormulario(): boolean {
  const erros: string[] = [];

  // Motor - verificar itens "ruins"
  for (const [nome, dados] of Object.entries(this.dadosMotor)) {
    if (dados.status === 'ruim' && !dados.foto) {
      erros.push(`Foto obrigatória para: ${nome} (Motor)`);
    }
  }

  // Elétrico
  for (const [nome, dados] of Object.entries(this.dadosEletrico)) {
    if (dados.status === 'ruim' && !dados.foto) {
      erros.push(`Foto obrigatória para: ${nome} (Elétrico)`);
    }
  }

  // Limpeza
  for (const [nome, dados] of Object.entries(this.dadosLimpeza)) {
    if (['pessima', 'ruim'].includes(dados.status) && !dados.foto) {
      erros.push(`Foto obrigatória para: ${nome} (Limpeza)`);
    }
  }

  // Ferramentas
  for (const [nome, dados] of Object.entries(this.dadosFerramentas)) {
    if (dados.status === 'nao_contem' && !dados.foto) {
      erros.push(`Foto obrigatória para: ${nome} (Ferramentas)`);
    }
  }

  if (erros.length > 0) {
    this.mostrarErro(erros.join('\n'));
    return false;
  }

  return true;
}
```

---

### 4. Salvamento Automático Local

**Após cada alteração:**
```typescript
async salvarLocalmente() {
  const dados = {
    motor: this.dadosMotor,
    eletrico: this.dadosEletrico,
    limpeza: this.dadosLimpeza,
    ferramentas: this.dadosFerramentas,
    ultima_tela: 'veiculo',
    timestamp: new Date().toISOString()
  };

  await Preferences.set({
    key: 'inspecao_veiculo',
    value: JSON.stringify(dados)
  });
}

// Chamar em todos os ionChange
onStatusChange() {
  this.salvarLocalmente();
}
```

---

### 5. Atualizar Inspeção na API

**Ao clicar em "Próximo Passo":**
```typescript
async salvarInspecao() {
  if (!this.validarFormulario()) {
    return;
  }

  try {
    // Recuperar ID da inspeção
    const { value } = await Preferences.get({ key: 'inspecao_id' });
    const inspecaoId = parseInt(value);

    // Preparar itens para envio
    const itensInspecao = [
      ...this.prepararItensMotor(),
      ...this.prepararItensEletrico(),
      ...this.prepararItensLimpeza(),
      ...this.prepararItensFerramentas()
    ];

    // Atualizar na API
    const response = await this.apiService.post('/b_veicular_update.php', {
      id: inspecaoId,
      itens_inspecao: itensInspecao
    });

    if (response.sucesso) {
      this.router.navigate(['/fotos-veiculo']);
    }

  } catch (erro) {
    this.mostrarErro('Erro ao salvar inspeção');
  }
}

prepararItensMotor(): ItemInspecao[] {
  const itens: ItemInspecao[] = [];

  for (const [nome, dados] of Object.entries(this.dadosMotor)) {
    if (dados.status) {
      itens.push({
        categoria: 'MOTOR',
        item: nome,
        status: dados.status,
        foto: dados.foto || undefined,
        descricao: dados.descricao || undefined
      });
    }
  }

  return itens;
}
// ... métodos similares para outras categorias
```

---

### 6. Cores Indicativas de Status

**CSS Dinâmico:**
```scss
.status-btn {
  &.bom {
    --background: var(--ion-color-success);
  }

  &.ruim, &.nao_contem, &.pessima {
    --background: var(--ion-color-danger);
  }

  &.satisfatoria {
    --background: var(--ion-color-warning);
  }

  &.otimo {
    --background: var(--ion-color-primary);
  }

  &.contem {
    --background: var(--ion-color-success);
  }
}
```

**Aplicação no HTML:**
```html
<ion-button
  [class.bom]="dadosMotor['Água do Radiador'].status === 'bom'"
  [class.ruim]="dadosMotor['Água do Radiador'].status === 'ruim'"
  (click)="selecionarStatus('motor', 'Água do Radiador', 'bom')">
  Bom
</ion-button>
```

---

## ✅ Validações

### Status Obrigatórios
```typescript
validarStatusPreenchidos(): boolean {
  const erros: string[] = [];

  // Verificar se todos os itens habilitados têm status
  this.itensMotor.forEach(item => {
    if (!this.dadosMotor[item.nome_item]?.status) {
      erros.push(`Status obrigatório: ${item.nome_item} (Motor)`);
    }
  });

  // ... repetir para outras categorias

  if (erros.length > 0) {
    this.mostrarErro(erros.join('\n'));
    return false;
  }

  return true;
}
```

### Fotos Obrigatórias para Itens "Ruins"
- Motor: status "ruim" → foto obrigatória
- Elétrico: status "ruim" → foto obrigatória
- Limpeza: status "péssima" ou "ruim" → foto obrigatória
- Ferramentas: status "não contém" → foto obrigatória

---

## 📊 Estrutura de Dados

### Modelo de Item de Inspeção
```typescript
interface ItemInspecao {
  id?: number;
  inspecao_id?: number;
  categoria: 'MOTOR' | 'ELETRICO' | 'LIMPEZA' | 'FERRAMENTA';
  item: string;
  status: 'bom' | 'ruim' | 'pessima' | 'satisfatoria' | 'otimo' | 'contem' | 'nao_contem';
  foto?: string; // base64
  descricao?: string;
  data_registro?: string;
}
```

### Dados Salvos Localmente
```typescript
interface DadosInspecaoVeiculo {
  motor: { [nomeItem: string]: DadosItem };
  eletrico: { [nomeItem: string]: DadosItem };
  limpeza: { [nomeItem: string]: DadosItem };
  ferramentas: { [nomeItem: string]: DadosItem };
  ultima_tela: 'veiculo';
  timestamp: string;
}

interface DadosItem {
  status: string | null;
  foto: string | null;
  descricao: string;
}
```

---

## 🔄 Fluxo de Navegação

### Entrada
```
/inspecao-inicial → /inspecao-veiculo
```

### Saída (após salvar com sucesso)
```
/inspecao-veiculo → /fotos-veiculo
```

### Botão Voltar
```
/inspecao-veiculo → /inspecao-inicial
```

---

## 🎨 Estilos (SCSS)

```scss
.categoria-section {
  margin-bottom: 30px;

  .categoria-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--ion-color-primary);

    ion-icon {
      font-size: 28px;
    }

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: bold;
    }
  }
}

.item-inspecao {
  margin-bottom: 25px;
  padding: 15px;
  background: var(--ion-color-light);
  border-radius: 8px;

  .item-nome {
    font-weight: bold;
    margin-bottom: 10px;
    display: flex;
    align-items: center;

    .obrigatorio {
      color: var(--ion-color-danger);
      margin-left: 5px;
    }
  }

  .botoes-status {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;

    ion-button {
      flex: 1;
      margin: 0;
    }
  }

  .acoes-adicionais {
    display: flex;
    gap: 10px;
    margin-top: 10px;

    ion-button {
      flex: 1;
      --background: var(--ion-color-medium);
      height: 40px;
    }
  }
}

.preview-foto {
  margin-top: 10px;
  width: 100%;
  max-height: 150px;
  object-fit: cover;
  border-radius: 8px;
}
```

---

## 🧪 Casos de Teste

### Teste 1: Preencher Todos os Itens
```
1. Selecionar status para todos os itens de Motor
2. Selecionar status para todos os itens de Elétrico
3. Selecionar status para todos os itens de Limpeza
4. Selecionar status para todos os itens de Ferramentas
5. Clicar em "Próximo Passo"
✅ Deve salvar na API
✅ Deve navegar para /fotos-veiculo
```

### Teste 2: Item Ruim sem Foto
```
1. Selecionar "Ruim" para "Água do Radiador"
2. NÃO tirar foto
3. Clicar em "Próximo Passo"
✅ Deve exibir erro "Foto obrigatória para: Água do Radiador"
✅ Não deve avançar para próxima tela
```

### Teste 3: Tirar Foto para Item Ruim
```
1. Selecionar "Ruim" para "Seta Direita"
2. Clicar em "Foto"
3. Capturar foto
✅ Deve exibir miniatura da foto
✅ Deve permitir avançar se todos os campos estiverem ok
```

### Teste 4: Salvamento Automático
```
1. Selecionar status para alguns itens
2. Fechar app
3. Abrir app e retornar para /inspecao-veiculo
✅ Status selecionados devem estar salvos
✅ Fotos capturadas devem estar salvas
```

---

## 💡 Dicas para Desenvolvedores

### Adicionar Nova Categoria
```typescript
// 1. No HTML, adicionar seção
<div class="categoria-section">
  <div class="categoria-header">
    <ion-icon name="cog-outline"></ion-icon>
    <h2>NOVA CATEGORIA</h2>
  </div>
  <!-- itens -->
</div>

// 2. No TypeScript, adicionar arrays
itensNovaCategoria: ConfigItem[] = [];
dadosNovaCategoria: { [key: string]: DadosItem } = {};

// 3. Carregar itens
async carregarItensHabilitados() {
  this.itensNovaCategoria = response.filter(
    i => i.categoria === 'NOVA_CATEGORIA'
  );
}
```

### Debugar Validações
```typescript
console.log('Validando formulário...');
console.log('Motor:', this.dadosMotor);
console.log('Elétrico:', this.dadosEletrico);
console.log('Limpeza:', this.dadosLimpeza);
console.log('Ferramentas:', this.dadosFerramentas);
```

---

## 📚 Próximos Passos

Após completar a Inspeção do Veículo:

1. [Fotos do Veículo - 4 Ângulos](./06-fotos-veiculo.md)

---

## 🔗 Links Relacionados

- [Inspeção Inicial](./04-inspecao-inicial.md)
- [Fotos do Veículo](./06-fotos-veiculo.md)
- [API - Atualizar Checklist](./11-api.md#atualizar-checklist)
- [Modelos - ItemInspecao](./12-modelos.md#iteminspecao)

---

[← Voltar ao Índice](./index.md)
