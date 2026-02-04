/**
 * Utilitários para gerenciamento de fotos
 * Fotos são armazenadas como base64 diretamente no banco de dados
 */
class FotoUtils {
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
   * Retorna o base64 para salvar diretamente no banco
   *
   * @param {string} base64Data - String base64 da foto
   * @returns {string} O próprio base64
   */
  save(base64Data) {
    if (!this.isBase64(base64Data)) {
      throw new Error('Dados não estão em formato base64');
    }
    return base64Data;
  }

  /**
   * Retorna a foto para exibição
   *
   * @param {string} data - Base64 ou caminho relativo
   * @returns {string|null} Base64 da foto ou null
   */
  getUrl(data) {
    if (!data || data === '' || data === 'NULL') {
      return null;
    }
    return data;
  }
}

module.exports = new FotoUtils();
