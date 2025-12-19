# 📸 Fotos do Veículo - 4 Ângulos Obrigatórios

[← Voltar ao Índice](./index.md)

---

## 📖 Descrição

A tela de Fotos do Veículo é a terceira etapa do checklist simples. Aqui o inspetor captura fotos do veículo em 4 ângulos obrigatórios e pode anotar defeitos usando ferramentas de desenho.

**Rota:** `/fotos-veiculo`

**Arquivo:** `/home/user/checklist-app/src/app/fotos-veiculo/fotos-veiculo.page.ts`

**Posição no Fluxo:** Etapa 3 de 4

---

## 🎯 Objetivo

Documentar visualmente o estado geral do veículo através de fotos padronizadas dos 4 ângulos principais, com possibilidade de marcação de defeitos.

---

## 📋 Fotos Obrigatórias

### 1. Foto Frontal 🔴 📸
- **Ângulo:** Frente do veículo
- **Visão:** Para-choque, faróis, capô, para-brisa
- **Obrigatória:** Sim

### 2. Foto Traseira 🔴 📸
- **Ângulo:** Traseira do veículo
- **Visão:** Para-choque traseiro, lanternas, porta-malas, placa
- **Obrigatória:** Sim

### 3. Foto Lateral Direita 🔴 📸
- **Ângulo:** Lado direito do veículo
- **Visão:** Portas, rodas, lataria lateral direita
- **Obrigatória:** Sim

### 4. Foto Lateral Esquerda 🔴 📸
- **Ângulo:** Lado esquerdo do veículo
- **Visão:** Portas, rodas, lataria lateral esquerda
- **Obrigatória:** Sim

---

## 🎨 Interface

### Layout Principal
```
┌─────────────────────────────────┐
│  [Voltar]   FOTOS DO VEÍCULO    │
├─────────────────────────────────┤
│                                 │
│  Capture fotos dos 4 ângulos    │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Foto Frontal *           │ │
│  │  [   📷 TIRAR FOTO   ]    │ │
│  │  [Miniatura da foto]      │ │
│  │  [ 🖊️ Marcar Defeitos ]   │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Foto Traseira *          │ │
│  │  [   📷 TIRAR FOTO   ]    │ │
│  │  [Miniatura da foto]      │ │
│  │  [ 🖊️ Marcar Defeitos ]   │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Foto Lateral Direita *   │ │
│  │  [   📷 TIRAR FOTO   ]    │ │
│  │  [Miniatura da foto]      │ │
│  │  [ 🖊️ Marcar Defeitos ]   │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Foto Lateral Esquerda *  │ │
│  │  [   📷 TIRAR FOTO   ]    │ │
│  │  [Miniatura da foto]      │ │
│  │  [ 🖊️ Marcar Defeitos ]   │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │      PRÓXIMO PASSO        │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

### Modal de Marcação
```
┌─────────────────────────────────┐
│  [Voltar]   MARCAR DEFEITOS     │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │    [Foto com Canvas]    │   │
│  │     para desenhar       │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  Ferramentas:                   │
│  🔴 🟢 🔵 🟡 (cores)            │
│  ─ ── ─── (espessuras)         │
│  [ Limpar ] [ Salvar ]          │
│                                 │
└─────────────────────────────────┘
```

---

## ⚙️ Funcionalidades

### 1. Captura de Foto
```typescript
fotos = {
  frontal: null,
  traseira: null,
  lateral_direita: null,
  lateral_esquerda: null
};

async tirarFoto(tipo: 'frontal' | 'traseira' | 'lateral_direita' | 'lateral_esquerda') {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    });

    const fotoBase64 = `data:image/jpeg;base64,${image.base64String}`;

    // Comprimir
    this.fotos[tipo] = await this.photoCompression.compress(
      fotoBase64,
      0.45, // 45% qualidade
      1200  // max 1200px width
    );

    // Salvar localmente
    this.salvarLocalmente();

  } catch (erro) {
    console.error(`Erro ao capturar foto ${tipo}`, erro);
  }
}
```

---

### 2. Ferramentas de Marcação

**Abrir Modal de Marcação:**
```typescript
fotoAtualMarcacao: string = null;
tipoFotoAtual: string = null;

