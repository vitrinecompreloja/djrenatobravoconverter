# DJ Renato Bravo - Conversor WAV→MP3

**Conversor Profissional de Áudio Exclusivo**

Um sistema completo de conversão de arquivos de áudio para MP3 com interface web moderna, desenvolvido especificamente para o DJ Renato Bravo. Suporta conversão em massa de até 50 arquivos simultaneamente com alta qualidade de áudio.

## 🎵 Características Principais

### **Formatos Suportados**
- **WAV** - Formato de áudio sem compressão
- **MP3** - MPEG Audio Layer III
- **FLAC** - Free Lossless Audio Codec
- **AAC** - Advanced Audio Coding
- **OGG** - Ogg Vorbis
- **M4A** - MPEG-4 Audio
- **MP4** - MPEG-4 Video (áudio)
- **WEBM** - WebM Audio

### **Especificações Técnicas**
- **Conversão em Massa**: Até 50 arquivos por sessão
- **Tamanho Máximo**: 100MB por arquivo
- **Qualidade de Saída**: MP3 320kbps, Estéreo, 44.1kHz
- **Interface**: React com Tailwind CSS e animações Framer Motion
- **Backend**: Node.js com Express e FFmpeg
- **Containerização**: Docker e Docker Compose

## 🚀 Instalação e Uso

### **Pré-requisitos**
- Docker 20.10+
- Docker Compose 2.0+
- 2GB de RAM disponível
- 5GB de espaço em disco

### **Instalação Rápida**

```bash
# 1. Clone ou extraia o projeto
cd dj-renato-bravo-converter

# 2. Execute o script de deploy
./deploy.sh production

# 3. Acesse a aplicação
# URL: http://localhost:4000
# Código: RENATO-BRAVO-ONLY
```

### **Instalação Manual**

```bash
# 1. Build e inicialização
docker-compose up --build -d

# 2. Verificar status
docker-compose logs -f

# 3. Testar funcionamento
curl http://localhost:4000/api/status
```

## 📖 Como Usar

### **1. Acesso ao Sistema**
1. Abra http://localhost:4000 no navegador
2. Digite o código de acesso: `RENATO-BRAVO-ONLY`
3. Clique em "Acessar Conversor"

### **2. Upload de Arquivos**
- **Método 1**: Arraste e solte arquivos na área de upload
- **Método 2**: Clique na área de upload e selecione arquivos
- **Limite**: Até 50 arquivos, 100MB cada

### **3. Conversão**
1. Verifique os arquivos listados
2. Clique em "Converter para MP3"
3. Aguarde o progresso da conversão
4. Baixe o arquivo ZIP com os MP3 convertidos

## 🏗️ Arquitetura do Sistema

### **Estrutura do Projeto**
```
dj-renato-bravo-converter/
├── backend/                 # Servidor Node.js
│   ├── index.js            # Aplicação principal
│   ├── package.json        # Dependências backend
│   └── tmp/                # Arquivos temporários
├── frontend/               # Interface React
│   ├── src/
│   │   ├── App.jsx         # Componente principal
│   │   ├── App.css         # Estilos customizados
│   │   └── components/     # Componentes UI
│   ├── dist/               # Build de produção
│   └── package.json        # Dependências frontend
├── Dockerfile              # Imagem Docker
├── docker-compose.yml      # Orquestração
├── deploy.sh              # Script de deploy
└── README.md              # Esta documentação
```

## 🔒 Segurança

### **Medidas Implementadas**
- **Autenticação por Código**: Acesso restrito
- **Validação de Arquivos**: Apenas formatos de áudio
- **Limite de Tamanho**: Proteção contra sobrecarga
- **Limpeza Automática**: Remoção de dados temporários
- **Isolamento Docker**: Ambiente seguro e isolado

## 🚨 Solução de Problemas

### **Comandos Úteis**

```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Parar serviços
docker-compose down

# Limpar dados
docker-compose down -v
docker system prune -f
```

---

**© 2024 DJ Renato Bravo - Conversor Exclusivo WAV→MP3**
