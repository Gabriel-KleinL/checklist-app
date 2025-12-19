# 🛠️ Serviços - Lógica de Negócio

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

Documentação de todos os serviços (services) do aplicativo, incluindo responsabilidades, métodos principais e exemplos de uso.

**Localização:** `/home/user/checklist-app/src/app/services/`

---

## 🌐 ApiService

### Descrição
Cliente HTTP centralizado para todas as comunicações com a API PHP.

**Arquivo:** `api.service.ts`

### Responsabilidades
- Realizar requisições HTTP (GET, POST)
- Adicionar headers padrão
- Tratamento de erros global
- Logging de requisições

### Métodos Principais

#### `get<T>(endpoint: string, params?: any): Promise<T>`
```typescript
async buscarChecklists() {
  const checklists = await this.apiService.get('/b_veicular_get.php', {
    acao: 'todos',
    limite: 50
  });
  return checklists;
}
```

#### `post<T>(endpoint: string, body: any): Promise<T>`
```typescript
async criarInspecao(dados: ChecklistSimples) {
  const response = await this.apiService.post('/b_veicular_set.php', dados);
  return response;
}
```

### Configuração
```typescript
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.get<T>(url, { params }).toPromise();
  }

  post<T>(endpoint: string, body: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.post<T>(url, body).toPromise();
  }
}
```

---

## 🔐 AuthService

### Descrição
Gerenciamento de autenticação, sessão e autorização.

**Arquivo:** `auth.service.ts`

### Responsabilidades
- Login/logout
- Armazenamento de dados de usuário
- Verificação de permissões
- Gerenciamento de token
- Status de tutorial

### Métodos Principais

#### `login(nome: string, senha: string): Promise<LoginResponse>`
```typescript
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
```

#### `logout(): Promise<void>`
```typescript
async logout() {
  await Preferences.clear();
  this.router.navigate(['/login']);
}
```

#### `isAuthenticated(): Promise<boolean>`
```typescript
async isAuthenticated(): Promise<boolean> {
  const userId = await Preferences.get({ key: 'usuario_id' });
  return !!userId.value;
}
```

#### `getUserType(): Promise<TipoUsuario>`
```typescript
async getUserType(): Promise<TipoUsuario> {
  const tipo = await Preferences.get({ key: 'usuario_tipo' });
  return tipo.value as TipoUsuario;
}
```

#### `isAdmin(): Promise<boolean>`
```typescript
async isAdmin(): Promise<boolean> {
  const tipo = await this.getUserType();
  return tipo === 'admin';
}
```

---

## 📋 ChecklistDataService

### Descrição
Compartilhamento de dados entre as telas do fluxo de inspeção.

**Arquivo:** `checklist-data.service.ts`

### Responsabilidades
- Armazenar dados temporários da inspeção
- Compartilhar ID da inspeção entre telas
- Estado compartilhado

### Métodos Principais

#### `setInspecaoId(id: number): void`
```typescript
setInspecaoId(id: number) {
  this.inspecaoId = id;
}
```

#### `getInspecaoId(): number | null`
```typescript
getInspecaoId(): number | null {
  return this.inspecaoId;
}
```

#### `setPlaca(placa: string): void`
```typescript
setPlaca(placa: string) {
  this.placa = placa;
}
```

### Estrutura
```typescript
@Injectable({
  providedIn: 'root'
})
export class ChecklistDataService {
  private inspecaoId: number | null = null;
  private placa: string = '';

  constructor() {}

  // ... métodos
}
```

---

## 💾 LocalStorageService

### Descrição
Abstração para operações de armazenamento local usando Capacitor Preferences.

**Arquivo:** `local-storage.service.ts` (se existir) ou uso direto do Preferences

### Responsabilidades
- Salvar/recuperar dados localmente
- Serialização/desserialização JSON
- Limpeza de dados

### Exemplo de Uso
```typescript
// Salvar
await Preferences.set({
  key: 'inspecao_em_andamento',
  value: JSON.stringify(dados)
});

// Recuperar
const { value } = await Preferences.get({
  key: 'inspecao_em_andamento'
});
const dados = JSON.parse(value);

// Remover
await Preferences.remove({ key: 'inspecao_em_andamento' });

// Limpar tudo
await Preferences.clear();
```

---

## 📸 PhotoCompressionService

### Descrição
Compressão de imagens antes do upload para reduzir tamanho e melhorar performance.

**Arquivo:** `photo-compression.service.ts`

### Responsabilidades
- Comprimir fotos em base64
- Redimensionar imagens
- Otimizar qualidade

### Método Principal

#### `compress(base64: string, quality: number, maxWidth: number): Promise<string>`
```typescript
async compress(
  base64: string,
  quality: number = 0.45,
  maxWidth: number = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Redimensionar se necessário
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Comprimir
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };

    img.onerror = reject;
    img.src = base64;
  });
}
```

### Exemplo de Uso
```typescript
const fotoOriginal = 'data:image/jpeg;base64,...'; // 2MB
const fotoComprimida = await this.photoCompression.compress(
  fotoOriginal,
  0.45, // 45% de qualidade
  1200  // max 1200px de largura
);
// fotoComprimida agora tem ~200KB
```

---

## ⚙️ ConfigItensService

### Descrição
Gerenciamento de itens de configuração para checklists simples.

**Arquivo:** `config-itens.service.ts`

### Responsabilidades
- CRUD de itens de configuração
- Cache de itens habilitados
- Sincronização com API

### Métodos Principais

