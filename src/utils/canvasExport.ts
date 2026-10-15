import type { FontVariant, FontSizeUnit } from '../types/ocarina';

export interface CanvasExportOptions {
  title?: string;
  tabText: string;
  fontSize: number;
  fontSizeUnit: FontSizeUnit;
  fontVariant: FontVariant;
  backgroundColor?: string;
  textColor?: string;
  filename?: string;
}

export function exportTabAsImage(options: CanvasExportOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const {
        title,
        tabText,
        fontSize,
        fontSizeUnit,
        fontVariant,
        backgroundColor = '#ffffff',
        textColor = '#111827',
        filename = '12_hole_ocarina_tabs.png',
      } = options;

      const lines = tabText.split('\n');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context não suportado');
      }

      let sizePx = fontSize;
      if (fontSizeUnit === 'pt') sizePx = fontSize * 1.333;
      else if (fontSizeUnit === 'mm') sizePx = fontSize * 3.78;
      else if (fontSizeUnit === 'cm') sizePx = fontSize * 37.8;
      else if (fontSizeUnit === 'in') sizePx = fontSize * 96;
      else if (fontSizeUnit === 'pc') sizePx = fontSize * 16;

      const fontFamily = `"Open 12 Hole Ocarina ${fontVariant}", monospace`;
      const fontSpec = `${sizePx}px ${fontFamily}`;
      ctx.font = fontSpec;

      let maxLineWidth = 0;
      for (const line of lines) {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxLineWidth) {
          maxLineWidth = metrics.width;
        }
      }

      const lineHeight = sizePx * 1.5;
      const padding = 40;
      const titleHeight = title ? sizePx * 1.2 : 0;

      const scale = 2;
      const width = Math.max(600, Math.ceil(maxLineWidth + padding * 2));
      const height = Math.ceil(padding * 2 + titleHeight + lines.length * lineHeight);

      canvas.width = width * scale;
      canvas.height = height * scale;

      ctx.scale(scale, scale);

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      let currentY = padding;
      if (title) {
        ctx.fillStyle = textColor;
        ctx.font = `bold ${Math.round(sizePx * 0.55)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, currentY + Math.round(sizePx * 0.45));
        currentY += titleHeight;
      }

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = fontSpec;
      ctx.fillStyle = textColor;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        ctx.fillText(line, padding, currentY);
        currentY += lineHeight;
      }

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'right';
      ctx.fillText('Gerado via Ocarina Tabs Studio • github.com/ApenasGabs/ocarina-tabs', width - padding, height - 15);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Falha ao gerar blob de imagem'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        resolve();
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}
