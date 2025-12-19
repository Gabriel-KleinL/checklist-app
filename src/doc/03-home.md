# 🏠 Tela Home - Menu Principal

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

A tela Home é o menu principal do aplicativo para inspetores. É exibida após o login bem-sucedido e permite iniciar uma nova inspeção ou retomar uma inspeção pendente.

**Rota:** `/home`

**Arquivo:** `/home/user/checklist-app/src/app/home/home.page.ts`

**Acesso:** Apenas para usuários com perfil **Inspetor**

---

## 🎯 Objetivo

Servir como ponto central de navegação para inspetores, oferecendo:
- Início de novas inspeções
- Retomada de inspeções não finalizadas
- Acesso rápido ao fluxo de checklist

---

## 🎨 Interface

### Layout Principal
```
┌─────────────────────────────────┐
│  [Menu]    HOME      [Sair]     │
├─────────────────────────────────┤
│                                 │
│      🚗 CHECKLIST VEICULAR      │
│                                 │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │   📋 Iniciar Checklist    │ │
│  │                           │ │
│  │   Começar nova inspeção   │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │   📝 Checklist Completo   │ │
│  │                           │ │
│  │   Inspeção 5 partes       │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  ℹ️  Bem-vindo, [Nome]         │
│                                 │
└─────────────────────────────────┘
```

---

## ⚙️ Funcionalidades

### 1. Iniciar Checklist Simples
**Botão:** "Iniciar Checklist"

**Ação:**
```typescript
async iniciarChecklist() {
  // Verificar se existe inspeção pendente
  const temPendente = await this.verificarDadosPendentes();

  if (temPendente) {
    // Perguntar se deseja continuar ou começar nova
    this.exibirOpcoesContinuar();
  } else {
    // Navegar para inspeção inicial
    this.router.navigate(['/inspecao-inicial']);
  }
}
```

**Navegação:**
```
/home → /inspecao-inicial → /inspecao-veiculo → /fotos-veiculo → /pneus
```

---

### 2. Iniciar Checklist Completo
**Botão:** "Checklist Completo"

**Ação:**
```typescript
async iniciarChecklistCompleto() {
  // Verificar se existe inspeção completa pendente
  const temPendente = await this.verificarDadosCompletosPendentes();

  if (temPendente) {
    this.exibirOpcoesContinuarCompleto();
  } else {
    this.router.navigate(['/checklist-completo']);
  }
}
```

**Navegação:**
```
/home → /checklist-completo (5 partes)
```

---

### 3. Verificar Dados Pendentes
**Função:** `verificarDadosPendentes()`

**Lógica:**
```typescript
async verificarDadosPendentes(): Promise<boolean> {
  // Buscar dados salvos localmente
  const { value } = await Preferences.get({
    key: 'inspecao_em_andamento'
  });

  if (value) {
    const dados = JSON.parse(value);

    // Verificar se tem ID de inspeção
    if (dados.id && dados.placa) {
      return true;
    }
  }

  return false;
}
```

**Storage Local Verificado:**
- `inspecao_em_andamento`: Dados da inspeção atual
- `inspecao_id`: ID da inspeção na API
- `placa`: Placa do veículo

---

### 4. Opções de Continuar Inspeção
**Alerta Exibido:**

```typescript
async exibirOpcoesContinuar() {
  const alert = await this.alertController.create({
    header: 'Inspeção em Andamento',
    message: 'Você possui uma inspeção não finalizada. Deseja continuar?',
    buttons: [
      {
        text: 'Nova Inspeção',
        handler: () => {
          this.limparDadosLocais();
          this.router.navigate(['/inspecao-inicial']);
        }
      },
      {
        text: 'Continuar',
        handler: () => {
          this.continuarInspecao();
        }
      }
    ]
  });

  await alert.present();
}
```

**Opções:**
1. **Continuar:** Retoma a inspeção do ponto onde parou
2. **Nova Inspeção:** Limpa dados locais e inicia do zero

---

### 5. Continuar Inspeção Existente
**Função:** `continuarInspecao()`

**Lógica:**
```typescript
async continuarInspecao() {
  // Carregar dados salvos
  const { value } = await Preferences.get({
    key: 'inspecao_em_andamento'
  });

  const dados = JSON.parse(value);

  // Determinar última tela acessada
  if (dados.ultima_tela === 'pneus') {
    this.router.navigate(['/pneus']);
  } else if (dados.ultima_tela === 'fotos') {
    this.router.navigate(['/fotos-veiculo']);
  } else if (dados.ultima_tela === 'veiculo') {
    this.router.navigate(['/inspecao-veiculo']);
  } else {
    this.router.navigate(['/inspecao-inicial']);
  }
}
```

---

### 6. Logout
**Botão:** Ícone de sair no header

**Ação:**
```typescript
async logout() {
  const alert = await this.alertController.create({
    header: 'Sair',
    message: 'Deseja realmente sair? Certifique-se de finalizar inspeções pendentes.',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Sair',
        handler: async () => {
          await this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    ]
  });

  await alert.present();
}
```

**Ações do Logout:**
1. Limpar dados de autenticação
2. Manter dados de inspeção (para permitir retomada)
3. Redirecionar para `/login`

---

## 📊 Dados Exibidos

### Informações do Usuário
```typescript
interface DadosHome {
  nomeUsuario: string;          // Nome do inspetor logado
  temInspecaoPendente: boolean; // Flag de inspeção em andamento
  ultimaInspecao?: {
    placa: string;
    data: string;
    etapa: string;
  };
}
```

