import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  Upload, 
  Music, 
  Download, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FileAudio,
  Lock,
  Unlock,
  Trash2,
  Play
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

function App() {
  const [accessCode, setAccessCode] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [files, setFiles] = useState([])
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)
  const [conversionResults, setConversionResults] = useState(null)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const supportedFormats = ['WAV', 'MP3', 'FLAC', 'AAC', 'OGG', 'M4A', 'MP4', 'WEBM']
  const maxFiles = 50
  const maxFileSize = 100 * 1024 * 1024 // 100MB

  const verifyAccessCode = async () => {
    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: accessCode }),
      })

      const data = await response.json()
      
      if (data.valid) {
        setIsAuthenticated(true)
        setError('')
      } else {
        setError('Código de acesso inválido. Este conversor é exclusivo do DJ Renato Bravo.')
      }
    } catch (err) {
      setError('Erro ao verificar código de acesso')
    }
  }

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const isValidSize = file.size <= maxFileSize
      const isValidType = supportedFormats.some(format => 
        file.name.toLowerCase().endsWith(`.${format.toLowerCase()}`)
      )
      return isValidSize && isValidType
    })

    if (files.length + validFiles.length > maxFiles) {
      setError(`Máximo de ${maxFiles} arquivos permitidos`)
      return
    }

    const filesWithId = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      status: 'pending'
    }))

    setFiles(prev => [...prev, ...filesWithId])
    setError('')
  }

  const removeFile = (id) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  const clearAllFiles = () => {
    setFiles([])
    setConversionResults(null)
    setError('')
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const convertFiles = async () => {
    if (files.length === 0) {
      setError('Selecione pelo menos um arquivo para converter')
      return
    }

    setIsConverting(true)
    setConversionProgress(0)
    setError('')

    const formData = new FormData()
    files.forEach(fileObj => {
      formData.append('audioFiles', fileObj.file)
    })
    formData.append('sessionId', Math.random().toString(36).substr(2, 9))

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'X-Access-Code': accessCode,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erro na conversão')
      }

      const results = await response.json()
      setConversionResults(results)
      setConversionProgress(100)
    } catch (err) {
      setError('Erro durante a conversão: ' + err.message)
    } finally {
      setIsConverting(false)
    }
  }

  const downloadConverted = async () => {
    if (!conversionResults?.sessionId) return

    try {
      const response = await fetch(`/api/download/${conversionResults.sessionId}`, {
        headers: {
          'X-Access-Code': accessCode,
        },
      })

      if (!response.ok) {
        throw new Error('Erro no download')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `DJ_Renato_Bravo_Converted_${conversionResults.sessionId}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Erro no download: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <Lock className="h-8 w-8 text-purple-300" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                DJ Renato Bravo
              </CardTitle>
              <CardDescription className="text-purple-200">
                Conversor Exclusivo WAV → MP3
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-code" className="text-white">
                  Código de Acesso
                </Label>
                <Input
                  id="access-code"
                  type="password"
                  placeholder="Digite o código de acesso"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  onKeyPress={(e) => e.key === 'Enter' && verifyAccessCode()}
                />
              </div>
              
              {error && (
                <Alert className="bg-red-500/20 border-red-500/50">
                  <XCircle className="h-4 w-4 text-red-300" />
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={verifyAccessCode} 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!accessCode.trim()}
              >
                <Unlock className="mr-2 h-4 w-4" />
                Acessar Conversor
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-full">
              <Music className="h-8 w-8 text-purple-300" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              DJ Renato Bravo
            </h1>
          </div>
          <p className="text-purple-200 text-lg">
            Conversor Profissional de Áudio para MP3
          </p>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {supportedFormats.map(format => (
              <Badge key={format} variant="secondary" className="bg-white/10 text-white">
                {format}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Arquivos
              </CardTitle>
              <CardDescription className="text-purple-200">
                Arraste e solte até {maxFiles} arquivos de áudio ou clique para selecionar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-purple-400 bg-purple-500/20' 
                    : 'border-white/30 hover:border-purple-400 hover:bg-white/5'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileAudio className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                <p className="text-white text-lg mb-2">
                  Clique aqui ou arraste arquivos
                </p>
                <p className="text-purple-200 text-sm">
                  Máximo: {maxFiles} arquivos, {formatFileSize(maxFileSize)} cada
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".wav,.mp3,.flac,.aac,.ogg,.m4a,.mp4,.webm"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Files List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">
                      Arquivos Selecionados ({files.length})
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Total: {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFiles}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {files.map((fileObj) => (
                      <motion.div
                        key={fileObj.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileAudio className="h-4 w-4 text-purple-300 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm truncate">
                              {fileObj.name}
                            </p>
                            <p className="text-purple-200 text-xs">
                              {formatFileSize(fileObj.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileObj.id)}
                          className="text-red-300 hover:text-red-200 hover:bg-red-500/20"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Convert Button */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Button
              onClick={convertFiles}
              disabled={isConverting}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
            >
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Convertendo...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Converter para MP3
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Progress */}
        {isConverting && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white">Progresso da Conversão</span>
                    <span className="text-purple-200">{conversionProgress}%</span>
                  </div>
                  <Progress value={conversionProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {conversionResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Conversão Concluída
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-green-500/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-300">
                      {conversionResults.successful}
                    </p>
                    <p className="text-green-200 text-sm">Convertidos</p>
                  </div>
                  <div className="p-4 bg-red-500/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-300">
                      {conversionResults.failed}
                    </p>
                    <p className="text-red-200 text-sm">Falharam</p>
                  </div>
                </div>

                {conversionResults.successful > 0 && (
                  <Button
                    onClick={downloadConverted}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Baixar Arquivos MP3 ({conversionResults.successful} arquivos)
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="bg-red-500/20 border-red-500/50">
              <XCircle className="h-4 w-4 text-red-300" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default App