async abrirMarcacao(tipo: string) {
  if (!this.fotos[tipo]) {
    this.mostrarErro('Tire a foto primeiro');
    return;
  }

  this.tipoFotoAtual = tipo;
  this.fotoAtualMarcacao = this.fotos[tipo];

  // Exibir modal com canvas
  const modal = await this.modalController.create({
    component: MarcacaoFotoComponent,
    componentProps: {
      foto: this.fotoAtualMarcacao
    }
  });

  await modal.present();

  const { data } = await modal.onWillDismiss();

  if (data && data.fotoMarcada) {
    this.fotos[tipo] = data.fotoMarcada;
    this.salvarLocalmente();
  }
}
```

---

### 3. Canvas para Desenho

**Componente de Marcação:**
```typescript
export class MarcacaoFotoComponent implements OnInit {
  @ViewChild('canvas') canvasEl: ElementRef;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  corAtual = '#FF0000'; // Vermelho padrão
  espessura = 3;
  desenhando = false;

  ngOnInit() {
    this.canvas = this.canvasEl.nativeElement;
    this.ctx = this.canvas.getContext('2d');

    // Carregar foto no canvas
    const img = new Image();
    img.onload = () => {
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = this.foto;
  }

  // Desenhar no canvas
  desenhar(event: any) {
    if (!this.desenhando) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = event.touches[0].clientX - rect.left;
    const y = event.touches[0].clientY - rect.top;

    this.ctx.lineTo(x, y);
    this.ctx.strokeStyle = this.corAtual;
    this.ctx.lineWidth = this.espessura;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
  }

  iniciarDesenho(event: any) {
    this.desenhando = true;
    const rect = this.canvas.getBoundingClientRect();
    const x = event.touches[0].clientX - rect.left;
    const y = event.touches[0].clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  terminarDesenho() {
    this.desenhando = false;
    this.ctx.closePath();
  }

  limparMarcacoes() {
    // Recarregar foto original
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = this.foto;
  }

  salvarMarcacao() {
    const fotoMarcada = this.canvas.toDataURL('image/jpeg', 0.9);
    this.modalController.dismiss({
      fotoMarcada
    });
  }
}
```

**HTML do Canvas:**
```html
<ion-content>
  <div class="canvas-container">
    <canvas
      #canvas
      (touchstart)="iniciarDesenho($event)"
      (touchmove)="desenhar($event)"
      (touchend)="terminarDesenho()">
    </canvas>
  </div>

  <div class="ferramentas">
    <div class="cores">
      <ion-button
        class="cor"
        [style.background]="'#FF0000'"
        (click)="corAtual = '#FF0000'">
      </ion-button>
      <ion-button
        class="cor"
        [style.background]="'#00FF00'"
        (click)="corAtual = '#00FF00'">
      </ion-button>
      <ion-button
        class="cor"
        [style.background]="'#0000FF'"
        (click)="corAtual = '#0000FF'">
      </ion-button>
      <ion-button
        class="cor"
        [style.background]="'#FFFF00'"
        (click)="corAtual = '#FFFF00'">
      </ion-button>
    </div>

    <div class="espessuras">
      <ion-button (click)="espessura = 2">Fino</ion-button>
      <ion-button (click)="espessura = 5">Médio</ion-button>
      <ion-button (click)="espessura = 8">Grosso</ion-button>
    </div>

    <ion-button expand="block" (click)="limparMarcacoes()">
      🗑️ Limpar
    </ion-button>
    <ion-button expand="block" (click)="salvarMarcacao()">
      ✅ Salvar
    </ion-button>
  </div>
</ion-content>
```

---

### 4. Validação de Fotos

```typescript
validarFotos(): boolean {
  const erros: string[] = [];

  if (!this.fotos.frontal) {
    erros.push('Foto Frontal é obrigatória');
  }
  if (!this.fotos.traseira) {
    erros.push('Foto Traseira é obrigatória');
  }
  if (!this.fotos.lateral_direita) {
    erros.push('Foto Lateral Direita é obrigatória');
  }
  if (!this.fotos.lateral_esquerda) {
    erros.push('Foto Lateral Esquerda é obrigatória');
  }

  if (erros.length > 0) {
    this.mostrarErro(erros.join('\n'));
    return false;
  }

  return true;
}
```

---

### 5. Salvar Fotos na API

```typescript
async salvarFotos() {
  if (!this.validarFotos()) {
    return;
  }

  try {
    const { value } = await Preferences.get({ key: 'inspecao_id' });
    const inspecaoId = parseInt(value);

    const response = await this.apiService.post('/b_veicular_update.php', {
      id: inspecaoId,
      foto_frontal: this.fotos.frontal,
      foto_traseira: this.fotos.traseira,
      foto_lateral_direita: this.fotos.lateral_direita,
      foto_lateral_esquerda: this.fotos.lateral_esquerda
    });

    if (response.sucesso) {
      this.router.navigate(['/pneus']);
    }

  } catch (erro) {
    this.mostrarErro('Erro ao salvar fotos');
  }
}
```

---

## ✅ Validações

### Fotos Obrigatórias
- ✅ Foto Frontal
- ✅ Foto Traseira
- ✅ Foto Lateral Direita
- ✅ Foto Lateral Esquerda

### Compressão
- Qualidade: 45%
- Largura máxima: 1200px
- Formato: JPEG (Base64)

---

## 📊 Estrutura de Dados

```typescript
interface FotosVeiculo {
  frontal: string | null;      // base64
  traseira: string | null;
  lateral_direita: string | null;
  lateral_esquerda: string | null;
}

interface FotoVeiculo {
  id?: number;
  inspecao_id?: number;
  tipo: 'Foto Frontal' | 'Foto Traseira' | 'Foto Lateral Direita' | 'Foto Lateral Esquerda';
  foto: string; // base64
  data_registro?: string;
}
```

---

## 🔄 Fluxo de Navegação

### Entrada
```
/inspecao-veiculo → /fotos-veiculo
```

### Saída
```
/fotos-veiculo → /pneus
```

---

## 🎨 Estilos (SCSS)

```scss
.foto-card {
  margin-bottom: 20px;
  padding: 15px;
  background: var(--ion-color-light);
  border-radius: 8px;

  .foto-titulo {
    font-weight: bold;
    margin-bottom: 10px;
  }

  .btn-tirar-foto {
    width: 100%;
    height: 120px;
    border: 2px dashed var(--ion-color-medium);
    border-radius: 8px;

    &.com-foto {
      border: 2px solid var(--ion-color-success);
    }
  }

  .preview-foto {
    margin: 10px 0;
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    border-radius: 8px;
  }

  .btn-marcar {
    margin-top: 10px;
  }
}

.canvas-container {
  position: relative;
  overflow: auto;
  max-height: 60vh;

  canvas {
    display: block;
    width: 100%;
    touch-action: none;
  }
}

.ferramentas {
  padding: 15px;

  .cores {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;

    .cor {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      --box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
  }

  .espessuras {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }
}
```

---

## 🧪 Casos de Teste

### Teste 1: Capturar Todas as Fotos
```
1. Clicar em "Tirar Foto" para Frontal
2. Capturar foto
3. Repetir para Traseira, Lateral Direita e Esquerda
4. Clicar em "Próximo Passo"
✅ Deve salvar fotos na API
✅ Deve navegar para /pneus
```

### Teste 2: Marcar Defeito em Foto
```
1. Tirar foto frontal
2. Clicar em "Marcar Defeitos"
3. Desenhar marcação vermelha
4. Clicar em "Salvar"
✅ Foto deve conter a marcação
```

### Teste 3: Validação de Fotos Obrigatórias
```
1. Deixar uma ou mais fotos sem tirar
2. Clicar em "Próximo Passo"
✅ Deve exibir erro listando fotos faltantes
✅ Não deve avançar
```

---

## 📚 Próximos Passos

1. [Inspeção de Pneus - Finalização](./07-pneus.md)

---

## 🔗 Links Relacionados

- [Inspeção Veículo](./05-inspecao-veiculo.md)
- [Pneus](./07-pneus.md)
- [API - Atualizar Fotos](./11-api.md#atualizar-checklist)

---

[← Voltar ao Índice](./index.md)
