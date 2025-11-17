# Checklist Completo - Documentação

## 📋 Resumo

Sistema de checklist completo com **74 itens** divididos em 6 partes para inspeção detalhada de veículos.

## 🗂️ Estrutura do Checklist

### **Dados Iniciais (5 itens)**
- Placa
- KM Inicial
- Nível de Combustível
- Foto do Painel
- Observação do Painel

### **Parte 1 - INTERNA (12 itens)**
Verificação de componentes internos do veículo:
- Buzina
- Cintos de Segurança (Dianteiro e Traseiro)
- Espelhos Retrovisores
- Freio de Mão
- Limpador de Parabrisa
- Para-Sol
- Velocímetro
- Luzes (Painel e Interna)
- Alça de Transporte
- Estado de Conservação Interna

### **Parte 2 - PEÇAS / EQUIPAMENTOS OBRIGATÓRIOS (7 itens)**
Verificação de equipamentos obrigatórios:
- Espelhos Retrovisores Externos (Direito e Esquerdo)
- Extintor (sem/com cheio/com vazio)
- Chave de Roda
- Macaco
- Triângulo
- Pneu Sobressalente

### **Parte 3 - EXTERNA DIANTEIRA (13 itens)**
Inspeção frontal do veículo:
- Faroletes (Direito e Esquerdo)
- Faróis Alto e Baixo (ambos os lados)
- Setas Dianteiras
- Pneus Dianteiros (condição + parafusos)
- Para-Choque Dianteiro

### **Parte 4 - EXTERNA TRASEIRA (23 itens)**
Inspeção traseira e lateral:
- Lanternas Traseiras
- Lanternas de Marcha Ré
- Iluminação da Placa
- Setas Traseiras
- Luz de Parada e Alerta
- Para-Choque Traseiro
- Lacre da Placa
- Pneus Traseiros (condição + parafusos)
- Protetores de Rodas
- Estado da Carroceria
- Silencioso
- Corrosão (Lataria e Fundo)
- Freios de Estacionamento
- Logomarca
- Vazamentos

### **Parte 5 - ÔNIBUS / CAMINHÕES / CARRO TANQUE (14 itens)**
Itens específicos para veículos pesados:
- Certificado Ceturb
- Fumaça Preta
- Corrosão (Cavalo, Carroceria, Carreta)
- Alça Eixo Cardan
- Protetores de Rodas Traseiras
- Freio de Marcha
- Alarme Sonoro de Ré
- Enlonamento
- Bomba de Recalque
- Adesivos Refletores
- Altura do Para-Choque
- Estado das Mangueiras

## 🗄️ Banco de Dados

### Tabela: `bbb_checklist_completo`

```sql
CREATE TABLE bbb_checklist_completo (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Dados básicos
    placa VARCHAR(10) NOT NULL,
    km_inicial INT DEFAULT 0,
    nivel_combustivel VARCHAR(10) DEFAULT '0%',
    foto_painel LONGTEXT,
    observacao_painel TEXT,

    -- Usuário
    usuario_id INT,

    -- Data
    data_realizacao DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Partes (armazenadas como JSON)
    parte1_interna JSON,
    parte2_equipamentos JSON,
    parte3_dianteira JSON,
    parte4_traseira JSON,
    parte5_especial JSON,

    -- Metadados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Chave estrangeira
    FOREIGN KEY (usuario_id) REFERENCES bbb_usuario(id) ON DELETE SET NULL
);
```

## 📁 Arquivos Criados

### SQL
- `checklist_completo_schema.sql` - Schema da tabela

### Backend (API)
- `api/b_checklist_completo_set.php` - Salvar checklist completo
- `api/b_checklist_completo_get.php` - Buscar checklists completos

### Frontend (Angular/Ionic)
- Já existente: `src/app/checklist-completo/` - Componente completo

## 🔌 API Endpoints

### POST `/api/b_checklist_completo_set.php`
Salva um novo checklist completo.

**Body:**
```json
{
  "placa": "ABC1234",
  "km_inicial": 50000,
  "nivel_combustivel": "3/4",
  "foto_painel": "data:image/jpeg;base64,...",
  "observacao_painel": "Luz de check engine acesa",
  "usuario_id": 2,
  "data_realizacao": "2025-11-07T14:30:00",
  "parte1": { ... },
  "parte2": { ... },
  "parte3": { ... },
  "parte4": { ... },
  "parte5": { ... }
}
```

**Response:**
```json
{
  "sucesso": true,
  "mensagem": "Checklist completo salvo com sucesso",
  "id": 123
}
```

### GET `/api/b_checklist_completo_get.php`

**Ações disponíveis:**

1. **Buscar por ID:** `?acao=id&id=123`
2. **Buscar por Placa:** `?acao=placa&placa=ABC1234`
3. **Buscar por Período:** `?acao=periodo&data_inicio=2025-01-01&data_fim=2025-12-31`
4. **Buscar por Usuário:** `?acao=usuario&usuario_id=2`
5. **Buscar Todos:** `?acao=todos&limite=100`
6. **Estatísticas:** `?acao=estatisticas`

## 🚀 Como Usar

### 1. Criar a Tabela no Banco
```bash
mysql -u usuario -p nome_banco < checklist_completo_schema.sql
```

### 2. Acessar o Checklist Completo
No painel admin, há um botão "Acessar Checklist Completo" que redireciona para `/checklist-completo`.

### 3. Preencher o Checklist
- O checklist é dividido em 6 partes navegáveis
- Barra de progresso mostra o andamento
- Todos os campos são opcionais (exceto aviso para placa inválida)
- Ao final, clicar em "Salvar Checklist"

## 🔍 Diferença entre Checklist Simples e Completo

### Checklist Simples (Fluxo Principal)
- 4 telas sequenciais
- Foco em itens essenciais
- Campos obrigatórios
- Fotos obrigatórias para problemas
- Salva incrementalmente (cria inspeção logo no início)
- Rastreamento de tempo por tela

### Checklist Completo
- 6 partes em uma única página
- 74 itens detalhados
- Todos os campos opcionais
- Voltado para inspeções completas
- Salva tudo de uma vez no final
- Não tem rastreamento de tempo por tela

## 📊 Estrutura JSON das Partes

As 5 partes são armazenadas como JSON no banco de dados, exemplo:

```json
{
  "parte1_interna": {
    "buzina": true,
    "cintoSegurancaDianteiro": true,
    "cintoSegurancaTraseiro": false,
    "espelhoRetrovisorInterno": true,
    "estadoConservacaoInterna": "Bom"
  },
  "parte2_equipamentos": {
    "extintor": "com_cheio",
    "macaco": true,
    "triangulo": true
  }
}
```

## ✅ Testado e Funcionando

- [x] Schema SQL criado
- [x] API de salvamento (POST)
- [x] API de busca (GET)
- [x] Integração no frontend
- [x] Componente checklist-completo atualizado

## 📝 Notas Importantes

1. **Campos JSON:** As partes são armazenadas como JSON para flexibilidade futura
2. **Validação:** Apenas a placa tem validação (com aviso, não bloqueio)
3. **Usuário:** Se não informado, usa o primeiro usuário ativo do banco
4. **Data:** Usa timestamp ISO 8601, convertido para MySQL datetime
5. **Fotos:** Foto do painel armazenada como base64 em LONGTEXT
