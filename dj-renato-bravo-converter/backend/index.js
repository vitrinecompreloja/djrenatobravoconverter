const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const archiver = require('archiver');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const ACCESS_CODE = process.env.ACCESS_CODE || 'RENATO-BRAVO-ONLY';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Configuração de diretórios
const tmpDir = path.join(__dirname, 'tmp');
const uploadsDir = path.join(tmpDir, 'uploads');
const outputDir = path.join(tmpDir, 'output');

// Criar diretórios se não existirem
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(outputDir);

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sessionId = req.body.sessionId || uuidv4();
    const sessionDir = path.join(uploadsDir, sessionId);
    fs.ensureDirSync(sessionDir);
    cb(null, sessionDir);
  },
  filename: (req, file, cb) => {
    // Manter nome original do arquivo
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB por arquivo
    files: 50 // Máximo 50 arquivos
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas arquivos de áudio
    const allowedMimes = [
      'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/mpeg', 'audio/mp3',
      'audio/flac', 'audio/x-flac',
      'audio/aac', 'audio/x-aac',
      'audio/ogg', 'audio/vorbis',
      'audio/webm', 'audio/x-m4a',
      'audio/mp4', 'audio/x-mp4'
    ];
    
    const allowedExts = ['.wav', '.mp3', '.flac', '.aac', '.ogg', '.m4a', '.mp4', '.webm'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use WAV, MP3, FLAC, AAC, OGG, M4A, MP4 ou WEBM.'));
    }
  }
});

// Middleware de autenticação
const authenticateCode = (req, res, next) => {
  const code = req.headers['x-access-code'] || req.body.accessCode || req.query.code;
  
  if (code !== ACCESS_CODE) {
    return res.status(401).json({ 
      error: 'Código de acesso inválido',
      message: 'Este conversor é exclusivo do DJ Renato Bravo' 
    });
  }
  
  next();
};

// Rota principal - servir frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Rota de verificação de código
app.post('/api/verify-code', (req, res) => {
  const { code } = req.body;
  
  if (code === ACCESS_CODE) {
    res.json({ valid: true, message: 'Acesso autorizado para DJ Renato Bravo' });
  } else {
    res.status(401).json({ valid: false, message: 'Código de acesso inválido' });
  }
});

// Rota de upload e conversão
app.post('/api/convert', authenticateCode, upload.array('audioFiles', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const sessionId = req.body.sessionId || uuidv4();
    const sessionOutputDir = path.join(outputDir, sessionId);
    fs.ensureDirSync(sessionOutputDir);

    const conversionPromises = req.files.map((file, index) => {
      return new Promise((resolve, reject) => {
        const inputPath = file.path;
        const outputFilename = path.basename(file.originalname, path.extname(file.originalname)) + '.mp3';
        const outputPath = path.join(sessionOutputDir, outputFilename);

        ffmpeg(inputPath)
          .toFormat('mp3')
          .audioBitrate(320) // Alta qualidade
          .audioChannels(2)  // Estéreo
          .audioFrequency(44100) // 44.1kHz
          .on('start', (commandLine) => {
            console.log(`Convertendo ${file.originalname}...`);
          })
          .on('progress', (progress) => {
            console.log(`${file.originalname}: ${Math.round(progress.percent || 0)}%`);
          })
          .on('end', () => {
            console.log(`✓ ${file.originalname} convertido com sucesso`);
            resolve({
              original: file.originalname,
              converted: outputFilename,
              status: 'success'
            });
          })
          .on('error', (err) => {
            console.error(`✗ Erro ao converter ${file.originalname}:`, err.message);
            reject({
              original: file.originalname,
              error: err.message,
              status: 'error'
            });
          })
          .save(outputPath);
      });
    });

    // Aguardar todas as conversões
    const results = await Promise.allSettled(conversionPromises);
    
    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
    
    const failed = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason);

    // Criar ZIP com arquivos convertidos
    const zipPath = path.join(sessionOutputDir, `converted_${sessionId}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    // Adicionar arquivos MP3 ao ZIP
    successful.forEach(result => {
      const filePath = path.join(sessionOutputDir, result.converted);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: result.converted });
      }
    });

    await archive.finalize();

    // Limpar arquivos de upload após conversão
    setTimeout(() => {
      fs.remove(path.join(uploadsDir, sessionId)).catch(console.error);
    }, 5000);

    res.json({
      sessionId,
      successful: successful.length,
      failed: failed.length,
      results: successful,
      errors: failed,
      downloadUrl: `/api/download/${sessionId}`
    });

  } catch (error) {
    console.error('Erro na conversão:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Rota de download do ZIP
app.get('/api/download/:sessionId', authenticateCode, (req, res) => {
  const { sessionId } = req.params;
  const zipPath = path.join(outputDir, sessionId, `converted_${sessionId}.zip`);

  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }

  res.download(zipPath, `DJ_Renato_Bravo_Converted_${sessionId}.zip`, (err) => {
    if (err) {
      console.error('Erro no download:', err);
    } else {
      // Limpar arquivos após download
      setTimeout(() => {
        fs.remove(path.join(outputDir, sessionId)).catch(console.error);
      }, 60000); // 1 minuto
    }
  });
});

// Rota de status do servidor
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Conversor DJ Renato Bravo funcionando',
    timestamp: new Date().toISOString(),
    maxFiles: 50,
    maxFileSize: '100MB',
    supportedFormats: ['WAV', 'MP3', 'FLAC', 'AAC', 'OGG', 'M4A', 'MP4', 'WEBM']
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'Arquivo muito grande',
        message: 'Tamanho máximo: 100MB por arquivo' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Muitos arquivos',
        message: 'Máximo: 50 arquivos por vez' 
      });
    }
  }
  
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: error.message 
  });
});

// Limpeza periódica de arquivos temporários
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas

  [uploadsDir, outputDir].forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.readdir(dir, (err, files) => {
        if (err) return;
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          fs.stat(filePath, (err, stats) => {
            if (err) return;
            
            if (now - stats.mtime.getTime() > maxAge) {
              fs.remove(filePath).catch(console.error);
            }
          });
        });
      });
    }
  });
}, 60 * 60 * 1000); // Executar a cada hora

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🎵 Conversor DJ Renato Bravo rodando na porta ${PORT}`);
  console.log(`🔐 Código de acesso: ${ACCESS_CODE}`);
  console.log(`📁 Diretório temporário: ${tmpDir}`);
});

module.exports = app;
