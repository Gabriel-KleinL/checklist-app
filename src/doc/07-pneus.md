# 🛞 Inspeção de Pneus - Condição e Pressão

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

A tela de Inspeção de Pneus é a **última etapa** do checklist simples. Aqui o inspetor avalia a condição de cada pneu, registra a pressão e finaliza a inspeção completa.

**Rota:** `/pneus`

**Arquivo:** `/home/user/checklist-app/src/app/pneus/pneus.page.ts`

**Posição no Fluxo:** Etapa 4 de 4 (Final)

---

## 🎯 Objetivo

Avaliar condições dos pneus, registrar pressões e **finalizar** a inspeção, enviando todos os dados para a API e limpando o armazenamento local.

---

## 📋 Pneus Avaliados

### Configuração Padrão

1. **Dianteira Direita** 🔴
2. **Dianteira Esquerda** 🔴
3. **Traseira Direita** 🔴
4. **Traseira Esquerda** 🔴
5. **Estepe** 🔴

💡 **Nota:** Os pneus são carregados dinamicamente da configuração do banco de dados, podendo variar conforme o tipo de veículo.

---

## 📋 Campos por Pneu

### 1. Condição 🔴
- **Tipo:** Botões de seleção
- **Opções:**
  - ✅ **Bom** - Pneu em boas condições
  - ❌ **Ruim** - Pneu danificado/desgastado (📸 foto obrigatória)
- **Obrigatório:** Sim

### 2. Pressão (PSI)
- **Tipo:** Campo numérico
- **Unidade:** PSI (libras por polegada quadrada)
- **Obrigatório:** Não
- **Validação:** Apenas números
- **Exemplo:** 32, 35, 40

### 3. Foto 📸
- **Obrigatória:** Apenas se condição = "Ruim"
- **Formato:** Base64
- **Compressão:** 45% de qualidade

### 4. Descrição
- **Tipo:** Área de texto (textarea)
- **Obrigatório:** Não
- **Uso:** Observações sobre o pneu (furos, desgaste, etc.)

---

## 🎨 Interface

```
┌─────────────────────────────────┐
│  [Voltar]   INSPEÇÃO DE PNEUS   │
├─────────────────────────────────┤
│                                 │
│  🛞 Dianteira Direita *         │
│  ┌──────────┬──────────┐        │
│  │   Bom    │   Ruim   │        │
│  └──────────┴──────────┘        │
│  Pressão (PSI):                 │
│  ┌───────────────────────────┐ │
│  │ 32                        │ │
│  └───────────────────────────┘ │
│  [ 📷 Foto ] [ 📝 Descrição ]   │
│  [Miniatura se houver foto]     │
│                                 │
│  🛞 Dianteira Esquerda *        │
│  ... (similar)                  │
│                                 │
│  🛞 Traseira Direita *          │
│  ... (similar)                  │
│                                 │
│  🛞 Traseira Esquerda *         │
│  ... (similar)                  │
│                                 │
│  🛞 Estepe *                    │
│  ... (similar)                  │
│                                 │
│  ┌───────────────────────────┐ │
│  │   ✅ FINALIZAR CHECKLIST  │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

## ⚙️ Funcionalidades

### 1. Carregamento Dinâmico de Pneus

```typescript
itensPneus: ConfigItem[] = [];
dadosPneus: { [nomePneu: string]: DadosPneu } = {};

async carregarItensHabilitados() {
  try {
    const response = await this.apiService.get(
      '/b_veicular_config_itens.php',
      { acao: 'habilitados' }
    );

    this.itensPneus = response.filter(i => i.categoria === 'PNEU');

    // Inicializar dados
    this.itensPneus.forEach(item => {
      this.dadosPneus[item.nome_item] = {
        condicao: null,
        pressao: null,
        foto: null,
        descricao: ''
      };
    });

  } catch (erro) {
    console.error('Erro ao carregar pneus', erro);
  }
}

