import React, { useEffect, useRef, useState } from 'react';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType
} from 'docx';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { renderAsync } from 'docx-preview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_MARKDOWN_THEME, MARKDOWN_PALETTES } from './utils/themes';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const WHITE = 'FFFFFF';

const stripHex = (color) => color.replace('#', '').toUpperCase();

const hexToRgb = (color) => {
  const hex = stripHex(color);
  return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
};

const contrastColor = (background) => {
  const [red, green, blue] = hexToRgb(background);
  return ((red * 299) + (green * 587) + (blue * 114)) / 1000 > 150 ? '202020' : WHITE;
};

const normalizedOutputName = (name, format) => {
  const value = name.trim().replace(/\.(docx|pdf)$/i, '').replace(/[\\/:*?"<>|]+/g, '-');
  return `${value || 'documento'}.${format}`;
};

const titleFromFileName = (name) => name
  .replace(/\.[^.]+$/, '')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());

const cleanMarkdownText = (text) => text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\\\./g, '.');

const tableCells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

const isTableSeparator = (cells) => cells.every((cell) => /^:?-{3,}:?$/.test(cell));

const parseMarkdown = (markdown) => {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let firstHeading = true;
  let index = 0;

  while (index < lines.length) {
    const text = lines[index].trim();
    if (!text) {
      index += 1;
      continue;
    }

    if (text === '---') {
      blocks.push({ type: 'pageBreak' });
      index += 1;
      continue;
    }

    if (text.startsWith('|') && lines[index + 1]?.trim().startsWith('|')) {
      const rows = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        const cells = tableCells(lines[index]);
        if (!isTableSeparator(cells)) rows.push(cells);
        index += 1;
      }
      if (rows.length) blocks.push({ type: 'table', rows });
      continue;
    }

    const heading = text.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const isTitle = level === 1 && firstHeading;
      blocks.push({ type: 'heading', level, isTitle, text: heading[2] });
      if (isTitle) firstHeading = false;
      index += 1;
      continue;
    }

    const bullet = text.match(/^-\s+(.*)$/);
    if (bullet) {
      blocks.push({ type: 'bullet', text: bullet[1] });
      index += 1;
      continue;
    }

    const numbered = text.match(/^\d+\.\s+(.*)$/);
    if (numbered) {
      blocks.push({ type: 'numbered', text: numbered[1] });
      index += 1;
      continue;
    }

    const paragraphLines = [text];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || next === '---' || next.startsWith('#') || next.startsWith('|') || /^-\s+/.test(next) || /^\d+\.\s+/.test(next)) break;
      paragraphLines.push(next);
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
};

const createRuns = (text, settings, options = {}) => text
  .split(/(\*\*.*?\*\*)/g)
  .filter(Boolean)
  .map((part) => {
    const isBold = part.startsWith('**') && part.endsWith('**');
    return new TextRun({
      text: (isBold ? part.slice(2, -2) : part).replace(/\\\./g, '.'),
      bold: options.bold || isBold,
      color: options.color,
      font: settings.fontFamily,
      size: options.size
    });
  });

const createDocxTable = (rows, settings) => {
  const columnCount = Math.max(...rows.map((row) => row.length));
  const tableColor = stripHex(settings.table);
  const stripeColor = stripHex(settings.stripe);
  const headerTextColor = contrastColor(settings.table);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, rowIndex) => new TableRow({
      children: Array.from({ length: columnCount }, (_, columnIndex) => new TableCell({
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 70, left: 90, bottom: 70, right: 90 },
        shading: rowIndex === 0
          ? { fill: tableColor, type: ShadingType.CLEAR, color: 'auto' }
          : rowIndex % 2 === 0
            ? { fill: stripeColor, type: ShadingType.CLEAR, color: 'auto' }
            : undefined,
        children: [new Paragraph({
          spacing: { after: 0 },
          children: createRuns(row[columnIndex] || '', settings, {
            bold: rowIndex === 0,
            color: rowIndex === 0 ? headerTextColor : undefined,
            size: 17
          })
        })]
      }))
    })),
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'B7B7B7' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'B7B7B7' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'B7B7B7' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'B7B7B7' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'B7B7B7' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'B7B7B7' }
    }
  });
};

