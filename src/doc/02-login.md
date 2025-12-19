# 🔐 Tela de Login

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

A tela de Login é o ponto de entrada do aplicativo. Permite autenticação via credenciais locais (usuário/senha) ou integração com Microsoft Azure OAuth. É a primeira tela exibida ao abrir o app.

**Rota:** `/login`

**Arquivo:** `/home/user/checklist-app/src/app/login/login.page.ts`

---

## 🎯 Objetivo

Autenticar usuários e redirecioná-los de acordo com seu perfil:
- **Inspetores** → Tela Home
- **Administradores** → Dashboard Admin

---

## 📋 Campos do Formulário

### 1. Nome de Usuário
- **Tipo:** Campo de texto
- **Obrigatório:** 🔴 Sim
- **Placeholder:** "Digite seu nome de usuário"
- **Validação:** Não pode estar vazio

### 2. Senha
- **Tipo:** Campo de senha
- **Obrigatório:** 🔴 Sim
- **Placeholder:** "Digite sua senha"
- **Características:**
  - Toggle para mostrar/ocultar senha (ícone de olho)
  - Pode ser salva localmente se "Lembrar senha" estiver ativo

### 3. Lembrar Senha
- **Tipo:** Checkbox
- **Função:** Armazena credenciais localmente usando Capacitor Preferences
- **Comportamento:**
  - Se marcado: credenciais são salvas após login bem-sucedido
  - Próximo acesso: campos são preenchidos automaticamente

---

## 🎨 Interface

### Elementos Visuais
```
┌─────────────────────────────────┐
│                                 │
│      🚗 CHECKLIST VEICULAR      │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 👤 Nome de Usuário        │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🔒 Senha              👁️  │ │
│  └───────────────────────────┘ │
│                                 │
│  ☐ Lembrar senha               │
│                                 │
│  ┌───────────────────────────┐ │
│  │       ENTRAR              │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  🔷 Entrar com Microsoft  │ │
│  └───────────────────────────┘ │
│                                 │
│         ❓ Ajuda               │
│                                 │
└─────────────────────────────────┘
```

