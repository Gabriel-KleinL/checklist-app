import { Injectable } from '@angular/core';
import { NivelCombustivel, StatusGeral } from '../models/checklist.models';
import { Preferences } from '@capacitor/preferences';

export interface InspecaoInicialData {
  placa: string;
  local: string | undefined;
  kmInicial: number | null;
  nivelCombustivel: NivelCombustivel | undefined;
  fotoPainel: string | undefined;
  observacaoPainel: string;
  statusGeral: StatusGeral | undefined;
  // Fotos dinâmicas por campo (nome_campo -> base64)
  fotosCampos?: { [key: string]: string };
}

export interface ItemMotor {
  nome: string;
  valor: string | null;
  foto?: string;
  descricao?: string;
  tipo_resposta?: string;
  opcoes_resposta?: string[];
  tem_foto?: boolean;
  obrigatorio?: boolean;
}

export interface ItemLimpeza {
  nome: string;
  valor: string | null;
  foto?: string;
  descricao?: string;
  tipo_resposta?: string;
  opcoes_resposta?: string[];
  tem_foto?: boolean;
  obrigatorio?: boolean;
}

export interface ItemEletrico {
  nome: string;
  valor: string | null;
  foto?: string;
  descricao?: string;
  tipo_resposta?: string;
  opcoes_resposta?: string[];
  tem_foto?: boolean;
  obrigatorio?: boolean;
}

export interface ItemFerramenta {
  nome: string;
  valor: string | null;
  foto?: string;
  descricao?: string;
  tipo_resposta?: string;
  opcoes_resposta?: string[];
  tem_foto?: boolean;
  obrigatorio?: boolean;
}

export interface InspecaoVeiculoData {
  motor: ItemMotor[];
  limpeza: ItemLimpeza[];
  eletricos: ItemEletrico[];
  ferramentas: ItemFerramenta[];
}

export interface FotoVeiculoData {
  tipo: string;
  icone: string;
  foto?: string;
  fotoOriginal?: string;
}

export interface PneuData {
  nome: string;
  posicao: string;
  valor: string | null;
  foto?: string;
  pressao?: number;
  descricao?: string;
  tipo_resposta?: string;
  opcoes_resposta?: string[];
  tem_foto?: boolean;
  obrigatorio?: boolean;
}

export interface ChecklistCompleto {
  inspecaoInicial?: InspecaoInicialData;
  inspecaoVeiculo?: InspecaoVeiculoData;
  fotosVeiculo?: FotoVeiculoData[];
  pneus?: PneuData[];
  dataRealizacao?: Date;
  usuario_id?: number;
  inspecao_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistDataService {
  private checklistData: ChecklistCompleto = {};

  constructor() { }

  setInspecaoInicial(data: InspecaoInicialData) {
    this.checklistData.inspecaoInicial = data;
  }

  setInspecaoVeiculo(data: InspecaoVeiculoData) {
    this.checklistData.inspecaoVeiculo = data;
  }

  setFotosVeiculo(data: FotoVeiculoData[]) {
    this.checklistData.fotosVeiculo = data;
  }

  setPneus(data: PneuData[]) {
    this.checklistData.pneus = data;
    this.checklistData.dataRealizacao = new Date();
  }

  getChecklistCompleto(): ChecklistCompleto {
    return this.checklistData;
  }

  async limparChecklist() {
    this.checklistData = {};
    // Remove também do Capacitor Preferences
    try {
      await Preferences.remove({ key: 'inspecao_id' });
      console.log('[ChecklistData] Inspeção ID removido do storage');
    } catch (error) {
      console.error('[ChecklistData] Erro ao remover inspecao_id:', error);
    }
  }

  async setInspecaoId(id: number) {
    this.checklistData.inspecao_id = id;
    // Salva também no Capacitor Preferences para persistência
    try {
      await Preferences.set({
        key: 'inspecao_id',
        value: id.toString()
      });
      console.log('[ChecklistData] Inspeção ID salvo:', id);
    } catch (error) {
      console.error('[ChecklistData] Erro ao salvar inspecao_id:', error);
    }
  }

  async getInspecaoId(): Promise<number | undefined> {
    console.log('[ChecklistData] 🔍 Buscando inspecaoId...');
    console.log('[ChecklistData] Memória atual:', this.checklistData.inspecao_id);
    
    // Tenta recuperar da memória primeiro
    if (this.checklistData.inspecao_id) {
      console.log('[ChecklistData] ✅ Inspeção ID encontrado na memória:', this.checklistData.inspecao_id);
      return this.checklistData.inspecao_id;
    }
    
    console.log('[ChecklistData] ⚠️ Inspeção ID não encontrado na memória, buscando no storage...');
    
    // Se não estiver na memória, tenta recuperar do Capacitor Preferences
    try {
      const { value } = await Preferences.get({ key: 'inspecao_id' });
      console.log('[ChecklistData] Valor do storage:', value);
      
      if (value) {
        const inspecaoId = parseInt(value, 10);
        if (!isNaN(inspecaoId)) {
          this.checklistData.inspecao_id = inspecaoId;
          console.log('[ChecklistData] ✅ Inspeção ID recuperado do storage:', inspecaoId);
          return inspecaoId;
        } else {
          console.error('[ChecklistData] ❌ Valor do storage não é um número válido:', value);
        }
      } else {
        console.warn('[ChecklistData] ⚠️ Nenhum valor encontrado no storage para inspecao_id');
      }
    } catch (error) {
      console.error('[ChecklistData] ❌ Erro ao recuperar inspecao_id do storage:', error);
      console.error('[ChecklistData] Stack:', error instanceof Error ? error.stack : 'N/A');
    }
    
    console.warn('[ChecklistData] ❌ Inspeção ID não encontrado em nenhum lugar');
    return undefined;
  }
}
