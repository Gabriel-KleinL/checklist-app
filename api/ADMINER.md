# Adminer - Interface Web para MySQL

Adminer é uma ferramenta leve para gerenciar banco de dados MySQL via navegador.

## Como usar

### 1. Iniciar o Adminer
```bash
npm run adminer
```

Ou diretamente:
```bash
cd api
php -S localhost:9000 adminer.php
```

### 2. Acessar no navegador
**URL:** http://localhost:9000

### 3. Fazer login

**Banco Local:**
- System: `MySQL`
- Server: `localhost`
- Username: `root`
- Password: *(deixe em branco ou sua senha)*
- Database: `checklist_app_local`

**Banco Staging (se conectar remotamente):**
- System: `MySQL`
- Server: `seuservidor.com.br`
- Username: `seu_usuario`
- Password: `sua_senha`
- Database: `banco_staging`

## Funcionalidades

- ✅ Visualizar todas as tabelas
- ✅ Ver dados das tabelas
- ✅ Editar registros
- ✅ Executar queries SQL personalizadas
- ✅ Importar/Exportar dados
- ✅ Ver estrutura do banco

## Screenshots

Após login, você verá:
- Lista de tabelas à esquerda
- Dados das tabelas ao clicar
- Editor SQL para queries customizadas

## Parar o Adminer

Pressione `Ctrl+C` no terminal onde o Adminer está rodando.

Ou encontre o processo:
```bash
ps aux | grep adminer
kill <PID>
```

## Notas

- Arquivo: `api/adminer.php` (não commitado - está no .gitignore)
- Porta: `9000` (para não conflitar com backend na 8000)
- Versão: 4.8.1

## Alternativas

Se preferir ferramenta desktop:
- **TablePlus**: `brew install --cask tableplus`
- **MySQL Workbench**: `brew install --cask mysqlworkbench`
- **DBeaver**: `brew install --cask dbeaver-community`
