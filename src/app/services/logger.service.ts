import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private currentLevel: LogLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
  private enableConsole = !environment.production;

  constructor() { }

  /**
   * Define o nível de log mínimo
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, ...data: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log('DEBUG', message, data);
    }
  }

  /**
   * Log de informação
   */
  info(message: string, ...data: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log('INFO', message, data);
    }
  }

  /**
   * Log de aviso
   */
  warn(message: string, ...data: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log('WARN', message, data);
    }
  }

  /**
   * Log de erro
   */
  error(message: string, error?: any, ...data: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log('ERROR', message, [error, ...data]);

      // Em produção, poderia enviar para serviço de monitoramento (Sentry, etc)
      if (environment.production) {
        this.sendToMonitoring(message, error);
      }
    }
  }

  /**
   * Log de grupo (para organizar logs relacionados)
   */
  group(title: string, collapsed: boolean = false): void {
    if (this.enableConsole) {
      if (collapsed) {
        console.groupCollapsed(`[${this.getTimestamp()}] ${title}`);
      } else {
        console.group(`[${this.getTimestamp()}] ${title}`);
      }
    }
  }

  /**
   * Fecha grupo de logs
   */
  groupEnd(): void {
    if (this.enableConsole) {
      console.groupEnd();
    }
  }

  /**
   * Log com tabela (útil para arrays e objetos)
   */
  table(data: any, columns?: string[]): void {
    if (this.enableConsole && this.shouldLog(LogLevel.DEBUG)) {
      console.table(data, columns);
    }
  }

  /**
   * Medidor de performance
   */
  time(label: string): void {
    if (this.enableConsole && this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  /**
   * Finaliza medidor de performance
   */
  timeEnd(label: string): void {
    if (this.enableConsole && this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }

  /**
   * Log de API request
   */
  apiRequest(method: string, url: string, data?: any): void {
    this.group(`API ${method} → ${url}`, true);
    this.debug('Request data:', data);
    this.groupEnd();
  }

  /**
   * Log de API response
   */
  apiResponse(method: string, url: string, response: any, duration?: number): void {
    this.group(`API ${method} ← ${url}${duration ? ` (${duration}ms)` : ''}`, true);
    this.debug('Response:', response);
    this.groupEnd();
  }

  /**
   * Log de API error
   */
  apiError(method: string, url: string, error: any): void {
    this.group(`API ${method} ✗ ${url}`, false);
    this.error('Error:', error);
    this.groupEnd();
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private log(level: string, message: string, data: any[]): void {
    if (!this.enableConsole) {
      return;
    }

    const timestamp = this.getTimestamp();
    const prefix = `[${timestamp}] [${level}]`;
    const style = this.getStyle(level);

    if (data && data.length > 0) {
      console.log(`%c${prefix}%c ${message}`, style, '', ...data);
    } else {
      console.log(`%c${prefix}%c ${message}`, style, '');
    }
  }

  private getTimestamp(): string {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
  }

  private getStyle(level: string): string {
    const styles: { [key: string]: string } = {
      DEBUG: 'color: #888; font-weight: normal;',
      INFO: 'color: #0066ff; font-weight: bold;',
      WARN: 'color: #ff9900; font-weight: bold;',
      ERROR: 'color: #ff0000; font-weight: bold;',
    };
    return styles[level] || '';
  }

  private sendToMonitoring(message: string, error: any): void {
    // Implementar integração com serviço de monitoramento
    // Exemplo: Sentry, LogRocket, etc.
    // Sentry.captureException(error, { tags: { message } });
  }
}
