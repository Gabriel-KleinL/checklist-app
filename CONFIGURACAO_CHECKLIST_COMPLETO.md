# Configuração de Itens do Checklist Completo

Este documento descreve como configurar e gerenciar os itens do checklist completo.

## Instalação

### 1. Executar o script de instalação

Execute o arquivo PHP para criar a tabela e popular com os itens padrão:

```bash
php api/instalar_config_checklist_completo.php
```

Ou acesse via navegador:
```
http://seu-servidor/api/instalar_config_checklist_completo.php
```

### 2. Verificar instalação

O script irá:
- Criar a tabela `bbb_config_itens_completo`
- Inserir todos os itens padrão
- Mostrar um relatório com o total de itens por categoria

## Estrutura da Tabela

```sql
bbb_config_itens_completo
├── id (INT) - ID único do item
├── categoria (VARCHAR) - Categoria do item
├── nome_item (VARCHAR) - Nome do item
├── tipo_campo (VARCHAR) - Tipo: checkbox, select ou number
├── opcoes_select (TEXT) - Opções para campos select (JSON)
├── habilitado (TINYINT) - 1 = habilitado, 0 = desabilitado
├── obrigatorio (TINYINT) - 1 = obrigatório, 0 = opcional
├── ordem (INT) - Ordem de exibição
├── usuario_id (INT) - ID do usuário que criou (opcional)
├── usuario_nome (VARCHAR) - Nome do usuário que criou (opcional)
├── created_at (TIMESTAMP) - Data de criação
└── updated_at (TIMESTAMP) - Data da última atualização
```

## Categorias

O checklist completo possui 5 categorias (partes):

1. **PARTE1_INTERNA** - Itens internos do veículo
   - Buzina, cintos de segurança, espelhos, etc.

2. **PARTE2_EQUIPAMENTOS** - Equipamentos obrigatórios
   - Extintor, macaco, triângulo, chave de roda, etc.

3. **PARTE3_DIANTEIRA** - Itens da parte dianteira externa
   - Faróis, setas, pneus dianteiros, para-choque, etc.

4. **PARTE4_TRASEIRA** - Itens da parte traseira externa
   - Lanternas, setas traseiras, pneus traseiros, etc.

5. **PARTE5_ESPECIAL** - Itens específicos para veículos especiais
   - Ônibus, caminhões, carro-tanque

## API Endpoints

### GET - Buscar itens

#### Buscar todos os itens
```
GET /api/b_checklist_completo_config_itens.php?acao=todos
```

#### Buscar por categoria
```
GET /api/b_checklist_completo_config_itens.php?acao=categoria&categoria=PARTE1_INTERNA
```

#### Buscar apenas habilitados
```
GET /api/b_checklist_completo_config_itens.php?acao=habilitados
GET /api/b_checklist_completo_config_itens.php?acao=habilitados&categoria=PARTE1_INTERNA
```

#### Buscar agrupados por parte
```
GET /api/b_checklist_completo_config_itens.php?acao=por_parte
```

Retorna:
```json
{
  "PARTE1_INTERNA": [...],
  "PARTE2_EQUIPAMENTOS": [...],
  "PARTE3_DIANTEIRA": [...],
  "PARTE4_TRASEIRA": [...],
  "PARTE5_ESPECIAL": [...]
}
```

### POST - Atualizar/Adicionar itens

#### Atualizar um item
```json
POST /api/b_checklist_completo_config_itens.php
{
  "acao": "atualizar_item",
  "id": 1,
  "habilitado": true,
  "obrigatorio": false,
  "ordem": 5
}
```

#### Atualizar múltiplos itens
```json
POST /api/b_checklist_completo_config_itens.php
{
  "acao": "atualizar_multiplos",
  "itens": [
    {"id": 1, "habilitado": true},
    {"id": 2, "habilitado": false},
    {"id": 3, "ordem": 10}
  ]
}
```