const docxChildren = (blocks, settings) => {
  const children = [];

  blocks.forEach((block) => {
    if (block.type === 'pageBreak') {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    } else if (block.type === 'table') {
      children.push(createDocxTable(block.rows, settings));
      children.push(new Paragraph({ spacing: { after: 0 } }));
    } else if (block.type === 'heading') {
      children.push(new Paragraph({
        style: block.isTitle ? 'DocumentTitle' : `DocumentHeading${block.level}`,
        alignment: block.isTitle ? AlignmentType.CENTER : undefined,
        spacing: block.isTitle ? { before: 700, after: 360 } : undefined,
        children: createRuns(block.text, settings)
      }));
    } else if (block.type === 'bullet') {
      children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: createRuns(block.text, settings) }));
    } else if (block.type === 'numbered') {
      children.push(new Paragraph({ numbering: { reference: 'document-numbering', level: 0 }, spacing: { after: 40 }, children: createRuns(block.text, settings) }));
    } else {
      children.push(new Paragraph({ children: createRuns(block.text, settings) }));
    }
  });

  return children;
};

const createDocxDocument = (blocks, title, settings) => {
  const titleColor = stripHex(settings.title);
  const footer = settings.showPageNumbers
    ? new Footer({
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Página ', font: settings.fontFamily, size: 16, color: '646464' }),
          new TextRun({ children: [PageNumber.CURRENT], font: settings.fontFamily, size: 16, color: '646464' })
        ]
      })]
    })
    : undefined;

  return new Document({
    creator: 'Corporación Linker',
    title,
    subject: 'Documento generado desde Markdown',
    numbering: {
      config: [{
        reference: 'document-numbering',
        levels: [{
          level: 0,
          format: 'decimal',
          text: '%1.',
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }]
    },
    styles: {
      default: {
        document: {
          run: { font: settings.fontFamily, size: settings.bodySize * 2 },
          paragraph: { spacing: { after: 100, line: 259 } }
        }
      },
      paragraphStyles: [
        {
          id: 'DocumentTitle',
          name: 'Document Title',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: settings.fontFamily, size: settings.titleSize * 2, bold: true, color: titleColor },
          paragraph: { keepNext: true }
        },
        ...[
          ['DocumentHeading1', 'Document Heading 1', HeadingLevel.HEADING_1, settings.headingSize],
          ['DocumentHeading2', 'Document Heading 2', HeadingLevel.HEADING_2, Math.max(settings.headingSize - 3, 9)],
          ['DocumentHeading3', 'Document Heading 3', HeadingLevel.HEADING_3, Math.max(settings.headingSize - 4.5, 8)]
        ].map(([id, name, heading, size]) => ({
          id,
          name,
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: settings.fontFamily, size: size * 2, bold: true, color: titleColor },
          paragraph: { heading, keepNext: true, spacing: { before: 200, after: 100 } }
        }))
      ]
    },
    sections: [{
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1020, right: 1134, bottom: 964, left: 1134 } }
      },
      headers: settings.headerText.trim()
        ? {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: settings.headerText.trim(), font: settings.fontFamily, size: 16, bold: true, color: titleColor })]
            })]
          })
        }
        : undefined,
      footers: footer ? { default: footer } : undefined,
      children: docxChildren(blocks, settings)
    }]
  });
};

const pdfFontName = (fontFamily) => {
  if (fontFamily === 'Times New Roman') return 'times';
  if (fontFamily === 'Courier New') return 'courier';
  return 'helvetica';
};

