const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Utilitários para gerenciamento de fotos
 * Compatível com o FotoUtils.php
 */
class FotoUtils {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../api/uploads');
    this.fotosDir = path.join(this.uploadDir, 'fotos');
  }

  /**
   * Detecta se a string é base64
   */
  isBase64(data) {
    if (typeof data !== 'string') return false;

    // Verifica se tem o prefixo data:image
    if (data.startsWith('data:image/')) {
      return true;
    }

    // Verifica se parece base64 puro (sem prefixo)
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return base64Regex.test(data) && data.length % 4 === 0 && data.length > 100;
  }

  /**
   * Extrai o MIME type de uma string base64
   */
  getMimeTypeFromBase64(base64Data) {
    const match = base64Data.match(/^data:([^;]+);base64,/);
    if (match) {
      return match[1];
    }
    return 'image/jpeg'; // padrão
  }

  /**
   * Extrai extensão do MIME type
   */
  getExtensionFromMime(mimeType) {
    const mimeMap = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    };
    return mimeMap[mimeType] || 'jpg';
  }

  /**
   * Remove o prefixo data:image da string base64
   */
  removeBase64Prefix(base64Data) {
    if (base64Data.includes('base64,')) {
      return base64Data.split('base64,')[1];
    }
    return base64Data;
  }

  /**
   * Salva foto base64 como arquivo
   *
   * @param {string} base64Data - String base64 da foto
   * @param {number} inspecaoId - ID da inspeção
   * @param {string} tipo - Tipo da foto (veiculo, item, etc)
   * @returns {string} Caminho relativo do arquivo salvo
   */
  save(base64Data, inspecaoId, tipo) {
    if (!this.isBase64(base64Data)) {
      throw new Error('Dados não estão em formato base64');
    }

    // Detecta MIME type e extrai base64 puro
    const mimeType = this.getMimeTypeFromBase64(base64Data);
    const extension = this.getExtensionFromMime(mimeType);
    const base64Pure = this.removeBase64Prefix(base64Data);

    // Cria estrutura de diretórios por data
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const targetDir = path.join(this.fotosDir, String(year), month);

    // Cria diretórios se não existirem
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Gera nome único do arquivo
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const filename = `${inspecaoId}_${tipo}_${uniqueId}.${extension}`;
    const fullPath = path.join(targetDir, filename);

    // Converte base64 para buffer e salva
    const buffer = Buffer.from(base64Pure, 'base64');
    fs.writeFileSync(fullPath, buffer);

    // Retorna caminho relativo
    const relativePath = `fotos/${year}/${month}/${filename}`;
    return relativePath;
  }

  /**
   * Converte caminho relativo em URL
   *
   * @param {string} relativePath - Caminho relativo (ex: fotos/2026/01/123_veiculo_abc.jpg)
   * @returns {string} URL completa
   */
  getUrl(relativePath) {
    if (!relativePath || relativePath === '' || relativePath === 'NULL') {
      return null;
    }

    // Se já for base64, retorna como está (compatibilidade com dados legados)
    if (this.isBase64(relativePath)) {
      return relativePath;
    }

    // Se já for URL completa, retorna
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }

    // Constrói URL baseada no ambiente
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}/uploads/${relativePath}`;
  }

  /**
   * Deleta arquivo de foto
   *
   * @param {string} relativePath - Caminho relativo do arquivo
   * @returns {boolean} Sucesso da operação
   */
  delete(relativePath) {
    if (!relativePath || this.isBase64(relativePath)) {
      return false;
    }

    const fullPath = path.join(this.uploadDir, relativePath);

    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        return true;
      } catch (error) {
        console.error(`Erro ao deletar foto: ${error.message}`);
        return false;
      }
    }

    return false;
  }

  /**
   * Obtém caminho absoluto do arquivo
   *
   * @param {string} relativePath - Caminho relativo
   * @returns {string} Caminho absoluto
   */
  getFilePath(relativePath) {
    return path.join(this.uploadDir, relativePath);
  }
}

module.exports = new FotoUtils();
