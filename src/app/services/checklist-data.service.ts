import { Injectable } from '@angular/core';
import { NivelCombustivel } from '../models/checklist.models';

export interface InspecaoInicialData {
  placa: string;
  local: string | undefined;
  kmInicial: number | null;
  nivelCombustivel: NivelCombustivel | undefined;
  fotoPainel: string | undefined;
  observacaoPainel: string;
}

export interface ItemMotor {
  nome: string;
  valor: 'bom' | 'ruim' | null;
  foto?: string;
  descricao?: string;
}

export interface ItemLimpeza {
  nome: string;
  valor: 'pessima' | 'ruim' | 'satisfatoria' | 'otimo' | null;
  foto?: string;
  descricao?: string;
}

export interface ItemEletrico {
  nome: string;
  valor: 'bom' | 'ruim' | null;
  foto?: string;
  descricao?: string;
}

export interface ItemFerramenta {
  nome: string;
  valor: 'contem' | 'nao_contem' | null;
  foto?: string;
  descricao?: string;
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
  valor: 'bom' | 'ruim' | null;
  foto?: string;
  pressao?: number;
  descricao?: string;
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

  limparChecklist() {
    this.checklistData = {};
  }

  setInspecaoId(id: number) {
    this.checklistData.inspecao_id = id;
  }

  getInspecaoId(): number | undefined {
    return this.checklistData.inspecao_id;
  }
}
