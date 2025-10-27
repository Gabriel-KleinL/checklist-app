import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  // Chaves para armazenamento
  private readonly INSPECAO_INICIAL_KEY = 'checklist_inspecao_inicial';
  private readonly INSPECAO_VEICULO_KEY = 'checklist_inspecao_veiculo';
  private readonly FOTOS_VEICULO_KEY = 'checklist_fotos_veiculo';
  private readonly PNEUS_KEY = 'checklist_pneus';

  constructor() { }

  // Salvar inspeção inicial
  async salvarInspecaoInicial(dados: any): Promise<void> {
    try {
      await Preferences.set({
        key: this.INSPECAO_INICIAL_KEY,
        value: JSON.stringify(dados)
      });
      console.log('Inspeção inicial salva localmente');
    } catch (error) {
      console.error('Erro ao salvar inspeção inicial:', error);
    }
  }

  // Recuperar inspeção inicial
  async recuperarInspecaoInicial(): Promise<any | null> {
    try {
      const { value } = await Preferences.get({ key: this.INSPECAO_INICIAL_KEY });
      if (value) {
        console.log('Inspeção inicial recuperada');
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('Erro ao recuperar inspeção inicial:', error);
      return null;
    }
  }

  // Salvar inspeção do veículo
  async salvarInspecaoVeiculo(dados: any): Promise<void> {
    try {
      await Preferences.set({
        key: this.INSPECAO_VEICULO_KEY,
        value: JSON.stringify(dados)
      });
      console.log('Inspeção do veículo salva localmente');
    } catch (error) {
      console.error('Erro ao salvar inspeção do veículo:', error);
    }
  }

  // Recuperar inspeção do veículo
  async recuperarInspecaoVeiculo(): Promise<any | null> {
    try {
      const { value } = await Preferences.get({ key: this.INSPECAO_VEICULO_KEY });
      if (value) {
        console.log('Inspeção do veículo recuperada');
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('Erro ao recuperar inspeção do veículo:', error);
      return null;
    }
  }

  // Salvar fotos do veículo
  async salvarFotosVeiculo(dados: any): Promise<void> {
    try {
      await Preferences.set({
        key: this.FOTOS_VEICULO_KEY,
        value: JSON.stringify(dados)
      });
      console.log('Fotos do veículo salvas localmente');
    } catch (error) {
      console.error('Erro ao salvar fotos do veículo:', error);
    }
  }

  // Recuperar fotos do veículo
  async recuperarFotosVeiculo(): Promise<any | null> {
    try {
      const { value } = await Preferences.get({ key: this.FOTOS_VEICULO_KEY });
      if (value) {
        console.log('Fotos do veículo recuperadas');
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('Erro ao recuperar fotos do veículo:', error);
      return null;
    }
  }

  // Salvar pneus
  async salvarPneus(dados: any): Promise<void> {
    try {
      await Preferences.set({
        key: this.PNEUS_KEY,
        value: JSON.stringify(dados)
      });
      console.log('Pneus salvos localmente');
    } catch (error) {
      console.error('Erro ao salvar pneus:', error);
    }
  }

  // Recuperar pneus
  async recuperarPneus(): Promise<any | null> {
    try {
      const { value } = await Preferences.get({ key: this.PNEUS_KEY });
      if (value) {
        console.log('Pneus recuperados');
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('Erro ao recuperar pneus:', error);
      return null;
    }
  }

  // Limpar todos os dados salvos (após finalizar com sucesso)
  async limparTodosDados(): Promise<void> {
    try {
      await Preferences.remove({ key: this.INSPECAO_INICIAL_KEY });
      await Preferences.remove({ key: this.INSPECAO_VEICULO_KEY });
      await Preferences.remove({ key: this.FOTOS_VEICULO_KEY });
      await Preferences.remove({ key: this.PNEUS_KEY });
      console.log('Todos os dados locais foram limpos');
    } catch (error) {
      console.error('Erro ao limpar dados locais:', error);
    }
  }

  // Verificar se existem dados salvos
  async temDadosSalvos(): Promise<boolean> {
    try {
      const inspecaoInicial = await this.recuperarInspecaoInicial();
      return inspecaoInicial !== null;
    } catch (error) {
      return false;
    }
  }
}
