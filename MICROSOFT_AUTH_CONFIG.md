# Configuração de Autenticação Microsoft

## Passos para Configurar

### 1. No Portal Azure (onde você está agora)

#### a) Informações que você precisa copiar:
- **ID do aplicativo (cliente)** - Exemplo: `12345678-1234-1234-1234-123456789012`
- **ID do diretório (locatário)** - Exemplo: `87654321-4321-4321-4321-210987654321`

#### b) Criar Segredo do Cliente:
1. Vá em **Certificados e segredos**
2. Clique em **Novo segredo do cliente**
3. Copie o **Valor** imediatamente (você só verá uma vez!)

#### c) URI de Redirecionamento:
Certifique-se de adicionar estas URIs em **Autenticação**:
```
http://localhost:8100
capacitor://localhost
ionic://localhost
```

Tipo de plataforma: **Aplicativo de página única (SPA)**

#### d) Permissões de API:
Adicione em **Permissões de API** > **Microsoft Graph** > **Permissões delegadas**:
- `User.Read`
- `email`
- `openid`
- `profile`

Depois clique em **Conceder consentimento do administrador**

---

### 2. No seu App (Aqui)

Abra o arquivo:
```
src/app/services/microsoft-auth.service.ts
```

E substitua essas linhas:

```typescript
private config: Configuration = {
  auth: {
    clientId: 'SEU_CLIENT_ID_AQUI', // ← Cole o ID do aplicativo aqui
    authority: 'https://login.microsoftonline.com/SEU_TENANT_ID_AQUI', // ← Cole o ID do locatário aqui
    redirectUri: this.platform.is('capacitor') ? 'capacitor://localhost' : 'http://localhost:8100'
  },
  ...
```

#### Exemplo Real:
```typescript
private config: Configuration = {
  auth: {
    clientId: '12345678-1234-1234-1234-123456789012',
    authority: 'https://login.microsoftonline.com/87654321-4321-4321-4321-210987654321',
    redirectUri: this.platform.is('capacitor') ? 'capacitor://localhost' : 'http://localhost:8100'
  },
  ...
```

**DICA:** Se você quiser permitir contas pessoais da Microsoft (@outlook, @hotmail), use:
```typescript
authority: 'https://login.microsoftonline.com/common'
```

---

### 3. Para Multi-tenant (Várias Empresas)

Se você quer que qualquer organização possa usar (não apenas a sua empresa), use:
```typescript
authority: 'https://login.microsoftonline.com/organizations'
```

---

### 4. Testar

1. Salve o arquivo com suas credenciais
2. Execute: `npm run build`
3. Execute: `ionic serve`
4. Clique no botão "Entrar com Microsoft"
5. Faça login com sua conta Microsoft

---

## Fluxo de Autenticação

```
1. Usuário clica em "Entrar com Microsoft"
2. Abre popup/janela de login da Microsoft
3. Usuário faz login com email/senha Microsoft
4. Microsoft redireciona de volta para o app com token
5. App recebe os dados do usuário (nome, email, etc.)
6. App redireciona para home/admin
```

---

## Informações Retornadas pelo Login

O objeto `result.user` contém:
```javascript
{
  id: "identificador-unico",
  name: "Nome do Usuário",
  email: "usuario@empresa.com",
  accessToken: "token-de-acesso"
}
```

---

## Próximos Passos (Opcional)

Se você quiser salvar o usuário no seu backend:

1. Quando o login for bem-sucedido, envie os dados para seu servidor:
```typescript
// No método loginComMicrosoft(), após sucesso:
this.apiService.salvarUsuarioMicrosoft(result.user).subscribe({
  next: (response) => {
    console.log('Usuário salvo no backend');
  }
});
```

2. Crie um endpoint no PHP para receber e salvar:
```php
// api/microsoft_login.php
$data = json_decode(file_get_contents('php://input'), true);
$microsoftId = $data['id'];
$nome = $data['name'];
$email = $data['email'];

// Verifica se usuário já existe ou cria novo
// Retorna dados do usuário
```

---

## Dúvidas Comuns

**Q: O popup não abre?**
A: Verifique se o bloqueador de popups está desativado

**Q: Erro "AADSTS50011"?**
A: Verifique se o URI de redirecionamento está correto no Azure

**Q: Erro "invalid_client"?**
A: Verifique se o Client ID está correto

**Q: Como testar no celular?**
A:
1. Build Android: `ionic cap build android`
2. Certifique-se de ter adicionado `capacitor://localhost` no Azure
3. A biblioteca MSAL cuida do resto!

---

## Segurança

⚠️ **IMPORTANTE:**
- NUNCA commite o Client Secret no Git
- Use variáveis de ambiente para produção
- O Client ID pode ser público, mas o Secret não!