### Estatísticas (Opcional)
Pode exibir:
- Total de inspeções realizadas hoje
- Última inspeção realizada
- Anomalias pendentes

---

## 🔄 Ciclo de Vida da Página

### `ionViewWillEnter()`
Executado sempre que a página é exibida:

```typescript
async ionViewWillEnter() {
  // Carregar nome do usuário
  this.carregarNomeUsuario();

  // Verificar inspeções pendentes
  this.verificarDadosPendentes();

  // Carregar estatísticas
  this.carregarEstatisticas();
}
```

### `ionViewDidLeave()`
Executado ao sair da página:

```typescript
ionViewDidLeave() {
  // Salvar última visita
  this.salvarUltimaVisita();
}
```

---

## 🎨 Estilos (SCSS)

```scss
// home.page.scss

.home-container {
  display: flex;
  flex-direction: column;
  padding: 20px;
  height: 100%;
}

.welcome-section {
  text-align: center;
  margin-bottom: 30px;

  ion-icon {
    font-size: 60px;
    color: var(--ion-color-primary);
  }

  h1 {
    margin-top: 10px;
    font-size: 24px;
    font-weight: bold;
  }
}

.card-button {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }

  ion-card-header {
    display: flex;
    align-items: center;
    gap: 15px;

    ion-icon {
      font-size: 40px;
      color: var(--ion-color-primary);
    }
  }
}

.info-section {
  margin-top: auto;
  padding: 15px;
  background: var(--ion-color-light);
  border-radius: 8px;
  text-align: center;

  p {
    margin: 0;
    color: var(--ion-color-medium);
  }
}
```

---

## ✅ Validações

### Verificações ao Entrar
- ✅ Usuário está autenticado?
- ✅ Token é válido?
- ✅ Perfil é "inspetor"?
- ✅ Existe inspeção pendente?

### Guards de Rota
```typescript
// auth.guard.ts
canActivate(): boolean {
  const isAuthenticated = this.authService.isAuthenticated();
  const isInspector = this.authService.getUserType() === 'inspetor';

  if (!isAuthenticated || !isInspector) {
    this.router.navigate(['/login']);
    return false;
  }

  return true;
}
```

---

## 🧪 Casos de Teste

### Teste 1: Iniciar Nova Inspeção
```
1. Login como inspetor
2. Na Home, clicar em "Iniciar Checklist"
✅ Deve navegar para /inspecao-inicial
```

### Teste 2: Continuar Inspeção Pendente
```
1. Iniciar uma inspeção
2. Sair do app na metade
3. Abrir app e fazer login
4. Na Home, clicar em "Iniciar Checklist"
✅ Deve exibir alerta perguntando se deseja continuar
✅ Ao clicar "Continuar", deve ir para última tela acessada
```

### Teste 3: Iniciar Nova Inspeção com Pendente
```
1. Ter inspeção pendente
2. Clicar em "Iniciar Checklist"
3. No alerta, clicar "Nova Inspeção"
✅ Deve limpar dados locais
✅ Deve navegar para /inspecao-inicial
```

### Teste 4: Logout
```
1. Na Home, clicar no botão de sair
✅ Deve exibir alerta de confirmação
✅ Ao confirmar, deve redirecionar para /login
✅ Dados de inspeção pendente devem ser mantidos
```

---

## 💡 Dicas para Desenvolvedores

### Adicionar Nova Opção de Menu
```typescript
// No HTML
<ion-card (click)="novaOpcao()">
  <ion-card-header>
    <ion-icon name="construct-outline"></ion-icon>
    <div>
      <ion-card-title>Nova Opção</ion-card-title>
      <ion-card-subtitle>Descrição</ion-card-subtitle>
    </div>
  </ion-card-header>
</ion-card>

// No TypeScript
novaOpcao() {
  this.router.navigate(['/nova-rota']);
}
```

### Adicionar Estatísticas
```typescript
async carregarEstatisticas() {
  try {
    const stats = await this.apiService.get('/estatisticas_usuario', {
      usuario_id: this.usuarioId
    });

    this.totalInspecoes = stats.total;
    this.inspecoesHoje = stats.hoje;
  } catch (erro) {
    console.error('Erro ao carregar estatísticas', erro);
  }
}
```

---

## 🔗 Navegação

### Entrada na Home
```
/login (após autenticação) → /home
```

### Saídas da Home
```
/home → /inspecao-inicial (Checklist Simples)
/home → /checklist-completo (Checklist Completo)
/home → /login (Logout)
```

---

## 📱 Responsividade

A tela Home é otimizada para:
- 📱 Smartphones (layout vertical)
- 📱 Tablets (cards maiores)
- 💻 Desktop (centralizado com max-width)

---

## 🔐 Segurança

### Proteções Implementadas
- ✅ Guard de autenticação (AuthGuard)
- ✅ Verificação de perfil de usuário
- ✅ Timeout de sessão
- ✅ Validação de token

---

## 📚 Próximos Passos

Após a Home, o inspetor pode seguir para:

1. [Inspeção Inicial - Placa e Dados](./04-inspecao-inicial.md)
2. [Checklist Completo - 5 Partes](./09-checklist-completo.md)

---

## 🔗 Links Relacionados

- [Visão Geral](./01-visao-geral.md)
- [Login](./02-login.md)
- [Fluxo de Dados](./10-fluxo-dados.md)

---

[← Voltar ao Índice](./index.md)