interface DadosPneu {
  condicao: 'bom' | 'ruim' | null;
  pressao: number | null;
  foto: string | null;
  descricao: string;
}
```

---

### 2. Captura de Foto de Pneu

```typescript
async tirarFoto(nomePneu: string) {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64
    });

    const fotoBase64 = `data:image/jpeg;base64,${image.base64String}`;

    // Comprimir
    this.dadosPneus[nomePneu].foto = await this.photoCompression.compress(
      fotoBase64,
      0.45,
      1200
    );

    this.salvarLocalmente();

  } catch (erro) {
    console.error('Erro ao tirar foto do pneu', erro);
  }
}
```

---

### 3. Atualizar Pressão

```typescript
atualizarPressao(nomePneu: string, event: any) {
  const pressao = parseFloat(event.target.value);

  if (!isNaN(pressao) && pressao > 0) {
    this.dadosPneus[nomePneu].pressao = pressao;
    this.salvarLocalmente();
  }
}
```

---

### 4. Validação de Pneus

```typescript
validarPneus(): boolean {
  const erros: string[] = [];

  // Validar condições obrigatórias
  for (const [nome, dados] of Object.entries(this.dadosPneus)) {
    if (!dados.condicao) {
      erros.push(`Condição obrigatória para: ${nome}`);
    }

    // Se ruim, foto é obrigatória
    if (dados.condicao === 'ruim' && !dados.foto) {
      erros.push(`Foto obrigatória para: ${nome} (Ruim)`);
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

### 5. Finalizar Checklist

**Esta é a ação mais importante da tela:**

```typescript
async finalizarChecklist() {
  // 1. Validar
  if (!this.validarPneus()) {
    return;
  }

  // Mostrar loading
  const loading = await this.loadingController.create({
    message: 'Finalizando checklist...'
  });
  await loading.present();

  try {
    // 2. Recuperar ID da inspeção
    const { value } = await Preferences.get({ key: 'inspecao_id' });
    const inspecaoId = parseInt(value);

    // 3. Preparar dados dos pneus
    const pneus = this.prepararDadosPneus();

    // 4. Enviar para API
    const response = await this.apiService.post('/b_veicular_update.php', {
      id: inspecaoId,
      itens_pneus: pneus,
      status_geral: this.calcularStatusGeral()
    });

    if (response.sucesso) {
      // 5. Limpar dados locais
      await this.limparDadosLocais();

      // 6. Mostrar sucesso
      await loading.dismiss();
      await this.mostrarSucesso();

      // 7. Voltar para home
      this.router.navigate(['/home']);
    }

  } catch (erro) {
    await loading.dismiss();
    this.mostrarErro('Erro ao finalizar checklist');
    console.error(erro);
  }
}

prepararDadosPneus(): PneuInspecao[] {
  const pneus: PneuInspecao[] = [];

  for (const [nome, dados] of Object.entries(this.dadosPneus)) {
    pneus.push({
      nome,
      valor: dados.condicao,
      pressao: dados.pressao,
      foto: dados.foto || undefined,
      descricao: dados.descricao || undefined
    });
  }

  return pneus;
}

calcularStatusGeral(): 'aprovado' | 'reprovado' | 'pendente' {
  // Verificar se há algum pneu ruim
  const temPneuRuim = Object.values(this.dadosPneus).some(
    pneu => pneu.condicao === 'ruim'
  );

  // Aqui pode adicionar lógica mais complexa
  // considerando também motor, elétrico, limpeza, etc.

  return temPneuRuim ? 'reprovado' : 'aprovado';
}
```

---

### 6. Limpar Dados Locais

**Após finalização bem-sucedida:**

```typescript
async limparDadosLocais() {
  // Remover todas as chaves relacionadas à inspeção
  await Preferences.remove({ key: 'inspecao_em_andamento' });
  await Preferences.remove({ key: 'inspecao_id' });
  await Preferences.remove({ key: 'inspecao_veiculo' });
  await Preferences.remove({ key: 'inspecao_fotos' });
  await Preferences.remove({ key: 'inspecao_pneus' });
  await Preferences.remove({ key: 'placa' });

  console.log('Dados locais limpos com sucesso');
}
```

---

### 7. Mensagem de Sucesso

```typescript
async mostrarSucesso() {
  const toast = await this.toastController.create({
    message: '✅ Checklist finalizado com sucesso!',
    duration: 3000,
    color: 'success',
    position: 'top'
  });

  await toast.present();
}
```

---

## ✅ Validações

### Campos Obrigatórios
- ✅ Condição de todos os pneus

### Fotos Obrigatórias
- ✅ Foto obrigatória se condição = "Ruim"

### Pressão
- ⚠️ Opcional, mas recomendado
- ⚠️ Se preenchido, deve ser número positivo

---

## 📊 Estrutura de Dados

```typescript
interface PneuInspecao {
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

interface DadosPneu {
  condicao: 'bom' | 'ruim' | null;
  pressao: number | null;
  foto: string | null;
  descricao: string;
}
```

---

## 🔄 Fluxo de Navegação

### Entrada
```
/fotos-veiculo → /pneus
```

### Saída (após finalizar)
```
/pneus → /home (com sucesso)
```

### Botão Voltar
```
/pneus → /fotos-veiculo
```

---

## 🎨 Estilos (SCSS)

```scss
.pneu-card {
  margin-bottom: 25px;
  padding: 15px;
  background: var(--ion-color-light);
  border-radius: 8px;

  .pneu-nome {
    font-weight: bold;
    font-size: 18px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;

    ion-icon {
      margin-right: 8px;
      font-size: 24px;
    }
  }

  .botoes-condicao {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;

    ion-button {
      flex: 1;

      &.bom {
        --background: var(--ion-color-success);
      }

      &.ruim {
        --background: var(--ion-color-danger);
      }
    }
  }

  .campo-pressao {
    margin-bottom: 15px;

    ion-label {
      font-weight: 500;
      margin-bottom: 5px;
      display: block;
    }
  }

  .acoes {
    display: flex;
    gap: 10px;

    ion-button {
      flex: 1;
      --background: var(--ion-color-medium);
    }
  }
}

.btn-finalizar {
  margin: 30px 0;
  height: 60px;
  font-size: 18px;
  font-weight: bold;
  --background: var(--ion-color-success);
}
```

---

## 🧪 Casos de Teste

### Teste 1: Finalizar Checklist com Sucesso
```
1. Selecionar condição "Bom" para todos os pneus
2. Preencher pressões (opcional)
3. Clicar em "Finalizar Checklist"
✅ Deve salvar na API
✅ Deve limpar dados locais
✅ Deve exibir mensagem de sucesso
✅ Deve navegar para /home
```

### Teste 2: Pneu Ruim sem Foto
```
1. Selecionar "Ruim" para "Dianteira Direita"
2. NÃO tirar foto
3. Clicar em "Finalizar Checklist"
✅ Deve exibir erro "Foto obrigatória para: Dianteira Direita"
✅ Não deve finalizar
```

### Teste 3: Finalizar com Pneu Ruim e Foto
```
1. Selecionar "Ruim" para "Estepe"
2. Tirar foto do pneu
3. Preencher descrição (ex: "Pneu careca")
4. Clicar em "Finalizar"
✅ Deve aceitar e finalizar
✅ Status geral deve ser "reprovado"
```

### Teste 4: Verificar Limpeza de Dados
```
1. Finalizar checklist
2. Verificar Preferences
✅ Todas as chaves de inspeção devem estar removidas
```

---

## 💡 Dicas para Desenvolvedores

### Adicionar Novo Pneu na Configuração
```sql
INSERT INTO config_itens (categoria, nome_item, habilitado)
VALUES ('PNEU', 'Traseira Central', 1);
```

### Debugar Finalização
```typescript
console.log('Dados dos pneus:', this.dadosPneus);
console.log('Payload para API:', {
  id: inspecaoId,
  itens_pneus: this.prepararDadosPneus()
});
```

### Tratamento de Erros na Finalização
```typescript
try {
  await this.finalizarChecklist();
} catch (erro) {
  if (erro.status === 500) {
    this.mostrarErro('Erro no servidor. Tente novamente.');
  } else if (erro.status === 0) {
    this.mostrarErro('Sem conexão com internet');
  } else {
    this.mostrarErro('Erro desconhecido');
  }
}
```

---

## 📚 Resumo do Fluxo Completo

```
Login
  ↓
Home
  ↓
Inspeção Inicial (placa, km, combustível, foto painel)
  ↓
Inspeção Veículo (motor, elétrico, limpeza, ferramentas)
  ↓
Fotos Veículo (4 ângulos obrigatórios)
  ↓
Pneus (condição, pressão, fotos se necessário)
  ↓
✅ FINALIZAR CHECKLIST
  ↓
Limpar dados locais
  ↓
Voltar para Home
```

---

## 🔗 Links Relacionados

- [Fotos do Veículo](./06-fotos-veiculo.md)
- [Fluxo Completo](./10-fluxo-dados.md)
- [API - Finalizar Checklist](./11-api.md#atualizar-checklist)
- [Modelos - PneuInspecao](./12-modelos.md#pneuinspecao)

---

[← Voltar ao Índice](./index.md)
