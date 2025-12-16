import { Injectable } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { LoggerService } from './logger.service';
import { MESSAGES, TOAST_CONFIG } from '../config/app.constants';
import { ApiErrorResponse } from '../models/checklist.models';

export interface ErrorDisplayOptions {
  showToast?: boolean;
  showAlert?: boolean;
  toastDuration?: number;
  alertTitle?: string;
  logError?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private logger: LoggerService
  ) { }

  /**
   * Manipula erros de forma unificada
   */
  async handleError(
    error: any,
    userMessage?: string,
    options: ErrorDisplayOptions = {}
  ): Promise<void> {
    // Opções padrão
    const defaultOptions: ErrorDisplayOptions = {
      showToast: true,
      showAlert: false,
      toastDuration: TOAST_CONFIG.DURATION,
      logError: true,
      ...options
    };

    // Extrai a mensagem de erro
    const errorMessage = this.extractErrorMessage(error);
    const displayMessage = userMessage || errorMessage;

    // Log do erro
    if (defaultOptions.logError) {
      this.logger.error('Error occurred:', error);
    }

    // Exibe toast
    if (defaultOptions.showToast) {
      await this.showErrorToast(displayMessage, defaultOptions.toastDuration);
    }

    // Exibe alert
    if (defaultOptions.showAlert) {
      await this.showErrorAlert(
        displayMessage,
        defaultOptions.alertTitle || 'Erro',
        error
      );
    }
  }

  /**
   * Manipula erros de API
   */
  async handleApiError(
    error: any,
    context: string,
    options: ErrorDisplayOptions = {}
  ): Promise<void> {
    const errorResponse = this.parseApiError(error);

    this.logger.group(`API Error - ${context}`, false);
    this.logger.error('Error response:', errorResponse);
    this.logger.groupEnd();

    const userMessage = this.getUserFriendlyMessage(errorResponse, context);

    await this.handleError(error, userMessage, {
      ...options,
      logError: false // Já fizemos log acima
    });
  }

  /**
   * Manipula erros de validação
   */
  async handleValidationError(
    fields: string[],
    options: ErrorDisplayOptions = {}
  ): Promise<void> {
    const message = fields.length === 1
      ? `O campo "${fields[0]}" é obrigatório.`
      : `Os campos ${fields.join(', ')} são obrigatórios.`;

    await this.handleError(
      new Error('Validation error'),
      message,
      { ...options, logError: false }
    );
  }

  /**
   * Manipula erros de rede
   */
  async handleNetworkError(options: ErrorDisplayOptions = {}): Promise<void> {
    await this.handleError(
      new Error('Network error'),
      MESSAGES.ERROR.NETWORK,
      options
    );
  }

  /**
   * Manipula timeout
   */
  async handleTimeoutError(options: ErrorDisplayOptions = {}): Promise<void> {
    await this.handleError(
      new Error('Timeout error'),
      MESSAGES.ERROR.TIMEOUT,
      options
    );
  }

  /**
   * Exibe toast de sucesso
   */
  async showSuccess(message: string, duration?: number): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: duration || TOAST_CONFIG.DURATION,
      position: TOAST_CONFIG.POSITION,
      color: 'success',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }

  /**
   * Exibe toast de aviso
   */
  async showWarning(message: string, duration?: number): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: duration || TOAST_CONFIG.DURATION,
      position: TOAST_CONFIG.POSITION,
      color: 'warning',
      icon: 'warning-outline'
    });
    await toast.present();
  }

  /**
   * Exibe toast de informação
   */
  async showInfo(message: string, duration?: number): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: duration || TOAST_CONFIG.DURATION,
      position: TOAST_CONFIG.POSITION,
      color: 'primary',
      icon: 'information-circle-outline'
    });
    await toast.present();
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.error?.erro) {
      return error.error.erro;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.statusText) {
      return error.statusText;
    }

    return MESSAGES.ERROR.GENERIC;
  }

  private parseApiError(error: any): ApiErrorResponse {
    return {
      erro: error?.error?.erro || error?.message || 'Erro desconhecido',
      mensagem: error?.error?.mensagem,
      detalhes: error?.error?.detalhes || error?.statusText,
      codigo: error?.status
    };
  }

  private getUserFriendlyMessage(errorResponse: ApiErrorResponse, context: string): string {
    // Mensagens personalizadas baseadas no código de status
    if (errorResponse.codigo === 404) {
      return MESSAGES.ERROR.NOT_FOUND;
    }

    if (errorResponse.codigo === 401 || errorResponse.codigo === 403) {
      return MESSAGES.ERROR.UNAUTHORIZED;
    }

    if (errorResponse.codigo === 0 || !errorResponse.codigo) {
      return MESSAGES.ERROR.NETWORK;
    }

    // Usa a mensagem do backend se disponível
    if (errorResponse.mensagem) {
      return errorResponse.mensagem;
    }

    if (errorResponse.erro) {
      return errorResponse.erro;
    }

    return `Erro ao ${context}. ${MESSAGES.ERROR.GENERIC}`;
  }

  private async showErrorToast(message: string, duration?: number): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: duration || TOAST_CONFIG.DURATION,
      position: TOAST_CONFIG.POSITION,
      color: 'danger',
      icon: 'alert-circle-outline',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  private async showErrorAlert(
    message: string,
    title: string,
    error: any
  ): Promise<void> {
    const errorDetails = this.parseApiError(error);

    let alertMessage = `<p><strong>${message}</strong></p>`;

    if (errorDetails.detalhes) {
      alertMessage += `<p><small>${errorDetails.detalhes}</small></p>`;
    }

    const alert = await this.alertController.create({
      header: title,
      message: alertMessage,
      buttons: ['OK']
    });

    await alert.present();
  }
}
