# 📋 Checklist Completo - Inspeção em 5 Partes

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

O Checklist Completo é uma inspeção abrangente em **5 partes** para veículos pesados (ônibus, caminhões, veículos especiais). Oferece uma avaliação muito mais detalhada que o checklist simples.

**Rota:** `/checklist-completo`

**Arquivo:** `/home/user/checklist-app/src/app/checklist-completo/checklist-completo.page.ts`

**Uso:** Veículos pesados, ônibus, caminhões, frotas especiais

---

## 🎯 Objetivo

Realizar inspeção completa e detalhada de veículos pesados, cobrindo todos os aspectos de segurança e funcionamento.

---

## 📋 Estrutura das 5 Partes

### Parte 0: Dados Iniciais (igual ao checklist simples)
- Placa
- KM Inicial
- Nível de Combustível
- Foto do Painel
- Observações

---

### Parte 1: INTERNA 🚌
**Itens verificados:**
- Buzina
- Cintos de Segurança (motorista e passageiros)
- Espelho Retrovisor Interno
- Freio de Mão
- Limpadores de Para-brisa
- Quebra-Sol
- Velocímetro
- Luzes do Painel
- Luz Interna
- Puxadores
- Estado Interno Geral

**Status:** Bom/Ruim (foto obrigatória se ruim)

---

### Parte 2: EQUIPAMENTOS 🧰
**Itens verificados:**
- Espelho Retrovisor Esquerdo
- Espelho Retrovisor Direito
- Extintor de Incêndio (validade, carga)
- Chave de Roda
- Macaco
- Triângulo
- Roda Estepe (condição)

**Status:** Contém/Não Contém (foto obrigatória se não contém)

---

### Parte 3: DIANTEIRA 🚗
**Itens externos frontais:**
- Faróis (alto/baixo)
- Setas Dianteiras
- Lanternas Dianteiras
- Pneus Dianteiros (condição, parafusos)
- Para-choque Dianteiro
- Capô
- Para-brisa (trincas, lascas)

**Fotos:** Obrigatórias para itens ruins ou danificados

---

### Parte 4: TRASEIRA 🚛
**Itens externos traseiros:**
- Lanternas Traseiras
- Luz de Ré
- Setas Traseiras
- Luz de Freio
- Alarme de Ré
- Para-choque Traseiro
- Lacre da Placa
- Pneus Traseiros
- Protetores
- Estado da Carroceria
- Escapamento
- Ferrugem
- Freios
- Logotipo/Adesivos
- Vazamentos

**Fotos:** Obrigatórias para itens com problemas

---

### Parte 5: VEÍCULOS PESADOS (Específico) 🏭
**Itens especializados:**
- Certificado CETURB (validade)
- Fumaça Preta (teste de emissão)
- Corrosão na Estrutura
- Ancoragem do Eixo
- Protetores de Roda
- Sistema de Freio (ABS, etc.)
- Alarme de Ré
- Lona/Cobertura
- Bomba (para caminhões específicos)
- Adesivos Reflexivos
- Altura do Para-choque
- Estado das Mangueiras

**Validações:** Campos específicos para veículos pesados, alguns podem ser opcionais

---

## 🎨 Interface

### Navegação por Stepper
```
┌─────────────────────────────────┐
│  CHECKLIST COMPLETO             │
├─────────────────────────────────┤
│                                 │
│  Progresso:                     │
│  ● ○ ○ ○ ○ ○                   │
│  Inicial                        │
│                                 │
│  [Formulário da Parte Atual]    │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ Anterior │  │ Próximo  │    │
│  └──────────┘  └──────────┘    │
│                                 │
└─────────────────────────────────┘
```

### Indicador de Progresso
```typescript
partesCompletas = [false, false, false, false, false, false];
parteAtual = 0;

proximaParte() {
  if (this.validarParteAtual()) {
    this.partesCompletas[this.parteAtual] = true;
    this.parteAtual++;
  }
}

parteAnterior() {
  if (this.parteAtual > 0) {
    this.parteAtual--;
  }
}
```

---

## ⚙️ Funcionalidades

