# Guia de Segurança - Checklist App

## ⚠️ CRÍTICO: Credenciais

### Arquivos com Credenciais (NÃO VERSIONAR)

```bash
# Estes arquivos contêm senhas e NÃO devem estar no Git
api/.env
api-staging/.env

# Verificar se estão protegidos:
git status  # Não devem aparecer
```

### Configuração de .env

**Produção** (`api/.env`):
```env
DB_HOST=187.49.226.10
DB_PORT=3306
DB_NAME=f137049_in9aut
DB_USER=f137049_tool
DB_PASSWORD=In9@1234qwer  # ⚠️ Trocar em produção real!
ENVIRONMENT=production
```

**Staging** (`api-staging/.env`):
```env
DB_HOST=187.49.226.10
DB_PORT=3306
DB_NAME=f137049_in9aut
DB_USER=f137049_tool
DB_PASSWORD=In9@1234qwer  # ⚠️ Mesmas credenciais, mas READ-ONLY
ENVIRONMENT=staging
READ_ONLY_MODE=true
```

### Como o .env é Carregado

Os arquivos `b_veicular_config.php` e `hml_veicular_config.php` leem automaticamente o `.env`:

```php
// Carregar variáveis de ambiente
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0 || empty(trim($line))) {
            continue;  // Ignora comentários
        }
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

// Usar com fallback
$host = getenv('DB_HOST') ?: '187.49.226.10';
```

### Proteção no .gitignore

Arquivo `.gitignore` configurado para proteger:
```gitignore
# Environment files with credentials
api/.env
api-staging/.env
.env
```

## Vulnerabilidades Conhecidas

### ✅ Protegido Contra

#### SQL Injection
- ✅ **Todos os endpoints usam prepared statements**
- ✅ Parâmetros vinculados com `:placeholder`
- ✅ Nunca concatenação direta de SQL

Exemplo seguro:
```php
$sql = "SELECT * FROM bbb_inspecao_veiculo WHERE placa = :placa";
$stmt = $pdo->prepare($sql);
$stmt->execute(['placa' => $_GET['placa']]);
```

#### Staging Read-Only
- ✅ **Wrapper bloqueia INSERT/UPDATE/DELETE em staging**
- ✅ Logs de tentativas bloqueadas
- ✅ Exception lançada em operações de escrita

```php
class ReadOnlyPDOWrapper {
    public function prepare($sql, $options = array()) {
        if (preg_match('/^(INSERT|UPDATE|DELETE|ALTER|DROP)/i', $sql)) {
            throw new Exception("❌ Operações de escrita bloqueadas em STAGING");
        }
        return $this->pdo->prepare($sql, $options);
    }
}
```

### ⚠️ Riscos Atuais

#### 1. CORS Aberto
**Problema**: `Access-Control-Allow-Origin: *` em todos endpoints

**Impacto**: Qualquer site pode fazer requisições à API

**Mitigação Recomendada**:
```php
// Substituir:
header('Access-Control-Allow-Origin: *');

// Por (exemplo):
$allowed_origins = [
    'http://localhost:4200',
    'https://app.seudominio.com.br'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}
```

#### 2. Sem Autenticação
**Problema**: Endpoints não verificam usuário/token

**Impacto**: Qualquer um pode acessar/modificar dados

**Mitigação Recomendada**:
```php
// Adicionar em todos endpoints:
function verificarAutenticacao() {
    $token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (empty($token) || !validarToken($token)) {
        http_response_code(401);
        echo json_encode(['erro' => 'Não autorizado']);
        exit;
    }
}

verificarAutenticacao();
```

#### 3. Fotos Base64 em Banco
**Problema**: Armazenar imagens base64 causa:
- Estouro de memória (128MB+)
- Queries lentas
- Backup pesado

**Status**: ⚠️ Migração planejada (Fase 2 do plano)

**Solução**: Mover para filesystem/cloud storage

#### 4. Logs Verbosos
**Problema**: Erros detalhados expostos ao cliente

**Exemplo**:
```php
catch (PDOException $e) {
    echo json_encode(['erro' => $e->getMessage()]);  // ⚠️ Expõe estrutura do banco
}
```

**Correção**:
```php
catch (PDOException $e) {
    error_log("Erro BD: " . $e->getMessage());  // Log no servidor
    echo json_encode(['erro' => 'Erro ao processar requisição']);  // Cliente
}
```

## Checklist de Segurança

### Antes de Deploy
- [ ] Verificar que `.env` não está no Git
- [ ] Trocar senha do banco (se usar credenciais atuais)
- [ ] Configurar CORS restritivo
- [ ] Testar staging está em READ-ONLY
- [ ] Revisar logs de erro (não vazar detalhes)

### Monitoramento Contínuo
- [ ] Logs de acesso anormais
- [ ] Tentativas de SQL injection (erro 500s)
- [ ] Tentativas de escrita em staging (logs)
- [ ] Crescimento anormal do banco (fotos?)

### Auditoria Mensal
- [ ] Revisar permissões de usuários do banco
- [ ] Verificar tamanho das tabelas de fotos
- [ ] Analisar queries lentas
- [ ] Testar endpoints com scanner de vulnerabilidades

## Contatos de Emergência

**Se credenciais vazarem**:
1. ⚠️ **TROCAR SENHA DO BANCO IMEDIATAMENTE**
2. Notificar equipe
3. Revisar logs de acesso
4. Verificar integridade dos dados

**Banco de Dados**:
- Host: 187.49.226.10
- Admin: [Adicionar contato]

## Histórico de Mudanças

| Data | Mudança | Responsável |
|------|---------|-------------|
| 2026-01-13 | Credenciais movidas para .env | Claude |
| 2026-01-13 | .gitignore atualizado | Claude |
| 2026-01-13 | Documentação de segurança criada | Claude |

## Próximas Melhorias de Segurança

Ver `02-CLEANUP-PLAN.md` Fase 2 e Fase 3 para:
- Migração de fotos (performance + segurança)
- Consolidação de ambientes
- Autenticação de endpoints (planejado)

## Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PHP Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/PHP_Configuration_Cheat_Sheet.html)
- Plano completo: `../../.claude/plans/melodic-yawning-koala.md`
