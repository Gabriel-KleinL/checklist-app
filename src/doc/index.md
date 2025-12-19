# 📱 Checklist Veicular - Documentação Completa

Bem-vindo à documentação completa do aplicativo **Checklist Veicular**!

## 📋 Sobre o Aplicativo

O **Checklist Veicular** é um aplicativo móvel desenvolvido com **Ionic Angular** para realizar inspeções detalhadas de veículos de frota. O sistema permite que inspetores realizem checklists completos com captura de fotos, marcações de defeitos e sincronização automática com o backend.

### Recursos Principais

- ✅ Autenticação local e via Microsoft Azure
- 📸 Captura e anotação de fotos com ferramentas de desenho
- 🔄 Sincronização automática com backend
- 📊 Dashboard administrativo com métricas e análises
- 🔧 Configuração dinâmica de itens de inspeção
- ⚠️ Sistema de rastreamento de anomalias
- 💾 Persistência local para trabalho offline
- ⏱️ Rastreamento de tempo por tela

---

## 🗂️ Índice da Documentação

### 🎯 Visão Geral
- [Visão Geral do Sistema](./01-visao-geral.md)
- [Fluxo de Dados e Workflow](./10-fluxo-dados.md)

### 📱 Telas do Aplicativo (Fluxo do Inspetor)

1. [Login - Autenticação](./02-login.md)
2. [Home - Menu Principal](./03-home.md)
3. [Inspeção Inicial - Placa, KM e Combustível](./04-inspecao-inicial.md)
4. [Inspeção do Veículo - Motor, Elétrico, Limpeza e Ferramentas](./05-inspecao-veiculo.md)
5. [Fotos do Veículo - Capturas e Anotações](./06-fotos-veiculo.md)
6. [Inspeção de Pneus - Condição e Pressão](./07-pneus.md)
7. [Checklist Completo - Inspeção em 5 Partes](./09-checklist-completo.md)

### 🔐 Área Administrativa

8. [Dashboard Admin - Histórico, Anomalias, Configuração e Métricas](./08-admin.md)

### 🛠️ Documentação Técnica

- [API - Endpoints e Integração](./11-api.md)
- [Modelos de Dados - Estruturas e Tipos](./12-modelos.md)
- [Serviços - Lógica de Negócio](./13-servicos.md)

---

## 🚀 Fluxo de Uso Rápido

### Para Inspetores

```
Login → Home → Inspeção Inicial → Inspeção Veículo → Fotos → Pneus → Finalizar
```

### Para Administradores

```
Login → Admin → [Histórico | Anomalias | Configuração | Métricas]
```

---

## 🎨 Tipos de Checklist

O aplicativo suporta dois tipos de checklist:

### 1. Checklist Simples
Inspeção padrão para veículos comuns, incluindo:
- Motor (nível de óleo, água, etc.)
- Elétrico (setas, faróis, etc.)
- Limpeza (interna e externa)
- Ferramentas (macaco, triângulo, etc.)
- Pneus (condição e pressão)

### 2. Checklist Completo
Inspeção abrangente em 5 partes para veículos pesados (ônibus, caminhões):
- Parte 1: Interna (buzina, cintos, espelhos, etc.)
- Parte 2: Equipamentos (extintor, triângulo, estepe, etc.)
- Parte 3: Dianteira (faróis, pneus, para-choque, etc.)
- Parte 4: Traseira (lanternas, para-choque, pneus, etc.)
- Parte 5: Veículos Pesados (certificado CETURB, fumaça preta, etc.)

---

## 🧭 Navegação por Perfil

### 👤 Perfil: Inspetor
- [Fluxo completo de inspeção](./10-fluxo-dados.md#fluxo-de-inspeção-simples)
- [Como capturar fotos](./06-fotos-veiculo.md)
- [Como marcar defeitos](./06-fotos-veiculo.md#ferramentas-de-marcação)
- [Inspeção de pneus](./07-pneus.md)

### 👨‍💼 Perfil: Administrador
- [Visualizar histórico](./08-admin.md#aba-1-histórico)
- [Gerenciar anomalias](./08-admin.md#aba-2-anomalias)
- [Configurar itens](./08-admin.md#aba-3-configuração)
- [Visualizar métricas](./08-admin.md#aba-4-métricas)

---

## 📖 Como Usar Esta Documentação

Cada página da documentação contém:

- **Descrição**: Objetivo e propósito da tela/funcionalidade
- **Campos/Elementos**: Detalhes de todos os campos e componentes
- **Funcionalidades**: Recursos disponíveis na tela
- **Validações**: Regras de validação e campos obrigatórios
- **Fluxo**: Navegação e próximas etapas
- **Código**: Localização dos arquivos relevantes

### Convenções

- 🔴 **Obrigatório**: Campo ou ação obrigatória
- ⚠️ **Validação**: Regra de validação importante
- 💡 **Dica**: Informação útil ou melhor prática
- 📸 **Foto**: Captura de imagem necessária
- 🔄 **Sincronização**: Dados salvos localmente ou na API

---

## 🔧 Tecnologias Utilizadas

- **Frontend**: Ionic 8 + Angular 20
- **Backend**: PHP + MySQL/MariaDB
- **Linguagem**: TypeScript
- **Storage**: Capacitor Preferences
- **Câmera**: Capacitor Camera
- **Gráficos**: Chart.js
- **Tours**: Driver.js
- **PDF**: jsPDF

---

## 📞 Suporte e Informações

- **Versão do App**: Consulte `package.json`
- **API Base URL**: `https://floripa.in9automacao.com.br`
- **Repositório**: `/home/user/checklist-app`

---

## 🗺️ Mapa do Site

```
📱 Checklist Veicular
├── 🔐 Autenticação
│   └── Login (local ou Microsoft)
├── 📋 Inspeção Simples
│   ├── 1. Inspeção Inicial
│   ├── 2. Inspeção Veículo
│   ├── 3. Fotos Veículo
│   └── 4. Pneus
├── 📋 Inspeção Completa
│   ├── Dados Iniciais
│   ├── Parte 1: Interna
│   ├── Parte 2: Equipamentos
│   ├── Parte 3: Dianteira
│   ├── Parte 4: Traseira
│   └── Parte 5: Veículos Pesados
└── 🔐 Admin
    ├── Histórico
    ├── Anomalias
    ├── Configuração
    └── Métricas
```

---

## 📚 Próximos Passos

1. Comece pela [Visão Geral do Sistema](./01-visao-geral.md) para entender a arquitetura
2. Explore o [Fluxo de Dados](./10-fluxo-dados.md) para compreender o funcionamento completo
3. Consulte as telas específicas conforme necessidade
4. Revise a [documentação da API](./11-api.md) para integrações

---

**Última atualização**: 2025-12-19
