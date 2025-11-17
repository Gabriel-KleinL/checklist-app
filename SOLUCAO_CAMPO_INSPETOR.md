
# Solução: Campo Inspetor Não Aparece

## Problema Identificado

O nome do inspetor não aparece porque:

1. O `veicular_set.php` está salvando `usuario_id = 1` como padrão (linha 94)
2. O usuário com ID 1 pode não existir na tabela `aaa_usuario`
3. O frontend não está enviando o `usuario_id` ao salvar o checklist

## Solução em 3 Passos

### PASSO 1: Diagnóstico

Execute o arquivo `diagnostico_usuario.sql` no phpMyAdmin para ver:
- Quais usuários existem
- Qual o menor ID disponível
- Quantas inspeções estão sem usuário válido

```bash
# Via phpMyAdmin: copie e cole o conteúdo
# Ou via terminal:
mysql -u seu_usuario -p seu_banco < diagnostico_usuario.sql
```

### PASSO 2: Corrigir Registros Antigos

Execute o arquivo `corrigir_usuario_id.sql` e escolha UMA das opções:

**OPÇÃO A:** Vincular todas inspeções a um usuário específico
```sql
UPDATE aaa_inspecao_veiculo
SET usuario_id = 5  -- Troque pelo ID do usuário correto
WHERE usuario_id IS NULL OR usuario_id NOT IN (SELECT id FROM aaa_usuario);
```

**OPÇÃO B:** Vincular ao primeiro usuário da lista
```sql
UPDATE aaa_inspecao_veiculo
SET usuario_id = (SELECT MIN(id) FROM aaa_usuario)
WHERE usuario_id IS NULL OR usuario_id NOT IN (SELECT id FROM aaa_usuario);
```

**OPÇÃO C:** Criar usuário "Sistema" para registros antigos
```sql
INSERT INTO aaa_usuario (nome, email, tipo_usuario)
VALUES ('Sistema', 'sistema@empresa.com', 'comum')
ON DUPLICATE KEY UPDATE nome = nome;

UPDATE aaa_inspecao_veiculo
SET usuario_id = (SELECT id FROM aaa_usuario WHERE nome = 'Sistema')
WHERE usuario_id IS NULL OR usuario_id NOT IN (SELECT id FROM aaa_usuario);
```

### PASSO 3: Atualizar o Valor Padrão no PHP

Edite o arquivo `api/veicular_set.php` na linha 94.

**Antes:**
```php
'usuario_id' => isset($dados['usuario_id']) ? $dados['usuario_id'] : 1
```

**Depois - Opção A (usar o menor ID disponível):**
```php
'usuario_id' => isset($dados['usuario_id']) ? $dados['usuario_id'] : null
```

Depois adicione esta query ANTES da linha 88:
```php
// Se não foi enviado usuario_id, usa o primeiro usuário disponível
if (!isset($dados['usuario_id']) || $dados['usuario_id'] === null) {
    $stmtUsuario = $pdo->query("SELECT MIN(id) as id FROM aaa_usuario WHERE ativo = 1");
    $usuarioPadrao = $stmtUsuario->fetch();
    $dados['usuario_id'] = $usuarioPadrao['id'] ?? 1;
}
```

**Depois - Opção B (usar um ID específico):**
```php
'usuario_id' => isset($dados['usuario_id']) ? $dados['usuario_id'] : 5  // ID do usuário padrão
```

Troque o `5` pelo ID do usuário que você quer usar como padrão.

## Solução Completa (Futuro): Adicionar Seletor de Usuário

Para uma solução mais robusta, adicione um campo de seleção de usuário na tela de inspeção inicial:

### 1. Criar endpoint para listar usuários ativos

**Arquivo: `api/usuarios_ativos.php`**
```php
<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once 'veicular_config.php';

try {
    $sql = "SELECT id, nome FROM aaa_usuario WHERE ativo = 1 ORDER BY nome";
    $stmt = $pdo->query($sql);
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($usuarios);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => $e->getMessage()]);
}
?>
```

### 2. Adicionar no serviço Angular

**Arquivo: `src/app/services/api.service.ts`**
```typescript
buscarUsuariosAtivos(): Observable<any> {
  return this.http.get(`${this.baseUrl}/usuarios_ativos.php`);
}
```

### 3. Adicionar select na tela de inspeção inicial

**Arquivo: `src/app/inspecao-inicial/inspecao-inicial.page.html`**
```html
<ion-item>
  <ion-label position="stacked">Inspetor</ion-label>
  <ion-select [(ngModel)]="usuarioId" interface="popover">
    <ion-select-option *ngFor="let usuario of usuarios" [value]="usuario.id">
      {{ usuario.nome }}
    </ion-select-option>
  </ion-select>
</ion-item>
```

**Arquivo: `src/app/inspecao-inicial/inspecao-inicial.page.ts`**
```typescript
usuarios: any[] = [];
usuarioId: number | null = null;

ngOnInit() {
  this.apiService.buscarUsuariosAtivos().subscribe(usuarios => {
    this.usuarios = usuarios;
    // Define o primeiro usuário como padrão
    if (usuarios.length > 0) {
      this.usuarioId = usuarios[0].id;
    }
  });
}

// Ao salvar, incluir o usuarioId no objeto
salvar() {
  const dados = {
    placa: this.placa,
    kmInicial: this.kmInicial,
    nivelCombustivel: this.nivelCombustivel,
    fotoPainel: this.fotoPainel,
    observacaoPainel: this.observacaoPainel
  };

  // Passar o usuarioId para o serviço de dados
  this.checklistDataService.setUsuarioId(this.usuarioId);
  this.checklistDataService.setInspecaoInicial(dados);
}
```

### 4. Atualizar o serviço de dados

**Arquivo: `src/app/services/checklist-data.service.ts`**
```typescript
export interface ChecklistCompleto {
  inspecaoInicial?: InspecaoInicialData;
  inspecaoVeiculo?: InspecaoVeiculoData;
  fotosVeiculo?: FotoVeiculoData[];
  pneus?: PneuData[];
  dataRealizacao?: Date;
  usuarioId?: number;  // <-- ADICIONAR
}

setUsuarioId(usuarioId: number | null) {
  this.checklistData.usuarioId = usuarioId;
}
```

### 5. Atualizar o transformador para API

**Arquivo: `src/app/services/api.service.ts` - método `transformarParaApiFormat`**
```typescript
transformarParaApiFormat(checklist: ChecklistCompleto): any {
  const dadosFinais = {
    usuario_id: checklist.usuarioId || null,  // <-- ADICIONAR
    placa: inspecaoInicial?.placa || '',
    km_inicial: inspecaoInicial?.kmInicial || 0,
    // ... resto dos campos
  };

  return dadosFinais;
}
```

## Verificação Final

Após executar os passos acima:

1. Execute no banco:
```sql
SELECT
    i.id,
    i.placa,
    u.nome as inspetor,
    i.data_realizacao
FROM aaa_inspecao_veiculo i
LEFT JOIN aaa_usuario u ON i.usuario_id = u.id
ORDER BY i.id DESC
LIMIT 5;
```

2. Acesse o painel administrativo
3. Clique em um checklist
4. Verifique se aparece: **"Inspetor: [Nome do Usuário]"**

## Resumo

- ✅ Execute `diagnostico_usuario.sql` para ver o estado atual
- ✅ Execute `corrigir_usuario_id.sql` para corrigir registros antigos
- ✅ Atualize o `veicular_set.php` linha 94 com um ID válido
- 🔄 (Opcional) Implemente o seletor de usuário no frontend
