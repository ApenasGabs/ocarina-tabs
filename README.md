# 🪈 Ocarina Tabs Studio

> **Criador, Editor e Player de Tablaturas para Ocarina de 12 Furos com Síntese Sonora e Seletor Visual de Furinhos.**

Baseado no projeto clássico [panzi/ocarina_tabs](https://github.com/panzi/ocarina_tabs) e reconstruído em uma aplicação web moderna com **React 19**, **TypeScript**, **Tailwind CSS 4**, **daisyUI 5** e **Web Audio API**.

---

## ✨ Funcionalidades Principais

### 1. 🎵 Síntese de Áudio em Tempo Real (Web Audio API)
- Emulação acústica de ocarina de cerâmica (flauta globular de câmara ressonante).
- Onda fundamental senoidal aquecida com 2º e 3º harmônicos sutis, ruído de ar (breath noise) e vibrato natural (~5.2 Hz com rampa suave).
- Feedback auditivo imediato ao clicar nas notas ou ao digitar no teclado.
- Controle de Mudo e Volume.

### 2. 👀 Seletor Visual de Furinhos (Escolha por Imagem)
- Permite que o instrumentista escolha a nota olhando diretamente para o diagrama dos 12 furos da ocarina, sem precisar ler nomes de notas ou partitura.
- **Explorador Interativo**: Clique diretamente em qualquer um dos 12 furinhos da ocarina (mão esquerda, mão direita, polegares e sub-furos) para abrir ou fechar furos e descobrir qual nota soa com aquela digitação!

### 3. ⏱️ Marcação e Controle de Tempo (Rhythm & Playback)
- **Presets de Duração Musical**:
  - Semibreve (1/1 - 4 tempos) 𝅝
  - Mínima (1/2 - 2 tempos) 𝅗𝅥
  - Semínima (1/4 - 1 tempo) ♩
  - Colcheia (1/8 - 1/2 tempo) ♪
  - Semicolcheia (1/16 - 1/4 tempo) 𝅘𝅥𝅯
- Inserção com sustentação automática de tempo (` - - -`).
- **Controle de BPM** (40 a 240 BPM) com recurso de **Tap Tempo** interativo.
- **Player de Tablatura**: Reprodução sequencial da melodia com áudio e opção de clique de metrônomo e repetição em loop.

### 4. 📝 Editor Completo de Tablatura
- Suporte nativo às fontes tipográficas **Open 12 Hole Ocarina 1** e **Open 12 Hole Ocarina 2**.
- Tonalidades: **C (Dó Maior)**, **F (Fá Maior)** e **G (Sol Maior)** com notas naturais e acidentes (♯/♭).
- Suporte a símbolos de repetição (`×2`, `×`), pausas (`r`), barlines de compasso (`|`) e ligaduras de fraseamento musical (`︵`).
- Histórico de **Desfazer / Refazer** (Ctrl+Z / Ctrl+Y).
- Canções populares pré-carregadas de *The Legend of Zelda* (*Zelda's Lullaby*, *Song of Time*, *Saria's Song*, *Song of Storms*, *Clocktown Theme*).

### 5. 🎼 Formatos Universais de Tablatura (Importação & Exportação)
- **ABC Notation (.abc)**: Importação e exportação bidirecional de partituras de texto no padrão universal da comunidade musical (compatível com *MuseScore*, *The Session*, *ABCjs* e ferramentas de notação), com detecção de armaduras de clave, compasso, andamento e transposição inteligente de oitavas para a extensão de 12 furos.
- **Cifras e Nomes de Notas Populares**: Importador inteligente com detecção automática de notação americana/anglo-saxã (`C D E - G - - C2 D2`) e notação latina/solfejo (`Dó Ré Mi - Sol - -`), convertendo diretamente para a tablatura visual de ocarina.
- **Pacote Estruturado (.otab / JSON)**: Formato de canção com fidelidade total para compartilhamento, salvando título, artista, afinação da ocarina (C, F ou G), BPM, variante de fonte, tamanho e texto integral das notas.
- **Trilha MIDI Standard (.mid)**: Geração direta no navegador de arquivos MIDI com instrumento General MIDI 79 (Ocarina) e mapa de tempo para DAWs (Reaper, FL Studio, Ableton, Logic, MuseScore).
- **Gravação em Áudio Acústico WAV (.wav)**: Síntese de áudio 44.1 kHz 16-bit PCM de alta fidelidade renderizada via Web Audio API.
- **Backup de Biblioteca Completa**: Exportação e importação em lote para guardar ou restaurar todas as canções criadas em arquivo único.

### 6. 💾 Exportação Visual, Compartilhamento e Impressão
- **Exportação em Imagem PNG**: Renderização via Canvas em alta resolução (Retina 2x).
- **Exportação e Importação de Arquivo de Texto (.txt)**.
- **Compartilhamento por Link**: Estado da música salvo diretamente nos parâmetros da URL.
- **Código Embed**: Snippet pronto para incorporar em páginas web via `<iframe>`.
- **Modo Impressão Otimizado** (`@media print`).
- Mais de 30 temas visuais selecionáveis via **daisyUI** (Light, Dark, Cupcake, Synthwave, Forest, etc.).

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ (recomendado Node 20 ou 22)
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/ApenasGabs/ocarina-tabs.git

# Acesse o diretório
cd ocarina-tabs

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` no seu navegador.

---

## 🧪 Testes e Qualidade

```bash
# Executar testes unitários com Vitest
npm test

# Build de produção
npm run build

# Pré-visualizar build localmente
npm run preview
```

---

## 📄 Créditos e Licença

- Aplicação desenvolvida por **[Gabriel Rodrigues (@ApenasGabs)](https://github.com/ApenasGabs)** utilizando a base do [ApenasTemplate](https://github.com/ApenasGabs/ApenasTemplate).
- Fontes tipográficas e arte vetorial original criadas por **Mathias Panzenböck** no projeto [panzi/ocarina_tabs](https://github.com/panzi/ocarina_tabs), licenciadas sob **Open Font License 1.1 (OFL)**.
- Código-fonte da aplicação licenciado sob a licença **MIT**.