const createPdfDocument = (blocks, title, settings) => {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const top = 25;
  const bottom = 18;
  const usableWidth = pageWidth - (margin * 2);
  const titleRgb = hexToRgb(settings.title);
  const tableRgb = hexToRgb(settings.table);
  const stripeRgb = hexToRgb(settings.stripe);
  const headerTextRgb = hexToRgb(`#${contrastColor(settings.table)}`);
  const font = pdfFontName(settings.fontFamily);
  let y = top;
  let number = 1;

  pdf.setProperties({ title, subject: 'Documento generado desde Markdown', author: 'Corporación Linker' });

  const drawHeader = () => {
    if (!settings.headerText.trim()) return;
    pdf.setFont(font, 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...titleRgb);
    pdf.text(settings.headerText.trim(), pageWidth - margin, 12, { align: 'right' });
  };

  const newPage = () => {
    pdf.addPage();
    y = top;
    drawHeader();
  };

  const ensureSpace = (height) => {
    if (y + height > pageHeight - bottom) newPage();
  };

  const drawWrappedText = (text, options = {}) => {
    const size = options.size || settings.bodySize;
    const indent = options.indent || 0;
    const lines = pdf.splitTextToSize(cleanMarkdownText(text), usableWidth - indent);
    const lineHeight = size * 0.42;
    ensureSpace((lines.length * lineHeight) + (options.after || 2));
    pdf.setFont(font, options.bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(...(options.color || [35, 35, 35]));
    pdf.text(lines, options.align ? pageWidth / 2 : margin + indent, y, options.align ? { align: options.align, maxWidth: usableWidth } : undefined);
    y += (lines.length * lineHeight) + (options.after || 2);
  };

  drawHeader();
  blocks.forEach((block) => {
    if (block.type === 'pageBreak') {
      newPage();
    } else if (block.type === 'heading') {
      const size = block.isTitle ? settings.titleSize : Math.max(settings.headingSize - ((block.level - 1) * 3), 9);
      if (block.isTitle) y += 10;
      drawWrappedText(block.text, { size, bold: true, color: titleRgb, align: block.isTitle ? 'center' : undefined, after: block.isTitle ? 8 : 4 });
    } else if (block.type === 'bullet') {
      drawWrappedText(`•  ${block.text}`, { indent: 4, after: 1.5 });
    } else if (block.type === 'numbered') {
      drawWrappedText(`${number}.  ${block.text}`, { indent: 4, after: 1.5 });
      number += 1;
    } else if (block.type === 'table') {
      ensureSpace(20);
      const [head, ...body] = block.rows.map((row) => row.map(cleanMarkdownText));
      autoTable(pdf, {
        head: [head],
        body,
        startY: y,
        margin: { left: margin, right: margin, top },
        styles: { font, fontSize: Math.max(settings.bodySize - 1, 7), cellPadding: 2, lineColor: [183, 183, 183], lineWidth: 0.15 },
        headStyles: { fillColor: tableRgb, textColor: headerTextRgb, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: stripeRgb },
        didDrawPage: drawHeader
      });
      y = (pdf.lastAutoTable?.finalY || y) + 5;
    } else {
      drawWrappedText(block.text, { after: 3 });
    }
  });

  if (settings.showPageNumbers) {
    const pageCount = pdf.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      pdf.setPage(page);
      pdf.setFont(font, 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Página ${page}`, pageWidth / 2, pageHeight - 9, { align: 'center' });
    }
  }

  return pdf;
};

const ColorSetting = ({ id, label, value, onChange }) => (
  <label htmlFor={id} className="flex align-items-center justify-content-between gap-3">
    <span className="text-sm font-medium">{label}</span>
    <span className="flex align-items-center gap-2">
      <code className="text-xs text-color-secondary">{value.toUpperCase()}</code>
      <input
        id={id}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-1 surface-border border-round cursor-pointer p-0"
        style={{ width: '2.5rem', height: '2rem', background: 'transparent' }}
      />
    </span>
  </label>
);

const MarkdownConversor = () => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const fileInputRef = useRef(null);
  const wordPreviewRef = useRef(null);
  const [markdown, setMarkdown] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [outputName, setOutputName] = useState('documento.docx');
  const [outputFormat, setOutputFormat] = useState('docx');
  const [settings, setSettings] = useState(DEFAULT_MARKDOWN_THEME);
  const [dragActive, setDragActive] = useState(false);
  const [converting, setConverting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const updateSetting = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

  const selectPalette = (palette) => {
    const colors = MARKDOWN_PALETTES[palette];
    setSettings((current) => ({ ...current, ...colors, palette }));
  };

  const changeOutputFormat = (format) => {
    setOutputFormat(format);
    setOutputName((current) => normalizedOutputName(current, format));
  };

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    if (!markdown.trim()) {
      setPreviewUrl('');
      setPreviewLoading(false);
      setPreviewError('');
      if (wordPreviewRef.current) wordPreviewRef.current.replaceChildren();
      return undefined;
    }

    setPreviewLoading(true);
    setPreviewError('');
    setPreviewUrl('');

    const timeout = window.setTimeout(async () => {
      try {
        const blocks = parseMarkdown(markdown);
        const title = sourceName ? titleFromFileName(sourceName) : titleFromFileName(outputName);

        if (outputFormat === 'pdf') {
          const blob = createPdfDocument(blocks, title, settings).output('blob');
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
        } else {
          const blob = await Packer.toBlob(createDocxDocument(blocks, title, settings));
          if (cancelled || !wordPreviewRef.current) return;
          wordPreviewRef.current.replaceChildren();
          await renderAsync(blob, wordPreviewRef.current, null, {
            breakPages: true,
            renderHeaders: true,
            renderFooters: true,
            useBase64URL: true
          });
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setPreviewError('No se pudo generar la vista previa.');
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [markdown, outputFormat, outputName, settings, sourceName]);

  const loadFile = async (file) => {
    if (!file || (!file.name.toLowerCase().endsWith('.md') && !['text/markdown', 'text/plain'].includes(file.type))) {
      toast.current.show({ severity: 'warn', summary: 'Formato no compatible', detail: 'Selecciona un archivo Markdown (.md).', life: 3000 });
      return;
    }

    try {
      const content = await file.text();
      setMarkdown(content);
      setSourceName(file.name);
      setOutputName(`${file.name.replace(/\.md$/i, '')}.${outputFormat}`);
      toast.current.show({ severity: 'success', summary: 'Markdown cargado', detail: file.name, life: 2500 });
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo leer el archivo.', life: 3000 });
    }
  };

  const convert = async () => {
    if (!markdown.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Sin contenido', detail: 'Carga un archivo o pega contenido Markdown.', life: 3000 });
      return;
    }

    setConverting(true);
    try {
      const finalName = normalizedOutputName(outputName, outputFormat);
      const title = sourceName ? titleFromFileName(sourceName) : titleFromFileName(finalName);
      const blocks = parseMarkdown(markdown);

      if (outputFormat === 'pdf') {
        createPdfDocument(blocks, title, settings).save(finalName);
      } else {
        const blob = await Packer.toBlob(createDocxDocument(blocks, title, settings));
        const url = URL.createObjectURL(new Blob([blob], { type: DOCX_MIME }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = finalName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }

      setOutputName(finalName);
      toast.current.show({ severity: 'success', summary: 'Documento generado', detail: `${finalName} está listo.`, life: 3000 });
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: `No se pudo generar el documento ${outputFormat.toUpperCase()}.`, life: 4000 });
    } finally {
      setConverting(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    loadFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex justify-content-center p-4">
      <Toast ref={toast} />
      <div className="surface-card p-5 shadow-3 border-round w-full">
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-4">
          <div className="flex align-items-center">
            <Button icon="pi pi-arrow-left" text rounded severity="secondary" onClick={() => navigate('/')} className="mr-3" />
            <h2 className="m-0 text-2xl md:text-3xl font-bold flex align-items-center">
              <i className="pi pi-heart-fill mr-3 text-pink-500" style={{ fontSize: '2rem' }}></i>
              <span>I love markdown</span>
            </h2>
          </div>
          <Button label={`Descargar ${outputFormat.toUpperCase()}`} icon="pi pi-download" loading={converting} disabled={!markdown.trim()} onClick={convert} />
        </div>

        <p className="text-color-secondary mb-5">
          Convierte Markdown en DOCX o PDF y personaliza su apariencia. Todo el procesamiento se realiza en tu navegador.
        </p>

        <input ref={fileInputRef} type="file" accept=".md,text/markdown,text/plain" className="hidden" onChange={(event) => loadFile(event.target.files?.[0])} />

        <div
          className={`border-2 border-dashed border-round p-4 text-center mb-5 transition-colors transition-duration-200 ${dragActive ? 'border-pink-500 surface-100' : 'surface-border surface-50'}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <i className="pi pi-cloud-upload text-pink-500 mb-3" style={{ fontSize: '3rem' }}></i>
          <div className="text-xl font-semibold mb-2">Selecciona o arrastra un archivo Markdown</div>
          <div className="text-color-secondary mb-3">Archivos .md en UTF-8</div>
          <Button label="Elegir archivo" icon="pi pi-upload" outlined onClick={() => fileInputRef.current?.click()} />
          {sourceName && <div className="mt-3 font-medium text-pink-500">{sourceName}</div>}
        </div>

        <div className="surface-50 border-round p-4 mb-4">
          <div className="flex align-items-center justify-content-between gap-2 mb-3">
            <h3 className="m-0 text-xl"><i className="pi pi-cog mr-2"></i>Settings</h3>
            <Button icon="pi pi-refresh" text rounded severity="secondary" aria-label="Restablecer configuración" onClick={() => setSettings(DEFAULT_MARKDOWN_THEME)} />
          </div>

          <div className="grid">
            <div className="col-12 xl:col-3">
              <div className="surface-0 border-1 surface-border border-round p-3 h-full">
                <div className="font-semibold mb-3">Salida</div>
                <div className="grid">
                  <div className="col-12 sm:col-5 xl:col-12">
                    <label htmlFor="output-format" className="text-sm font-medium block mb-2">Formato</label>
                    <select id="output-format" value={outputFormat} onChange={(event) => changeOutputFormat(event.target.value)} className="p-inputtext p-component w-full">
                      <option value="docx">Word (.docx)</option>
                      <option value="pdf">PDF (.pdf)</option>
                    </select>
                  </div>
                  <div className="col-12 sm:col-7 xl:col-12">
                    <label htmlFor="output-name" className="text-sm font-medium block mb-2">Nombre del archivo</label>
                    <InputText id="output-name" value={outputName} onChange={(event) => setOutputName(event.target.value)} className="w-full" />
                  </div>
                </div>
                <label className="flex align-items-center gap-2 cursor-pointer mt-2">
                  <input type="checkbox" checked={settings.showPageNumbers} onChange={(event) => updateSetting('showPageNumbers', event.target.checked)} />
                  <span className="text-sm font-medium">Mostrar números de página</span>
                </label>
              </div>
            </div>

            <div className="col-12 xl:col-5">
              <div className="surface-0 border-1 surface-border border-round p-3 h-full">
                <div className="font-semibold mb-3">Paleta y colores</div>
                <div className="grid align-items-end">
                  <div className="col-12 md:col-5">
                    <label htmlFor="palette" className="text-sm font-medium block mb-2">Paleta</label>
                    <select id="palette" value={settings.palette} onChange={(event) => selectPalette(event.target.value)} className="p-inputtext p-component w-full">
                      {settings.palette === 'custom' && <option value="custom" disabled>Personalizada</option>}
                      {Object.entries(MARKDOWN_PALETTES).map(([value, palette]) => <option key={value} value={value}>{palette.label}</option>)}
                    </select>
                  </div>
                  <div className="col-12 md:col-7">
                    <div className="flex gap-2" aria-label="Vista previa de la paleta">
                      {[settings.title, settings.table, settings.stripe].map((color, index) => (
                        <span key={`${color}-${index}`} className="border-round flex-grow-1 border-1 surface-border" style={{ height: '2.25rem', backgroundColor: color }}></span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid mt-2">
                  <div className="col-12 md:col-4"><ColorSetting id="title-color" label="Títulos" value={settings.title} onChange={(value) => setSettings((current) => ({ ...current, title: value, palette: 'custom' }))} /></div>
                  <div className="col-12 md:col-4"><ColorSetting id="table-color" label="Tabla" value={settings.table} onChange={(value) => setSettings((current) => ({ ...current, table: value, palette: 'custom' }))} /></div>
                  <div className="col-12 md:col-4"><ColorSetting id="stripe-color" label="Alternas" value={settings.stripe} onChange={(value) => setSettings((current) => ({ ...current, stripe: value, palette: 'custom' }))} /></div>
                </div>
              </div>
            </div>

            <div className="col-12 xl:col-4">
              <div className="surface-0 border-1 surface-border border-round p-3 h-full">
                <div className="font-semibold mb-3">Tipografía y encabezado</div>
                <div className="grid">
                  <div className="col-12 md:col-5">
                    <label htmlFor="font-family" className="text-sm font-medium block mb-2">Tipografía</label>
                    <select id="font-family" value={settings.fontFamily} onChange={(event) => updateSetting('fontFamily', event.target.value)} className="p-inputtext p-component w-full">
                      <option value="Arial">Arial</option>
                      <option value="Calibri">Calibri</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>
                  <div className="col-4 md:col-2">
                    <label htmlFor="body-size" className="text-sm font-medium block mb-2">Texto</label>
                    <InputText id="body-size" type="number" min="8" max="14" step="0.5" value={settings.bodySize} onChange={(event) => updateSetting('bodySize', Number(event.target.value) || 9.5)} className="w-full" />
                  </div>
                  <div className="col-4 md:col-2">
                    <label htmlFor="title-size" className="text-sm font-medium block mb-2">Título</label>
                    <InputText id="title-size" type="number" min="14" max="32" value={settings.titleSize} onChange={(event) => updateSetting('titleSize', Number(event.target.value) || 20)} className="w-full" />
                  </div>
                  <div className="col-4 md:col-3">
                    <label htmlFor="heading-size" className="text-sm font-medium block mb-2">Subtítulo</label>
                    <InputText id="heading-size" type="number" min="10" max="24" value={settings.headingSize} onChange={(event) => updateSetting('headingSize', Number(event.target.value) || 15)} className="w-full" />
                  </div>
                  <div className="col-12">
                    <label htmlFor="header-text" className="text-sm font-medium block mb-2">Texto del encabezado</label>
                    <InputText id="header-text" value={settings.headerText} onChange={(event) => updateSetting('headerText', event.target.value)} placeholder="Vacío para ocultarlo" className="w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-top-1 surface-border pt-3 mt-2 text-sm text-color-secondary line-height-3">
            Compatible con <code># ## ###</code>, <code>**negrita**</code>, listas, tablas y <code>---</code> como salto de página.
          </div>
        </div>

        <div className="grid">
          <div className="col-12 lg:col-6">
            <div className="flex align-items-center justify-content-between gap-2 mb-2">
              <label htmlFor="markdown-content" className="font-semibold">Contenido Markdown</label>
              <span className="text-xs text-color-secondary">Editor</span>
            </div>
            <InputTextarea
              id="markdown-content"
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              placeholder={'# Título\n\nEscribe o pega aquí el contenido Markdown...'}
              className="w-full font-monospace line-height-2"
              style={{ height: '48rem', minHeight: '32rem', resize: 'vertical', fontSize: '0.78rem' }}
            />
          </div>

          <div className="col-12 lg:col-6">
            <div className="surface-50 border-round p-3 h-full">
              <div className="flex align-items-center justify-content-between gap-3 mb-2">
                <div>
                  <h3 className="m-0 text-lg">Vista previa de {outputFormat.toUpperCase()}</h3>
                  <div className="text-xs text-color-secondary mt-1">Se actualiza automáticamente.</div>
                </div>
                {previewLoading && <i className="pi pi-spin pi-spinner text-xl text-pink-500" aria-label="Generando vista previa"></i>}
              </div>

              {!markdown.trim() && (
                <div className="surface-0 border-1 surface-border border-round p-6 text-center text-color-secondary flex flex-column justify-content-center" style={{ height: '48rem' }}>
                  <i className="pi pi-eye text-3xl mb-3 block"></i>
                  Carga o escribe contenido Markdown para generar la vista previa.
                </div>
              )}

              {previewError && <div className="p-3 border-round bg-red-50 text-red-700">{previewError}</div>}

              {outputFormat === 'pdf' && previewUrl && (
                <iframe title="Vista previa del documento PDF" src={previewUrl} className="w-full border-1 surface-border border-round surface-0" style={{ height: '48rem' }} />
              )}

              <div
                ref={wordPreviewRef}
                className={outputFormat === 'docx' && markdown.trim() ? 'w-full border-1 surface-border border-round' : 'hidden'}
                style={{ height: '48rem', overflow: 'auto', backgroundColor: '#d5d5d5' }}
                aria-label="Vista previa del documento Word"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownConversor;
