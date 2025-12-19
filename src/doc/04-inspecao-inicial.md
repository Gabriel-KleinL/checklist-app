# 📋 Inspeção Inicial - Placa, KM e Combustível

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

A tela de Inspeção Inicial é a primeira etapa do processo de checklist simples. Aqui o inspetor registra informações básicas do veículo: placa, quilometragem, nível de combustível e foto do painel.

**Rota:** `/inspecao-inicial`

**Arquivo:** `/home/user/checklist-app/src/app/inspecao-inicial/inspecao-inicial.page.ts`

**Posição no Fluxo:** Etapa 1 de 4

---

## 🎯 Objetivo

Coletar dados iniciais do veículo e criar o registro de inspeção no banco de dados.

---

## 📋 Campos do Formulário

### 1. Placa do Veículo 🔴
- **Tipo:** Campo de texto com autocomplete
- **Formato:** ABC-1234 ou ABC1D23 (Mercosul)
- **Obrigatório:** Sim
- **Validação:** Deve existir no banco de dados
- **Funcionalidade:** Sugestões enquanto digita

**Exemplo:**
```typescript
onPlacaInput(event: any) {
  const termo = event.target.value;

  if (termo.length >= 3) {
    this.buscarPlacas(termo);
  }
}

async buscarPlacas(termo: string) {
  const placas = await this.apiService.get('/b_buscar_placas.php', {
    termo,
    limite: 5
  });

  this.sugestoesPlacas = placas;
}
```

---

### 2. KM Inicial
- **Tipo:** Campo numérico
- **Obrigatório:** Não (pode ser null)
- **Validação:** Apenas números
- **Placeholder:** "Digite a quilometragem atual"

---

### 3. Nível de Combustível 🔴
- **Tipo:** Dropdown (ion-select)
- **Obrigatório:** Sim
- **Opções:**
  - 0% (Vazio)
  - 25% (1/4)
  - 50% (1/2)
  - 75% (3/4)
  - 100% (Cheio)

**Interface:**
```typescript
nivelCombustivel: '0%' | '25%' | '50%' | '75%' | '100%';
```

---

### 4. Foto do Painel 🔴 📸
- **Tipo:** Captura de imagem
- **Obrigatório:** Sim
- **Função:** `tirarFotoPainel()`
- **Formato:** Base64
- **Compressão:** 45% de qualidade

**Implementação:**
```typescript
async tirarFotoPainel() {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    });

    // Armazenar foto
    this.fotoPainel = `data:image/jpeg;base64,${image.base64String}`;

    // Comprimir antes de salvar
    this.fotoPainelComprimida = await this.photoCompression.compress(
      this.fotoPainel,
      0.45, // 45% qualidade
      1200  // max width
    );

  } catch (erro) {
    console.error('Erro ao capturar foto', erro);
    this.mostrarErro('Não foi possível capturar a foto');
  }
}
```

---

### 5. Observação do Painel
- **Tipo:** Área de texto (textarea)
- **Obrigatório:** Não
- **Placeholder:** "Observações sobre o painel (opcional)"
- **Limite:** 500 caracteres

---

## 🎨 Interface

### Layout
```
┌─────────────────────────────────┐
│  [Voltar]   INSPEÇÃO INICIAL    │
├─────────────────────────────────┤
│                                 │
│  📝 Dados do Veículo            │
│                                 │
│  Placa *                        │
│  ┌───────────────────────────┐ │
│  │ ABC-1234         [🔍]     │ │
│  └───────────────────────────┘ │
│  Sugestões: ABC-1200, ABC-1234  │
│                                 │
│  KM Inicial                     │
│  ┌───────────────────────────┐ │
│  │ 50000                     │ │
│  └───────────────────────────┘ │
│                                 │
│  Nível de Combustível *         │
│  ┌───────────────────────────┐ │
│  │ 50% (1/2)            [▼] │ │
│  └───────────────────────────┘ │
│                                 │
│  Foto do Painel *               │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │      📷 TIRAR FOTO        │ │
│  │                           │ │
│  └───────────────────────────┘ │
│  [Miniatura da foto]            │
│                                 │
│  Observações                    │
│  ┌───────────────────────────┐ │
│  │ Texto opcional...         │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │      PRÓXIMO PASSO        │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

## ⚙️ Funcionalidades

### 1. Autocomplete de Placas
**Busca Dinâmica:**
```typescript
// Debounce para não fazer requisições a cada tecla
private searchSubject = new Subject<string>();

ngOnInit() {
  this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged()
  ).subscribe(termo => {
    this.buscarPlacas(termo);
  });
}

