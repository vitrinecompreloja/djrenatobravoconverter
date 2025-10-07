#!/bin/bash

# Script de Deploy - DJ Renato Bravo Conversor
# Uso: ./deploy.sh [production|development]

set -e

MODE=${1:-development}
PROJECT_NAME="dj-renato-bravo-converter"

echo "🎵 Iniciando deploy do DJ Renato Bravo Conversor..."
echo "📋 Modo: $MODE"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Instale o Docker Compose primeiro."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down --remove-orphans || true

# Limpar imagens antigas (opcional)
if [ "$MODE" = "production" ]; then
    echo "🧹 Limpando imagens antigas..."
    docker system prune -f
fi

# Build e start dos containers
echo "🔨 Construindo e iniciando containers..."
if [ "$MODE" = "production" ]; then
    docker-compose up --build -d
else
    docker-compose up --build
fi

# Verificar se o serviço está rodando
echo "🔍 Verificando status do serviço..."
sleep 10

if curl -f http://localhost:4000/api/status > /dev/null 2>&1; then
    echo "✅ Deploy concluído com sucesso!"
    echo "🌐 Aplicação disponível em: http://localhost:4000"
    echo "🔐 Código de acesso: RENATO-BRAVO-ONLY"
    
    if [ "$MODE" = "production" ]; then
        echo "📊 Para ver logs: docker-compose logs -f"
        echo "🛑 Para parar: docker-compose down"
    fi
else
    echo "❌ Falha no deploy. Verificando logs..."
    docker-compose logs
    exit 1
fi