### 1. Carregamento de Itens Dinâmicos
```typescript
async carregarItensCompleto() {
  try {
    const response = await this.apiService.get(
      '/b_checklist_completo_config_itens.php',
      { acao: 'habilitados' }
    );

    // Separar por parte
    this.itensParte1 = response.filter(i => i.parte === 1);
    this.itensParte2 = response.filter(i => i.parte === 2);
    this.itensParte3 = response.filter(i => i.parte === 3);
    this.itensParte4 = response.filter(i => i.parte === 4);
    this.itensParte5 = response.filter(i => i.parte === 5);

  } catch (erro) {
    console.error('Erro ao carregar itens', erro);
  }
}
```

---

### 2. Validação por Parte
```typescript
validarParteAtual(): boolean {
  switch (this.parteAtual) {
    case 0:
      return this.validarDadosIniciais();
    case 1:
      return this.validarParte1();
    case 2:
      return this.validarParte2();
    case 3:
      return this.validarParte3();
    case 4:
      return this.validarParte4();
    case 5:
      return this.validarParte5();
    default:
      return false;
  }
}

validarParte1(): boolean {
  const erros: string[] = [];

  for (const [item, dados] of Object.entries(this.parte1)) {
    if (!dados.status) {
      erros.push(`Status obrigatório: ${item}`);
    }
    if (dados.status === 'ruim' && !dados.foto) {
      erros.push(`Foto obrigatória: ${item}`);
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

### 3. Salvamento da Inspeção Completa
```typescript
async salvarChecklistCompleto() {
  // Validar todas as partes
  if (!this.validarTudo()) {
    return;
  }

  const loading = await this.loadingController.create({
    message: 'Salvando checklist completo...'
  });
  await loading.present();

  try {
    const payload = {
      placa: this.placa,
      km_inicial: this.kmInicial,
      nivel_combustivel: this.nivelCombustivel,
      foto_painel: this.fotoPainel,
      observacao_painel: this.observacaoPainel,
      usuario_id: this.usuarioId,
      usuario_nome: this.usuarioNome,
      parte1: this.parte1,
      parte2: this.parte2,
      parte3: this.parte3,
      parte4: this.parte4,
      parte5: this.parte5
    };

    const response = await this.apiService.post(
      '/b_checklist_completo_set.php',
      payload
    );

    if (response.sucesso) {
      await loading.dismiss();
      await this.limparDadosLocais();
      await this.mostrarSucesso();
      this.router.navigate(['/home']);
    }

  } catch (erro) {
    await loading.dismiss();
    this.mostrarErro('Erro ao salvar checklist completo');
  }
}
```

---

## 📊 Estrutura de Dados

```typescript
interface ChecklistCompleto {
  id?: number;
  placa: string;
  km_inicial?: number;
  nivel_combustivel: '0%' | '25%' | '50%' | '75%' | '100%';
  foto_painel?: string;
  observacao_painel?: string;
  data_realizacao?: string;
  usuario_id?: number;
  usuario_nome?: string;

  // Partes da inspeção
  parte1: Parte1; // Interna
  parte2: Parte2; // Equipamentos
  parte3: Parte3; // Dianteira
  parte4: Parte4; // Traseira
  parte5: Parte5; // Veículos Pesados
}

interface Parte1 {
  buzina: ItemAvaliacao;
  cintos: ItemAvaliacao;
  espelho_interno: ItemAvaliacao;
  freio_mao: ItemAvaliacao;
  // ... outros itens
}

interface ItemAvaliacao {
  status: 'bom' | 'ruim' | 'contem' | 'nao_contem' | null;
  foto?: string;
  descricao?: string;
}
```

---

## 🔄 Fluxo de Navegação

```
Home
  ↓
Checklist Completo - Dados Iniciais
  ↓
Parte 1 - Interna
  ↓
Parte 2 - Equipamentos
  ↓
Parte 3 - Dianteira
  ↓
Parte 4 - Traseira
  ↓
Parte 5 - Veículos Pesados
  ↓
Revisão e Finalização
  ↓
Home (com sucesso)
```

---

## ✅ Validações

### Por Parte
- ✅ Todos os itens da parte devem ter status
- ✅ Fotos obrigatórias para itens ruins/ausentes
- ✅ Não pode avançar sem completar parte atual

### Final
- ✅ Todas as 5 partes devem estar completas
- ✅ Placa deve existir no banco
- ✅ Dados iniciais obrigatórios

---

## 🔗 Links Relacionados

- [Home](./03-home.md)
- [Fluxo de Dados](./10-fluxo-dados.md)
- [API - Checklist Completo](./11-api.md#checklist-completo)

---

[← Voltar ao Índice](./index.md)