onPlacaInput(event: any) {
  const termo = event.target.value.toUpperCase();
  this.searchSubject.next(termo);
}
```

**Endpoint:** `GET /b_buscar_placas.php?termo={placa}&limite=5`

---

### 2. Validação de Placa no Banco
**Antes de salvar, verifica se a placa existe:**
```typescript
async validarPlaca(placa: string): Promise<boolean> {
  try {
    const response = await this.apiService.get('/b_validar_placa.php', {
      placa
    });

    if (!response.existe) {
      this.mostrarErro('Placa não encontrada no sistema');
      return false;
    }

    return true;
  } catch (erro) {
    this.mostrarErro('Erro ao validar placa');
    return false;
  }
}
```

---

### 3. Salvamento Automático Local
**Dados salvos após cada alteração:**
```typescript
async salvarLocalmente() {
  const dados = {
    placa: this.placa,
    km_inicial: this.kmInicial,
    nivel_combustivel: this.nivelCombustivel,
    foto_painel: this.fotoPainelComprimida,
    observacao_painel: this.observacaoPainel,
    ultima_tela: 'inicial',
    timestamp: new Date().toISOString()
  };

  await Preferences.set({
    key: 'inspecao_em_andamento',
    value: JSON.stringify(dados)
  });
}

// Chamar sempre que um campo for alterado
ionChange() {
  this.salvarLocalmente();
}
```

---

### 4. Criar Inspeção na API
**Ao clicar em "Próximo Passo":**
```typescript
async salvarInspecao() {
  // 1. Validar campos obrigatórios
  if (!this.validarFormulario()) {
    return;
  }

  // 2. Validar placa no banco
  const placaValida = await this.validarPlaca(this.placa);
  if (!placaValida) {
    return;
  }

  try {
    // 3. Criar inspeção na API
    const response = await this.apiService.post('/b_veicular_set.php', {
      placa: this.placa,
      km_inicial: this.kmInicial,
      nivel_combustivel: this.nivelCombustivel,
      foto_painel: this.fotoPainelComprimida,
      observacao_painel: this.observacaoPainel,
      usuario_id: this.usuarioId,
      usuario_nome: this.usuarioNome
    });

    if (response.sucesso) {
      // 4. Armazenar ID da inspeção
      await Preferences.set({
        key: 'inspecao_id',
        value: response.id.toString()
      });

      // 5. Salvar no serviço compartilhado
      this.checklistDataService.setInspecaoId(response.id);
      this.checklistDataService.setPlaca(this.placa);

      // 6. Navegar para próxima tela
      this.router.navigate(['/inspecao-veiculo']);
    }

  } catch (erro) {
    this.mostrarErro('Erro ao salvar inspeção');
  }
}
```

---

### 5. Tutorial na Primeira Vez
**Driver.js para guiar o usuário:**
```typescript
async verificarPrimeiroAcesso() {
  const { value } = await Preferences.get({
    key: 'tutorial_inspecao_inicial_concluido'
  });

  if (value !== 'true') {
    this.iniciarTutorial();
  }
}

iniciarTutorial() {
  const driver = new Driver({
    animate: true,
    opacity: 0.75,
    onReset: () => {
      Preferences.set({
        key: 'tutorial_inspecao_inicial_concluido',
        value: 'true'
      });
    }
  });

  driver.highlight({
    steps: [
      {
        element: '#campo-placa',
        popover: {
          title: 'Placa do Veículo',
          description: 'Digite a placa. Sugestões aparecerão automaticamente.',
          position: 'bottom'
        }
      },
      {
        element: '#campo-km',
        popover: {
          title: 'Quilometragem',
          description: 'Informe o KM atual do veículo.',
          position: 'bottom'
        }
      },
      {
        element: '#campo-combustivel',
        popover: {
          title: 'Nível de Combustível',
          description: 'Selecione o nível aproximado de combustível.',
          position: 'bottom'
        }
      },
      {
        element: '#btn-foto-painel',
        popover: {
          title: 'Foto do Painel',
          description: 'Tire uma foto do painel do veículo. Obrigatório.',
          position: 'top'
        }
      }
    ]
  });

  driver.start();
}
```

---

### 6. Rastreamento de Tempo
**Registra tempo gasto nesta tela:**
```typescript
tempoInicio: number;

ionViewDidEnter() {
  this.tempoInicio = Date.now();
}

