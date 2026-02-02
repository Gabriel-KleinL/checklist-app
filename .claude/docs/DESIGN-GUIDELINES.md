# Diretrizes de Design - Checklist App

## Paleta de Cores

### 🎨 Regra Principal
**O frontend DEVE usar APENAS as seguintes cores:**
- **Vermelho** (`#ff0000` / `var(--ion-color-primary)`)
- **Preto** (`#000000`)
- **Cinza** (várias tonalidades: `#1a1a1a`, `#2a2a2a`, `#404040`, `#808080`, `#c0c0c0`)
- **Branco** (`#ffffff`)

### ❌ Cores PROIBIDAS
- Azul
- Verde
- Amarelo/Laranja
- Roxo/Rosa
- Qualquer outra cor que não seja vermelho, preto, cinza ou branco

### 📋 Mapeamento de Cores

#### Vermelho (`#ff0000`)
- **Uso**: Ações principais, botões importantes, destaques, elementos interativos
- **Variantes**:
  - `#ff0000` - Vermelho principal
  - `#e00000` - Vermelho escuro (shade)
  - `#ff1a1a` - Vermelho claro (tint)
- **CSS Variable**: `var(--ion-color-primary)`

#### Preto (`#000000`)
- **Uso**: Fundos principais, backgrounds de telas
- **CSS Variable**: `var(--ion-background-color)`

#### Cinza
- **Uso**: Fundos secundários, bordas, textos secundários, elementos desabilitados
- **Tonalidades**:
  - `#1a1a1a` - Cinza muito escuro (fundos de cards)
  - `#2a2a2a` - Cinza escuro (gradientes)
  - `#404040` - Cinza médio (`var(--ion-color-medium)`)
  - `#808080` - Cinza médio (`var(--ion-color-secondary)`)
  - `#c0c0c0` - Cinza claro (`var(--ion-color-light)`)

#### Branco (`#ffffff`)
- **Uso**: Textos em fundos escuros, ícones, contraste
- **CSS Variable**: `var(--ion-text-color)`

### 🔄 Quando Substituir Cores

#### Substituições Comuns

| Cor Original | Substituir Por | Uso |
|--------------|----------------|-----|
| Azul (`#3880ff`, `#667eea`, etc.) | Vermelho (`var(--ion-color-primary)`) | Botões, destaques |
| Verde (`#2dd36f`, `#00b894`, etc.) | Vermelho ou Cinza | Sucesso/Status |
| Amarelo/Laranja (`#ffc409`, `#ff6b35`, etc.) | Cinza (`#808080`) | Avisos/Warning |
| Roxo (`#764ba2`, `#667eea`, etc.) | Vermelho (`var(--ion-color-primary)`) | Gradientes, fundos |
| Rosa (`#ff4961`, etc.) | Vermelho (`var(--ion-color-primary)`) | Destaques |

### 📝 Exemplos de Código

#### ✅ CORRETO
```scss
// Botão primário
background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);

// Card de aviso
background: linear-gradient(135deg, #404040 0%, #2a2a2a 100%);
border: 2px solid #808080;

// Texto secundário
color: #808080;
```

#### ❌ INCORRETO
```scss
// ❌ Não usar azul
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// ❌ Não usar verde
background: linear-gradient(135deg, #2dd36f 0%, #28ba62 100%);

// ❌ Não usar amarelo
color: #ffc409;
```

## Componentes

### Botões

#### Botão Primário (Vermelho)
```scss
ion-button[color="primary"] {
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
  color: white;
}
```

#### Botão Secundário (Cinza)
```scss
ion-button[color="secondary"] {
  background: linear-gradient(135deg, #808080 0%, #606060 100%);
  color: white;
}
```

### Cards

#### Card Padrão
```scss
ion-card {
  background: #1a1a1a;
  border: 2px solid #3a3a3a;
  color: white;
}
```

#### Card de Destaque
```scss
ion-card[color="primary"] {
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
  color: white;
}
```

### Status e Badges

- **Ativo/Habilitado**: Vermelho (`var(--ion-color-primary)`)
- **Inativo/Desabilitado**: Cinza (`#808080`)
- **Neutro**: Cinza (`#404040`)

## Responsividade

Todas as cores devem manter a paleta em todos os breakpoints:
- Mobile (< 768px)
- Tablet (768px - 1024px)
- Desktop (> 1024px)

## Acessibilidade

- Contraste mínimo de 4.5:1 para texto em fundo escuro
- Contraste mínimo de 3:1 para elementos não-textuais
- Usar `var(--ion-color-primary-contrast)` para garantir contraste adequado

## Manutenção

### Verificação de Cores
Antes de fazer commit, verifique:
1. Não há cores hexadecimais que não sejam vermelho, preto, cinza ou branco
2. Todas as cores usam as CSS variables do Ionic quando possível
3. Gradientes usam apenas vermelho, preto, cinza ou branco

### Comandos Úteis
```bash
# Buscar cores hexadecimais no SCSS
grep -r "#[0-9a-fA-F]\{6\}" src/app/admin/admin.page.scss

# Buscar cores que não são da paleta
grep -E "(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})" src/app/admin/admin.page.scss | grep -vE "(#ff0000|#000000|#ffffff|#1a1a1a|#2a2a2a|#3a3a3a|#404040|#808080|#c0c0c0)"
```

## Referências

- `src/theme/variables.scss` - Variáveis CSS principais
- `src/app/admin/admin.page.scss` - Estilos da página admin (exemplo)
