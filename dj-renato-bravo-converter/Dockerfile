# Dockerfile para DJ Renato Bravo Conversor
FROM node:18-alpine

# Instalar FFmpeg para conversão de áudio
RUN apk add --no-cache ffmpeg

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos do projeto
COPY backend ./backend
COPY frontend ./frontend

# Instalar dependências e build do frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Voltar para o backend e instalar dependências
WORKDIR /app/backend
RUN npm install

# Criar diretórios necessários
RUN mkdir -p tmp/uploads tmp/output

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=4000
ENV ACCESS_CODE=RENATO-BRAVO-ONLY

# Expor porta
EXPOSE 4000

# Comando para iniciar a aplicação
CMD ["node", "index.js"]