async ionViewWillLeave() {
  const tempoFim = Date.now();
  const tempoGasto = (tempoFim - this.tempoInicio) / 1000; // segundos

  // Enviar para API
  await this.tempoTelasService.registrar({
    usuario_id: this.usuarioId,
    tela: 'inspecao_inicial',
    tempo_segundos: tempoGasto
  });
}
```

---

## ✅ Validações

### Campos Obrigatórios
```typescript
validarFormulario(): boolean {
  const erros = [];

  // Placa
  if (!this.placa || this.placa.trim() === '') {
    erros.push('Placa é obrigatória');
  }

  // Nível de Combustível
  if (!this.nivelCombustivel) {
    erros.push('Nível de combustível é obrigatório');
  }

  // Foto do Painel
  if (!this.fotoPainel) {
    erros.push('Foto do painel é obrigatória');
  }

  if (erros.length > 0) {
    this.mostrarErro(erros.join('\n'));
    return false;
  }

  return true;
}
```

### Formato de Placa
```typescript
validarFormatoPlaca(placa: string): boolean {
  // Formato antigo: ABC-1234
  const regexAntigo = /^[A-Z]{3}-\d{4}$/;

  // Formato Mercosul: ABC1D23
  const regexMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/;

  return regexAntigo.test(placa) || regexMercosul.test(placa);
}
```

---

## 🔄 Fluxo de Navegação

### Entrada
```
/home → /inspecao-inicial
```

### Saída (após salvar com sucesso)
```
/inspecao-inicial → /inspecao-veiculo
```

### Botão Voltar
```
/inspecao-inicial → /home (com confirmação se há dados preenchidos)
```

---

## 📊 Dados Salvos

### Local Storage (Capacitor Preferences)
```typescript
interface DadosInspecaoInicial {
  placa: string;
  km_inicial: number | null;
  nivel_combustivel: '0%' | '25%' | '50%' | '75%' | '100%';
  foto_painel: string; // base64
  observacao_painel?: string;
  ultima_tela: 'inicial';
  timestamp: string;
}
```

### API (Resposta do POST)
```typescript
{
  sucesso: boolean;
  mensagem: string;
  id: number; // ID da inspeção criada
  placa: string;
}
```

---

## 🎨 Estilos (SCSS)

```scss
// inspecao-inicial.page.scss

.inspecao-container {
  padding: 20px;
}

.campo-formulario {
  margin-bottom: 20px;

  ion-label {
    font-weight: bold;
    margin-bottom: 8px;
    display: block;
  }

  .obrigatorio::after {
    content: ' *';
    color: var(--ion-color-danger);
  }
}

.sugestoes-placas {
  margin-top: -15px;
  margin-bottom: 15px;

  ion-chip {
    cursor: pointer;
    margin-right: 8px;
  }
}

.btn-foto {
  width: 100%;
  height: 150px;
  border: 2px dashed var(--ion-color-medium);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  ion-icon {
    font-size: 48px;
    color: var(--ion-color-primary);
  }

  &.com-foto {
    border: 2px solid var(--ion-color-success);
  }
}

.preview-foto {
  margin-top: 10px;
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.btn-proximo {
  margin-top: 30px;
  height: 50px;
  font-size: 18px;
  font-weight: bold;
}
```

---

## 🧪 Casos de Teste

### Teste 1: Preencher e Salvar Inspeção
```
1. Na tela inicial, preencher:
   - Placa: ABC-1234
   - KM: 50000
   - Combustível: 50%
   - Tirar foto do painel
2. Clicar em "Próximo Passo"
✅ Deve criar inspeção na API
✅ Deve navegar para /inspecao-veiculo
✅ Deve salvar dados localmente
```

### Teste 2: Autocomplete de Placas
```
1. No campo de placa, digitar "ABC"
✅ Deve exibir sugestões de placas que começam com ABC
2. Clicar em uma sugestão
✅ Deve preencher o campo automaticamente
```

### Teste 3: Validação de Campos Obrigatórios
```
1. Deixar placa e combustível vazios
2. Clicar em "Próximo Passo"
✅ Deve exibir erro listando campos obrigatórios
✅ Não deve navegar para próxima tela
```

### Teste 4: Placa Inexistente
```
1. Digitar placa "XYZ-9999" (que não existe no banco)
2. Preencher demais campos
3. Clicar em "Próximo Passo"
✅ Deve exibir erro "Placa não encontrada no sistema"
✅ Não deve criar inspeção
```

### Teste 5: Retomada de Inspeção
```
1. Preencher metade do formulário
2. Fechar app
3. Abrir app novamente
4. Ir para /inspecao-inicial
✅ Campos devem estar preenchidos com dados salvos
```

---

## 💡 Dicas para Desenvolvedores

### Debugar Salvamento
```typescript
// Log de dados antes de salvar
console.log('Dados a salvar:', {
  placa: this.placa,
  km: this.kmInicial,
  combustivel: this.nivelCombustivel,
  fotoTamanho: this.fotoPainel?.length
});

// Verificar se dados foram salvos
const saved = await Preferences.get({ key: 'inspecao_em_andamento' });
console.log('Dados salvos:', JSON.parse(saved.value));
```

### Otimizar Compressão de Foto
```typescript
// Ajustar qualidade conforme necessário
const QUALIDADES = {
  ALTA: 0.9,    // 90% - melhor qualidade
  MEDIA: 0.6,   // 60% - balanceado
  BAIXA: 0.3    // 30% - menor tamanho
};

this.fotoComprimida = await this.photoCompression.compress(
  this.foto,
  QUALIDADES.MEDIA,
  1200
);
```

---

## 📚 Próximos Passos

Após completar a Inspeção Inicial:

1. [Inspeção do Veículo - Motor, Elétrico, Limpeza](./05-inspecao-veiculo.md)

---

## 🔗 Links Relacionados

- [Home](./03-home.md)
- [Fluxo de Dados](./10-fluxo-dados.md)
- [API - Criar Checklist](./11-api.md#criar-checklist)
- [Modelos - ChecklistSimples](./12-modelos.md#checklistsimples)

---

[← Voltar ao Índice](./index.md)
