import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PhotoCompressionService {

  constructor() { }

  /**
   * Comprime uma foto base64 para reduzir o tamanho
   * @param base64String String base64 da foto
   * @param maxWidth Largura máxima (padrão: 1200px)
   * @param quality Qualidade da compressão (0.1 a 1.0, padrão: 0.8)
   * @returns Promise<string> Base64 comprimida
   */
  async compressPhoto(base64String: string, maxWidth: number = 1200, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Remove o prefixo data:image/...;base64,
        const base64Data = base64String.split(',')[1];
        
        // Cria uma imagem
        const img = new Image();
        img.onload = () => {
          try {
            // Calcula as novas dimensões mantendo a proporção
            let { width, height } = this.calculateDimensions(img.width, img.height, maxWidth);
            
            // Cria um canvas para redimensionar
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Não foi possível criar contexto do canvas'));
              return;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Desenha a imagem redimensionada
            ctx.drawImage(img, 0, 0, width, height);
            
            // Converte para base64 com compressão
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            
            console.log(`Foto comprimida: ${base64String.length} -> ${compressedBase64.length} caracteres`);
            resolve(compressedBase64);
            
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Erro ao carregar a imagem'));
        };
        
        // Carrega a imagem
        img.src = base64String;
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Calcula as novas dimensões mantendo a proporção
   */
  private calculateDimensions(originalWidth: number, originalHeight: number, maxWidth: number): { width: number, height: number } {
    if (originalWidth <= maxWidth) {
      return { width: originalWidth, height: originalHeight };
    }
    
    const ratio = maxWidth / originalWidth;
    return {
      width: maxWidth,
      height: Math.round(originalHeight * ratio)
    };
  }

  /**
   * Comprime todas as fotos de um objeto de dados
   */
  async compressAllPhotos(data: any): Promise<any> {
    const compressedData = { ...data };
    
    // Lista de campos que contêm fotos
    const photoFields = [
      'fotoKmInicial',
      'fotoCombustivel', 
      'fotoPainel',
      'motorAguaRadiadorFoto',
      'motorAguaParabrisaFoto',
      'motorFluidoFreioFoto',
      'motorNivelOleoFoto',
      'motorTampaReservatorioFoto',
      'motorTampaRadiadorFoto',
      'limpezaInternaFoto',
      'limpezaExternaFoto',
      'fotoFrontal',
      'fotoTraseira',
      'fotoLateralDireita',
      'fotoLateralEsquerda',
      'pneuDianteiraDireitaFoto',
      'pneuDianteiraEsquerdaFoto',
      'pneuTraseiraDireitaFoto',
      'pneuTraseiraEsquerdaFoto',
      'pneuEstepeFoto'
    ];

    // Comprime cada foto se existir
    for (const field of photoFields) {
      if (compressedData[field] && typeof compressedData[field] === 'string') {
        try {
          compressedData[field] = await this.compressPhoto(compressedData[field]);
        } catch (error) {
          console.warn(`Erro ao comprimir foto ${field}:`, error);
          // Mantém a foto original se houver erro na compressão
        }
      }
    }

    return compressedData;
  }
}
