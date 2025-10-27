import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { AlertController, LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private loading: HTMLIonLoadingElement | null = null;

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  /**
   * Tira uma foto com configurações otimizadas para performance
   * @param showLoading Mostrar indicador de carregamento
   * @returns Data URL da foto ou null se cancelado/erro
   */
  async tirarFoto(showLoading: boolean = true): Promise<string | null> {
    try {
      // Mostra loading
      if (showLoading) {
        this.loading = await this.loadingController.create({
          message: 'Abrindo câmera...',
          spinner: 'crescent'
        });
        await this.loading.present();
      }

      // Configurações otimizadas para evitar travamentos
      const image = await Camera.getPhoto({
        quality: 60, // Reduzido de 90 para 60 para melhor performance
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1280, // Limita a largura máxima
        height: 1280, // Limita a altura máxima
        correctOrientation: true, // Corrige orientação automaticamente
        saveToGallery: false, // Não salva na galeria automaticamente
        presentationStyle: 'fullscreen', // Modo fullscreen para melhor UX
        promptLabelHeader: 'Tirar Foto',
        promptLabelCancel: 'Cancelar',
        promptLabelPhoto: 'Galeria',
        promptLabelPicture: 'Câmera'
      });

      // Fecha loading
      if (this.loading) {
        await this.loading.dismiss();
        this.loading = null;
      }

      return image.dataUrl || null;

    } catch (error: any) {
      // Fecha loading se estiver aberto
      if (this.loading) {
        await this.loading.dismiss();
        this.loading = null;
      }

      // Se o usuário cancelou, não mostra erro
      if (error?.message?.includes('cancelled') || error?.message?.includes('User cancelled')) {
        console.log('Foto cancelada pelo usuário');
        return null;
      }

      // Mostra erro detalhado
      console.error('Erro ao tirar foto:', error);
      await this.mostrarErro(error);
      return null;
    }
  }

  /**
   * Permite escolher entre câmera ou galeria
   * @returns Data URL da foto ou null se cancelado/erro
   */
  async escolherFoto(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Permite escolher entre câmera e galeria
        width: 1280,
        height: 1280,
        correctOrientation: true,
        saveToGallery: false,
        presentationStyle: 'fullscreen',
        promptLabelHeader: 'Selecionar Foto',
        promptLabelCancel: 'Cancelar',
        promptLabelPhoto: 'Galeria',
        promptLabelPicture: 'Câmera'
      });

      return image.dataUrl || null;

    } catch (error: any) {
      // Se o usuário cancelou, não mostra erro
      if (error?.message?.includes('cancelled') || error?.message?.includes('User cancelled')) {
        console.log('Seleção cancelada pelo usuário');
        return null;
      }

      console.error('Erro ao selecionar foto:', error);
      await this.mostrarErro(error);
      return null;
    }
  }

  /**
   * Mostra alerta de erro amigável
   */
  private async mostrarErro(error: any) {
    const mensagem = error?.message || 'Erro desconhecido ao acessar a câmera';

    const alert = await this.alertController.create({
      header: 'Erro na Câmera',
      message: `
        <p>${mensagem}</p>
        <br>
        <small>Dica: Verifique se o aplicativo tem permissão para acessar a câmera.</small>
      `,
      buttons: ['OK']
    });

    await alert.present();
  }

  /**
   * Verifica se tem permissões de câmera
   */
  async verificarPermissoes(): Promise<boolean> {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }

  /**
   * Solicita permissões de câmera
   */
  async solicitarPermissoes(): Promise<boolean> {
    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
  }
}
