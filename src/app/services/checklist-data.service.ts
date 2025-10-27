import { Injectable } from '@angular/core';

export interface InspecaoInicialData {
  placa: string;
  kmInicial: number | null;
  fotoKmInicial: string | undefined;
  nivelCombustivel: string;
  fotoCombustivel: string | undefined;
  fotoPainel: string | undefined;
}

export interface ItemMotor {
  nome: string;
  valor: 'bom' | 'ruim' | null;
  foto?: string;
}

export interface ItemLimpeza {
  nome: string;
  valor: 'pessima' | 'ruim' | 'satisfatoria' | 'otimo' | null;
  foto?: string;
}

export interface InspecaoVeiculoData {
  motor: ItemMotor[];
  limpeza: ItemLimpeza[];
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
}

export interface ChecklistCompleto {
  inspecaoInicial?: InspecaoInicialData;
  inspecaoVeiculo?: InspecaoVeiculoData;
  fotosVeiculo?: FotoVeiculoData[];
  pneus?: PneuData[];
  dataRealizacao?: Date;
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
}