### Cores e Estados
- **Botão Entrar:** Cor primária do tema Ionic
- **Botão Microsoft:** Azul (#0078D4)
- **Campos vazios:** Borda vermelha se tentativa de login sem preencher
- **Loading:** Spinner durante autenticação

---

## ⚙️ Funcionalidades

### 1. Login Local (`login()`)
**Fluxo:**
```typescript
1. Validar campos preenchidos
2. Chamar API: POST /b_veicular_auth.php
   - Parâmetros: { acao: 'login', nome, senha }
3. Receber resposta da API
4. Se sucesso:
   - Salvar dados do usuário (id, nome, tipo)
   - Salvar credenciais se "Lembrar senha" ativo
   - Redirecionar baseado no tipo de usuário
5. Se erro:
   - Exibir toast com mensagem de erro
```

**Redirecionamento por Perfil:**
```typescript
if (usuario.tipo === 'admin') {
  router.navigate(['/admin']);
} else {
  router.navigate(['/home']);
}
```

---

### 2. Login com Microsoft (`loginComMicrosoft()`)
**Fluxo OAuth:**
```typescript
1. Abrir fluxo OAuth da Microsoft
2. Usuário autoriza no portal Microsoft
3. Receber token de acesso
4. Validar token na API
5. Criar/atualizar usuário no banco
6. Redirecionar para tela apropriada
```

**Serviço:** `MicrosoftAuthService`

**Endpoint:** Integração com Azure AD

---

### 3. Lembrar Senha (`salvarCredenciais()`)
**Armazenamento:**
```typescript
// Capacitor Preferences
await Preferences.set({
  key: 'usuario_nome',
  value: this.nome
});
await Preferences.set({
  key: 'usuario_senha',
  value: this.senha
});
await Preferences.set({
  key: 'lembrar_senha',
  value: 'true'
});
```

**Recuperação ao abrir app:**
```typescript
async carregarCredenciais() {
  const lembrar = await Preferences.get({ key: 'lembrar_senha' });
  if (lembrar.value === 'true') {
    const nome = await Preferences.get({ key: 'usuario_nome' });
    const senha = await Preferences.get({ key: 'usuario_senha' });
    this.nome = nome.value || '';
    this.senha = senha.value || '';
    this.lembrarSenha = true;
  }
}
```

---

### 4. Criar Senha (Primeiro Acesso)
**Modal de Criação de Senha:**

Quando um usuário é criado via Microsoft OAuth ou por administrador sem senha:

```typescript
async mostrarModalCriarSenha() {
  const alert = await this.alertController.create({
    header: 'Criar Senha',
    message: 'É seu primeiro acesso. Defina uma senha:',
    inputs: [
      {
        name: 'novaSenha',
        type: 'password',
        placeholder: 'Digite sua senha'
      },
      {
        name: 'confirmarSenha',
        type: 'password',
        placeholder: 'Confirme sua senha'
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Salvar',
        handler: (data) => this.definirSenha(data)
      }
    ]
  });
  await alert.present();
}
```

**Validações:**
- Senha não pode estar vazia
- Confirmação deve ser idêntica
- Mínimo 6 caracteres (recomendado)

---

### 5. Modal de Ajuda
**Conteúdo:**
- Como obter credenciais
- Contato do administrador
- Instruções de primeiro acesso
- Link para suporte

```typescript
async mostrarAjuda() {
  const alert = await this.alertController.create({
    header: 'Ajuda - Login',
    message: `
      <p><strong>Como fazer login:</strong></p>
      <ul>
        <li>Use seu nome de usuário e senha</li>
        <li>Ou entre com Microsoft</li>
      </ul>
      <p><strong>Primeiro acesso?</strong></p>
      <p>Entre com Microsoft e crie sua senha.</p>
      <p><strong>Problemas?</strong></p>
      <p>Contate o administrador do sistema.</p>
    `,
    buttons: ['Entendi']
  });
  await alert.present();
}
```

---

## ✅ Validações

### Campos Obrigatórios
- ⚠️ Nome de usuário não pode estar vazio
- ⚠️ Senha não pode estar vazia

### Feedback de Erros
```typescript
// Credenciais inválidas
if (resposta.sucesso === false) {
  this.toastController.create({
    message: 'Usuário ou senha incorretos',
    duration: 3000,
    color: 'danger'
  });
}

// Erro de conexão
catch (erro) {
  this.toastController.create({
    message: 'Erro ao conectar com servidor',
    duration: 3000,
    color: 'danger'
  });
}
```

---

## 🔄 Fluxo de Navegação

### Após Login Bem-Sucedido

```
Login
  │
  ├─ Se tipo = 'admin'
  │    └─→ /admin (Dashboard Admin)
  │
  └─ Se tipo = 'inspetor'
       └─→ /home (Menu Principal)
```

### Retorno ao Login
- Após logout (limpa todos os dados)
- Sessão expirada
- Desinstalação e reinstalação do app

---

## 📊 Dados Armazenados

### Local (Capacitor Preferences)
```typescript
{
  usuario_nome: string,
  usuario_senha: string (se lembrar_senha = true),
  lembrar_senha: 'true' | 'false',
  usuario_id: number,
  usuario_tipo: 'admin' | 'inspetor',
  tutorial_concluido: boolean
}
```

### API (Resposta do Login)
```typescript
{
  sucesso: boolean,
  mensagem: string,
  usuario: {
    id: number,
    nome: string,
    email: string,
    tipo: 'admin' | 'inspetor',
    tutorial_concluido: boolean
  },
  token?: string
}
```

---

## 🛠️ Serviços Utilizados

### AuthService
```typescript
// src/app/services/auth.service.ts

async login(nome: string, senha: string) {
  const response = await this.api.post('/b_veicular_auth.php', {
    acao: 'login',
    nome,
    senha
  });

  if (response.sucesso) {
    await this.salvarDadosUsuario(response.usuario);
  }

  return response;
}

async salvarDadosUsuario(usuario: Usuario) {
  await Preferences.set({
    key: 'usuario_id',
    value: usuario.id.toString()
  });
  // ... outros dados
}

async isAdmin(): Promise<boolean> {
  const tipo = await Preferences.get({ key: 'usuario_tipo' });
  return tipo.value === 'admin';
}
```

### MicrosoftAuthService
```typescript
// src/app/services/microsoft-auth.service.ts

async login() {
  // Configuração OAuth
  const config = {
    clientId: 'SEU_CLIENT_ID',
    tenant: 'common',
    scope: 'openid profile email'
  };

  // Abrir fluxo de autenticação
  const result = await this.oauth.login(config);

  // Processar token
  return this.processarToken(result.accessToken);
}
```

---

## 🎨 Estilos (SCSS)

```scss
// login.page.scss

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.logo {
  text-align: center;
  margin-bottom: 40px;

  ion-icon {
    font-size: 80px;
    color: var(--ion-color-primary);
  }
}

.input-field {
  margin-bottom: 15px;

  ion-input {
    --padding-start: 10px;
    border: 1px solid var(--ion-color-medium);
    border-radius: 8px;
  }
}

.btn-login {
  margin-top: 20px;
  height: 50px;
  font-size: 18px;
  font-weight: bold;
}

.btn-microsoft {
  margin-top: 10px;
  --background: #0078D4;
  height: 50px;
}

.ajuda-link {
  text-align: center;
  margin-top: 20px;
  color: var(--ion-color-medium);
  cursor: pointer;
}
```

---

## 🔒 Segurança

### Boas Práticas Implementadas
✅ Senha nunca armazenada em plain text no backend
✅ Comunicação via HTTPS
✅ Validação de token na API
✅ Timeout de sessão
✅ Proteção contra força bruta (implementar rate limiting na API)

### Melhorias Recomendadas
💡 Implementar 2FA (Two-Factor Authentication)
💡 Captcha após múltiplas tentativas
💡 Política de senha forte (mínimo 8 caracteres, números, símbolos)
💡 Expiração de senhas (90 dias)

---

## 🧪 Casos de Teste

### Teste 1: Login com Credenciais Válidas
```
1. Abrir app
2. Preencher nome de usuário válido
3. Preencher senha válida
4. Clicar em "Entrar"
✅ Deve redirecionar para /home ou /admin
```

### Teste 2: Login com Credenciais Inválidas
```
1. Abrir app
2. Preencher credenciais incorretas
3. Clicar em "Entrar"
✅ Deve exibir toast "Usuário ou senha incorretos"
```

### Teste 3: Lembrar Senha
```
1. Fazer login com "Lembrar senha" marcado
2. Fechar app
3. Abrir app novamente
✅ Campos devem estar preenchidos
```

### Teste 4: Login com Microsoft
```
1. Clicar em "Entrar com Microsoft"
2. Autorizar no portal Microsoft
✅ Deve criar usuário e redirecionar
```

### Teste 5: Primeiro Acesso
```
1. Login com Microsoft pela primeira vez
✅ Deve exibir modal de criar senha
✅ Senha deve ser salva na API
```

---

## 📱 Responsividade

A tela de login é responsiva e funciona em:
- 📱 Smartphones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)