#### `getItensHabilitados(): Promise<ConfigItem[]>`
```typescript
async getItensHabilitados() {
  const response = await this.api.get('/b_veicular_config_itens.php', {
    acao: 'habilitados'
  });
  return response.itens;
}
```

#### `toggleItem(id: number, habilitado: boolean): Promise<void>`
```typescript
async toggleItem(id: number, habilitado: boolean) {
  await this.api.post('/b_config_itens.php', {
    acao: 'toggle',
    id,
    habilitado: habilitado ? 1 : 0
  });
}
```

---

## ⏱️ TempoTelasService

### Descrição
Rastreamento de tempo gasto em cada tela para análise de UX.

**Arquivo:** `tempo-telas.service.ts`

### Responsabilidades
- Registrar tempo por tela
- Enviar dados para API
- Análise de eficiência

### Método Principal

#### `registrar(dados: TempoTela): Promise<void>`
```typescript
async registrar(dados: TempoTela) {
  try {
    await this.api.post('/b_veicular_tempotelas.php', dados);
  } catch (erro) {
    console.error('Erro ao registrar tempo', erro);
  }
}
```

### Uso nas Páginas
```typescript
export class InspecaoInicialPage {
  tempoInicio: number;

  ionViewDidEnter() {
    this.tempoInicio = Date.now();
  }

  async ionViewWillLeave() {
    const tempoGasto = (Date.now() - this.tempoInicio) / 1000;

    await this.tempoTelasService.registrar({
      usuario_id: this.usuarioId,
      tela: 'inspecao_inicial',
      tempo_segundos: tempoGasto,
      data: new Date().toISOString()
    });
  }
}
```

---

## 🔍 LoggerService

### Descrição
Sistema centralizado de logging para debug e monitoramento.

**Arquivo:** `logger.service.ts`

### Responsabilidades
- Log de requisições HTTP
- Log de erros
- Agrupamento de logs
- Níveis de log (info, warn, error)

### Métodos Principais

#### `log(mensagem: string, dados?: any): void`
```typescript
log(mensagem: string, dados?: any) {
  console.log(`[LOG] ${mensagem}`, dados);
}
```

#### `error(mensagem: string, erro?: any): void`
```typescript
error(mensagem: string, erro?: any) {
  console.error(`[ERROR] ${mensagem}`, erro);
}
```

#### `group(titulo: string, fn: () => void): void`
```typescript
group(titulo: string, fn: () => void) {
  console.group(titulo);
  fn();
  console.groupEnd();
}
```

---

## 🚨 ErrorHandlerService

### Descrição
Tratamento centralizado de erros da aplicação.

**Arquivo:** `error-handler.service.ts`

### Responsabilidades
- Capturar erros globais
- Exibir mensagens amigáveis
- Log de erros
- Retry de operações

### Método Principal

#### `handleError(erro: any): void`
```typescript
async handleError(erro: any) {
  let mensagem = 'Erro desconhecido';

  if (erro.status === 0) {
    mensagem = 'Sem conexão com internet';
  } else if (erro.status === 404) {
    mensagem = 'Recurso não encontrado';
  } else if (erro.status === 500) {
    mensagem = 'Erro no servidor';
  } else if (erro.message) {
    mensagem = erro.message;
  }

  const toast = await this.toastController.create({
    message: mensagem,
    duration: 3000,
    color: 'danger',
    position: 'top'
  });

  await toast.present();

  // Log do erro
  this.logger.error('Erro capturado:', erro);
}
```

---

## 🔄 Integração entre Serviços

### Exemplo de Fluxo Completo
```typescript
export class InspecaoInicialPage {
  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private checklistDataService: ChecklistDataService,
    private photoCompression: PhotoCompressionService,
    private tempoTelasService: TempoTelasService,
    private errorHandler: ErrorHandlerService
  ) {}

  async salvarInspecao() {
    try {
      // 1. Comprimir foto
      const fotoComprimida = await this.photoCompression.compress(
        this.fotoPainel,
        0.45,
        1200
      );

      // 2. Salvar na API
      const response = await this.apiService.post('/b_veicular_set.php', {
        placa: this.placa,
        km_inicial: this.kmInicial,
        nivel_combustivel: this.nivelCombustivel,
        foto_painel: fotoComprimida,
        usuario_id: await this.authService.getUserId()
      });

      // 3. Armazenar ID para próximas telas
      this.checklistDataService.setInspecaoId(response.id);

      // 4. Navegar
      this.router.navigate(['/inspecao-veiculo']);

    } catch (erro) {
      this.errorHandler.handleError(erro);
    }
  }
}
```

---

## 📚 Resumo dos Serviços

| Serviço | Responsabilidade | Uso |
|---------|------------------|-----|
| **ApiService** | Comunicação HTTP | Todas as páginas |
| **AuthService** | Autenticação | Login, guards |
| **ChecklistDataService** | Estado compartilhado | Fluxo de inspeção |
| **PhotoCompressionService** | Compressão de imagens | Captura de fotos |
| **ConfigItensService** | Configuração | Admin, inspeções |
| **TempoTelasService** | Rastreamento de tempo | Todas as páginas |
| **LoggerService** | Logging | Debug |
| **ErrorHandlerService** | Tratamento de erros | Global |

---

## 🔗 Links Relacionados

- [API](./11-api.md)
- [Modelos](./12-modelos.md)
- [Fluxo de Dados](./10-fluxo-dados.md)

---

[← Voltar ao Índice](./index.md)
