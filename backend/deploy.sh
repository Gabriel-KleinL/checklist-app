#!/bin/bash

# Script de Deploy do Backend Node.js
# Uso: ./deploy.sh [local|staging|production]

set -e

ENVIRONMENT=${1:-local}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================"
echo "Deploy do Backend Node.js"
echo "Ambiente: $ENVIRONMENT"
echo "======================================"
echo ""

# Validar ambiente
if [[ ! "$ENVIRONMENT" =~ ^(local|staging|production)$ ]]; then
  echo "❌ Erro: Ambiente inválido. Use: local, staging ou production"
  exit 1
fi

# Verificar se arquivo .env existe
ENV_FILE="$SCRIPT_DIR/.env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  Aviso: Arquivo $ENV_FILE não encontrado"
  echo "    Usando variáveis de ambiente do sistema"
fi

# Instalar dependências
echo "📦 Instalando dependências..."
cd "$SCRIPT_DIR"
npm install --production

# Para ambientes remotos (staging/production)
if [[ "$ENVIRONMENT" == "staging" || "$ENVIRONMENT" == "production" ]]; then
  # Verificar se PM2 está instalado
  if ! command -v pm2 &> /dev/null; then
    echo "❌ Erro: PM2 não está instalado"
    echo "    Instale com: npm install -g pm2"
    exit 1
  fi

  # Criar diretório de logs se não existir
  mkdir -p "$SCRIPT_DIR/logs"

  # Parar processo anterior se existir
  echo "🛑 Parando processos anteriores..."
  if [[ "$ENVIRONMENT" == "staging" ]]; then
    pm2 stop checklist-backend-staging 2>/dev/null || true
    pm2 delete checklist-backend-staging 2>/dev/null || true
  else
    pm2 stop checklist-backend 2>/dev/null || true
    pm2 delete checklist-backend 2>/dev/null || true
  fi

  # Iniciar com PM2
  echo "🚀 Iniciando backend com PM2..."
  if [[ "$ENVIRONMENT" == "staging" ]]; then
    pm2 start ecosystem.config.js --env staging
  else
    pm2 start ecosystem.config.js --env production
  fi

  # Salvar configuração do PM2
  pm2 save

  # Mostrar status
  pm2 list
  echo ""
  echo "✅ Deploy concluído!"
  echo ""
  echo "Comandos úteis:"
  echo "  pm2 logs checklist-backend-$ENVIRONMENT  # Ver logs"
  echo "  pm2 restart checklist-backend-$ENVIRONMENT  # Reiniciar"
  echo "  pm2 stop checklist-backend-$ENVIRONMENT  # Parar"
  echo ""

else
  # Modo local - apenas iniciar
  echo "🚀 Iniciando backend local..."
  echo ""
  NODE_ENV=$ENVIRONMENT npm start
fi