---

## 💡 Dicas para Desenvolvedores

### Adicionar Novo Método de Autenticação
```typescript
// 1. Criar serviço de autenticação
// 2. Implementar método login()
// 3. Adicionar botão na interface
// 4. Chamar método no click

async loginComGoogle() {
  try {
    const result = await this.googleAuth.login();
    await this.authService.salvarDadosUsuario(result.usuario);
    this.redirecionarPorPerfil(result.usuario);
  } catch (erro) {
    this.mostrarErro('Erro ao fazer login com Google');
  }
}
```

### Debugar Problemas de Login
```typescript
// Adicionar logs
console.log('Tentativa de login:', { nome, senha: '***' });
console.log('Resposta da API:', response);
console.log('Dados salvos:', await Preferences.get({ key: 'usuario_id' }));
```

---

## 📚 Próximos Passos

Após o login bem-sucedido:

1. **Para Inspetores:** [Tela Home](./03-home.md)
2. **Para Administradores:** [Dashboard Admin](./08-admin.md)

---

## 🔗 Links Relacionados

- [Visão Geral do Sistema](./01-visao-geral.md)
- [API - Endpoints de Autenticação](./11-api.md#autenticação)
- [Serviços - AuthService](./13-servicos.md#authservice)

---

[← Voltar ao Índice](./index.md)