#### Adicionar novo item
```json
POST /api/b_checklist_completo_config_itens.php
{
  "acao": "adicionar_item",
  "categoria": "PARTE1_INTERNA",
  "nome_item": "Novo Item",
  "tipo_campo": "checkbox",
  "habilitado": true,
  "obrigatorio": false,
  "ordem": 0,
  "usuario_id": 1,
  "usuario_nome": "Admin"
}
```

Para campos do tipo SELECT:
```json
{
  "acao": "adicionar_item",
  "categoria": "PARTE4_TRASEIRA",
  "nome_item": "Estado do Bagageiro",
  "tipo_campo": "select",
  "opcoes_select": ["otimo", "bom", "regular", "ruim"],
  "habilitado": true
}
```

### DELETE - Remover item

```json
DELETE /api/b_checklist_completo_config_itens.php
{
  "id": 123
}
```

## Tipos de Campos

### 1. Checkbox (boolean)
```json
{
  "tipo_campo": "checkbox",
  "opcoes_select": null
}
```
Usado para itens sim/não (funciona/não funciona, tem/não tem).

### 2. Select (opções)
```json
{
  "tipo_campo": "select",
  "opcoes_select": ["bom", "regular", "ruim"]
}
```
Usado para itens com múltiplas opções predefinidas.

### 3. Number (numérico)
```json
{
  "tipo_campo": "number",
  "opcoes_select": null
}
```
Usado para valores numéricos (ex: quantidade de parafusos).

## Exemplos de Uso no App

### Frontend - TypeScript Service

```typescript
// config-itens-completo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigItensCompletoService {
  private apiUrl = 'http://seu-servidor/api/b_checklist_completo_config_itens.php';

  constructor(private http: HttpClient) {}

  // Buscar todos os itens
  buscarTodos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?acao=todos`);
  }

  // Buscar itens por categoria
  buscarPorCategoria(categoria: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?acao=categoria&categoria=${categoria}`);
  }

  // Buscar apenas habilitados
  buscarHabilitados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?acao=habilitados`);
  }

  // Buscar agrupados por parte
  buscarPorParte(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?acao=por_parte`);
  }

  // Atualizar item
  atualizarItem(id: number, dados: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      acao: 'atualizar_item',
      id: id,
      ...dados
    });
  }

  // Adicionar novo item
  adicionarItem(dados: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      acao: 'adicionar_item',
      ...dados
    });
  }

  // Remover item
  removerItem(id: number): Observable<any> {
    return this.http.delete<any>(this.apiUrl, {
      body: { id: id }
    });
  }
}
```

## Fluxo de Uso

1. **Administrador acessa painel**
   - Vê todos os itens configuráveis
   - Pode habilitar/desabilitar itens
   - Pode adicionar novos itens customizados
   - Pode remover itens criados por ele

2. **App carrega itens habilitados**
   - Ao abrir o checklist completo
   - Busca apenas itens habilitados da categoria atual
   - Exibe campos dinamicamente baseado no tipo

3. **Usuário preenche checklist**
   - Vê apenas campos habilitados
   - Campos obrigatórios são validados
   - Campos customizados aparecem junto com padrão

## Notas Importantes

- **Itens padrão**: Não devem ser removidos, apenas desabilitados
- **Itens customizados**: Podem ser removidos pelo criador
- **Ordem**: Define a ordem de exibição (0 = primeiro)
- **Obrigatório**: Ainda não implementado no frontend (futuro)
- **Backup**: Sempre faça backup antes de modificar itens em produção

## Migração de Dados Existentes

Se você já tem checklists completos salvos, eles continuarão funcionando. Os novos itens configuráveis serão usados apenas para **novos** checklists criados após a instalação.

## Suporte

Em caso de problemas:
1. Verifique os logs do servidor PHP
2. Verifique se a tabela foi criada corretamente
3. Confirme que o arquivo de configuração do banco está correto
4. Teste os endpoints via Postman ou cURL
