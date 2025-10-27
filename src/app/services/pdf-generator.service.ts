import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { ChecklistCompleto } from './checklist-data.service';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor(private platform: Platform) { }

  async gerarRelatorioPDF(checklist: ChecklistCompleto): Promise<string | null> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const maxWidth = 170;

    // Função auxiliar para adicionar nova página se necessário
    const checkNewPage = (neededSpace: number = 20) => {
      if (yPosition + neededSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Função para adicionar imagem
    const addImage = async (imageData: string | undefined, label: string) => {
      if (!imageData) return;

      checkNewPage(80);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin, yPosition);
      yPosition += 5;

      try {
        // Redimensiona a imagem para caber na página
        const imgWidth = 80;
        const imgHeight = 60;
        pdf.addImage(imageData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.error('Erro ao adicionar imagem:', error);
        pdf.setFontSize(9);
        pdf.text('(Erro ao carregar imagem)', margin, yPosition);
        yPosition += 10;
      }
    };

    // CABEÇALHO
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 0, 0);
    pdf.text('RELATÓRIO DE INSPEÇÃO VEICULAR', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    if (checklist.dataRealizacao) {
      pdf.text(`Data: ${new Date(checklist.dataRealizacao).toLocaleString('pt-BR')}`, margin, yPosition);
    }
    yPosition += 15;

    // SEÇÃO 1: INSPEÇÃO INICIAL
    if (checklist.inspecaoInicial) {
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 0, 0);
      pdf.text('1. INSPEÇÃO INICIAL', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');

      const inicial = checklist.inspecaoInicial;
      pdf.text(`Placa: ${inicial.placa}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`KM Inicial: ${inicial.kmInicial}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Nível de Combustível: ${inicial.nivelCombustivel}`, margin, yPosition);
      yPosition += 10;

      await addImage(inicial.fotoKmInicial, 'Foto do KM Inicial:');
      await addImage(inicial.fotoCombustivel, 'Foto do Combustível:');
      await addImage(inicial.fotoPainel, 'Foto do Painel:');
    }

    // SEÇÃO 2: INSPEÇÃO DO VEÍCULO
    if (checklist.inspecaoVeiculo) {
      checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 0, 0);
      pdf.text('2. INSPEÇÃO DO VEÍCULO', margin, yPosition);
      yPosition += 8;

      // Motor
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Motor:', margin, yPosition);
      yPosition += 6;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      for (const item of checklist.inspecaoVeiculo.motor) {
        checkNewPage(10);
        const status = item.valor === 'bom' ? '✓ BOM' : '✗ RUIM';
        pdf.text(`• ${item.nome}: ${status}`, margin + 5, yPosition);
        yPosition += 6;

        if (item.foto) {
          await addImage(item.foto, `  Foto - ${item.nome}:`);
        }
      }

      yPosition += 5;

      // Limpeza
      checkNewPage(20);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Limpeza:', margin, yPosition);
      yPosition += 6;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      for (const item of checklist.inspecaoVeiculo.limpeza) {
        checkNewPage(10);
        const statusMap: any = {
          'otimo': 'ÓTIMO',
          'satisfatoria': 'SATISFATÓRIA',
          'ruim': 'RUIM',
          'pessima': 'PÉSSIMA'
        };
        const status = statusMap[item.valor || ''] || item.valor;
        pdf.text(`• ${item.nome}: ${status}`, margin + 5, yPosition);
        yPosition += 6;

        if (item.foto) {
          await addImage(item.foto, `  Foto - ${item.nome}:`);
        }
      }
    }

    // SEÇÃO 3: FOTOS DO VEÍCULO
    if (checklist.fotosVeiculo && checklist.fotosVeiculo.length > 0) {
      checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 0, 0);
      pdf.text('3. FOTOS DO VEÍCULO', margin, yPosition);
      yPosition += 8;

      for (const foto of checklist.fotosVeiculo) {
        if (foto.foto) {
          await addImage(foto.foto, foto.tipo + ':');
        }
      }
    }

    // SEÇÃO 4: PNEUS
    if (checklist.pneus && checklist.pneus.length > 0) {
      checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 0, 0);
      pdf.text('4. INSPEÇÃO DE PNEUS', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      for (const pneu of checklist.pneus) {
        checkNewPage(15);
        const status = pneu.valor === 'bom' ? '✓ BOM' : '✗ RUIM';
        pdf.text(`• ${pneu.nome}: ${status}`, margin, yPosition);
        yPosition += 6;

        if (pneu.foto) {
          await addImage(pneu.foto, `  Foto - ${pneu.nome}:`);
        }
      }
    }

    // Salvar o PDF
    const nomeArquivo = `Inspecao_Veicular_${checklist.inspecaoInicial?.placa || 'SEM_PLACA'}_${new Date().getTime()}.pdf`;

    // Verifica se está em dispositivo móvel (Android/iOS)
    if (this.platform.is('capacitor')) {
      try {
        // Converte o PDF para base64
        const pdfBase64 = pdf.output('datauristring').split(',')[1];

        // Salva o arquivo no filesystem
        const savedFile = await Filesystem.writeFile({
          path: nomeArquivo,
          data: pdfBase64,
          directory: Directory.Cache
        });

        console.log('PDF salvo em:', savedFile.uri);
        return savedFile.uri;
      } catch (error) {
        console.error('Erro ao salvar PDF:', error);
        return null;
      }
    } else {
      // Para navegador web, faz download normal
      pdf.save(nomeArquivo);
      return null;
    }
  }

  async compartilharPDF(fileUri: string, nomeArquivo: string): Promise<void> {
    try {
      await Share.share({
        title: 'Compartilhar Relatório de Inspeção',
        text: 'Relatório de Inspeção Veicular',
        url: fileUri,
        dialogTitle: 'Compartilhar PDF'
      });
    } catch (error) {
      console.error('Erro ao compartilhar PDF:', error);
      throw error;
    }
  }
}
