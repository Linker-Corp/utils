import React, { useEffect, useMemo, useRef, useState } from 'react';
import UPNG from 'upng-js';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useNavigate } from 'react-router-dom';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const PRESETS = {
  recommended: {
    label: 'Recomendada',
    description: 'Buena calidad y buena compresion.',
    imageQuality: 0.82,
    minImageQuality: 0.62,
    pngColors: 192,
    maxDimension: 2400
  },
  less: {
    label: 'Compresion baja',
    description: 'Alta calidad, menor reduccion.',
    imageQuality: 0.9,
    minImageQuality: 0.74,
    pngColors: 256,
    maxDimension: 3200
  },
  extreme: {
    label: 'Compresion extrema',
    description: 'Menos calidad, mayor compresion.',
    imageQuality: 0.68,
    minImageQuality: 0.46,
    pngColors: 96,
    maxDimension: 1800
  }
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

const compressionLabel = (original, compressed) => {
  if (!original || !compressed) return '0%';
  const value = ((original - compressed) / original) * 100;
  return `${value >= 0 ? '-' : '+'}${Math.abs(value).toFixed(1)}%`;
};

const fileBaseName = (name) => name.replace(/\.[^.]+$/, '');

const fileExtension = (name) => {
  const match = name.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'archivo';
};

const mimeToExtension = (mime) => {
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/png') return 'png';
  return 'jpg';
};

const canvasToBlob = (canvas, mimeType, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error('No se pudo exportar la imagen.'));
  }, mimeType, quality);
});

const canvasToPngBlob = (canvas, colors) => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const buffer = UPNG.encode([imageData.data.buffer], canvas.width, canvas.height, colors);
  return new Blob([buffer], { type: 'image/png' });
};

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => resolve({ image, url });
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('No se pudo abrir la imagen.'));
  };
  image.src = url;
});

const drawImageToCanvas = (image, maxDimension) => {
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  return { canvas, width, height };
};

const hasTransparency = (canvas) => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) return true;
  }

  return false;
};

const prepareCanvasForMime = (sourceCanvas, mimeType) => {
  if (mimeType !== 'image/jpeg') return sourceCanvas;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(sourceCanvas, 0, 0);

  return canvas;
};

const getCandidateMimeTypes = (file, outputFormat, transparent) => {
  if (outputFormat === 'webp') return ['image/webp'];
  if (outputFormat === 'jpeg') return ['image/jpeg'];
  if (outputFormat === 'png') return ['image/png'];

  if (outputFormat === 'source') {
    return IMAGE_TYPES.includes(file.type) ? [file.type] : ['image/webp', 'image/jpeg'];
  }

  return transparent
    ? ['image/webp', 'image/png']
    : ['image/webp', 'image/jpeg'];
};

const getQualitySteps = (quality, minimum) => {
  const middle = Math.max(minimum, quality - ((quality - minimum) / 2));
  return [...new Set([quality, middle, minimum].map((value) => Number(value.toFixed(2))))];
};

const buildOriginalResult = (file, width, height) => ({
  blob: file,
  outputName: `${fileBaseName(file.name)}-original.${fileExtension(file.name)}`,
  details: `${width} x ${height}px - original conservado porque ya era mas pequeno`
});

const buildImageCandidates = async (file, canvas, width, height, options, mimeType) => {
  if (mimeType === 'image/png') {
    const blob = canvasToPngBlob(canvas, options.pngColors);

    return [{
      blob,
      outputName: `${fileBaseName(file.name)}-comprimido.png`,
      details: `${width} x ${height}px - PNG ${options.pngColors} colores`
    }];
  }

  const exportCanvas = prepareCanvasForMime(canvas, mimeType);
  const qualities = getQualitySteps(options.imageQuality, options.minImageQuality);
  const extension = mimeToExtension(mimeType).toUpperCase();
  const candidates = [];

  for (const quality of qualities) {
    const blob = await canvasToBlob(exportCanvas, mimeType, quality);

    if (blob.type === mimeType) {
      candidates.push({
        blob,
        outputName: `${fileBaseName(file.name)}-comprimido.${mimeToExtension(mimeType)}`,
        details: `${width} x ${height}px - ${extension} calidad ${Math.round(quality * 100)}%`
      });
    }
  }

  return candidates;
};

const compressImage = async (file, options) => {
  const loaded = await loadImage(file);

  try {
    const { canvas, width, height } = drawImageToCanvas(loaded.image, options.maxDimension);
    const transparent = hasTransparency(canvas);
    const candidates = [];
    const candidateTypes = getCandidateMimeTypes(file, options.outputFormat, transparent);

    for (const mimeType of candidateTypes) {
      candidates.push(...await buildImageCandidates(file, canvas, width, height, options, mimeType));
    }

    if (!candidates.length) {
      return buildOriginalResult(file, width, height);
    }

    const best = candidates.reduce((smallest, candidate) => (
      candidate.blob.size < smallest.blob.size ? candidate : smallest
    ));

    return options.outputFormat !== 'auto' || best.blob.size < file.size
      ? best
      : buildOriginalResult(file, width, height);
  } finally {
    URL.revokeObjectURL(loaded.url);
  }
};

const isSupportedImage = (file) => file.type.startsWith('image/');

const FileCompressor = () => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const fileInputRef = useRef(null);
  const resultUrlsRef = useRef([]);

  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeFile, setActiveFile] = useState('');
  const [presetKey, setPresetKey] = useState('recommended');
  const [outputFormat, setOutputFormat] = useState('source');

  const preset = PRESETS[presetKey];
  const totalInputBytes = useMemo(() => files.reduce((sum, item) => sum + item.file.size, 0), [files]);
  const totalOutputBytes = useMemo(() => results.reduce((sum, result) => sum + result.blob.size, 0), [results]);

  useEffect(() => () => {
    resultUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => () => {
    files.forEach((file) => {
      if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
    });
  }, [files]);

  const clearResults = () => {
    resultUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    resultUrlsRef.current = [];
    setResults([]);
    setProgress(0);
    setActiveFile('');
  };

  const handleFiles = (fileList) => {
    const nextFiles = Array.from(fileList || [])
      .filter(isSupportedImage)
      .map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));

    if (!nextFiles.length) {
      toast.current.show({ severity: 'warn', summary: 'Formato no compatible', detail: 'Selecciona imagenes JPG, PNG o WEBP.', life: 3000 });
      return;
    }

    files.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    clearResults();
    setFiles(nextFiles);
    toast.current.show({ severity: 'success', summary: 'Imagenes listas', detail: `${nextFiles.length} imagen(es) cargada(s).`, life: 3000 });
  };

  const processFiles = async () => {
    if (!files.length) {
      toast.current.show({ severity: 'warn', summary: 'Sin imagenes', detail: 'Carga al menos una imagen.', life: 3000 });
      return;
    }

    clearResults();
    setProcessing(true);
    setProgress(0);

    const completed = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const { file } = files[index];
        setActiveFile(file.name);

        const output = await compressImage(file, {
          outputFormat,
          imageQuality: preset.imageQuality,
          minImageQuality: preset.minImageQuality,
          pngColors: preset.pngColors,
          maxDimension: preset.maxDimension
        });
        const url = URL.createObjectURL(output.blob);
        resultUrlsRef.current.push(url);

        completed.push({
          id: `${file.name}-${file.lastModified}-${index}`,
          inputName: file.name,
          inputBytes: file.size,
          type: 'Imagen',
          ...output,
          url
        });

        setResults([...completed]);
        setProgress(Math.round(((index + 1) / files.length) * 100));
      }

      toast.current.show({ severity: 'success', summary: 'Compresion lista', detail: 'Las imagenes estan listas para descargar.', life: 3000 });
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message || 'No se pudo comprimir la imagen.', life: 4000 });
    } finally {
      setProcessing(false);
      setActiveFile('');
    }
  };

  const downloadResult = (result) => {
    const anchor = document.createElement('a');
    anchor.href = result.url;
    anchor.download = result.outputName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="flex justify-content-center p-4">
      <Toast ref={toast} />

      <div className="surface-card p-5 shadow-3 border-round w-full max-w-6xl">
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-4">
          <div className="flex align-items-center">
            <Button icon="pi pi-arrow-left" text rounded severity="secondary" onClick={() => navigate('/')} className="mr-3" />
            <h2 className="m-0 text-2xl md:text-3xl font-bold flex align-items-center">
              <i className="pi pi-images mr-3 text-green-500" style={{ fontSize: '2rem' }}></i>
              <span>Compresor de imagenes</span>
            </h2>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button label="Comprimir" icon="pi pi-bolt" loading={processing} disabled={!files.length} onClick={processFiles} />
            <Button label="Cambiar imagenes" icon="pi pi-upload" outlined severity="secondary" onClick={() => fileInputRef.current?.click()} />
          </div>
        </div>

        <p className="text-color-secondary mb-5">
          Reduce el peso de JPG, PNG y WEBP en el navegador. Las imagenes no se suben a ningun servidor.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <div
          className={`border-2 border-dashed border-round p-5 text-center mb-5 transition-colors transition-duration-200 ${dragActive ? 'border-green-500 surface-100' : 'surface-border surface-50'}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <i className="pi pi-cloud-upload text-green-500 mb-3" style={{ fontSize: '3rem' }}></i>
          <div className="text-xl font-semibold mb-2">Selecciona o arrastra imagenes</div>
          <div className="text-color-secondary mb-4">JPG, PNG, WEBP y otros formatos compatibles con el navegador.</div>
          <Button label="Elegir imagenes" icon="pi pi-upload" loading={processing} onClick={() => fileInputRef.current?.click()} />
        </div>

        <div className="grid">
          <div className="col-12 lg:col-4">
            <div className="surface-50 border-round p-4 mb-4">
              <h3 className="mt-0 mb-4 text-xl">Calidad</h3>
              <div className="flex flex-column gap-3">
                {Object.entries(PRESETS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    className={`p-3 border-round surface-0 cursor-pointer text-left border-1 transition-colors transition-duration-200 ${presetKey === key ? 'border-green-500' : 'surface-border'}`}
                    onClick={() => setPresetKey(key)}
                    style={{ appearance: 'none' }}
                  >
                    <div className="flex align-items-center justify-content-between gap-3">
                      <span className="font-semibold text-color">{item.label}</span>
                      {presetKey === key && <i className="pi pi-check text-green-500"></i>}
                    </div>
                    <div className="text-sm text-color-secondary mt-2 line-height-3">{item.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="surface-50 border-round p-4">
              <h3 className="mt-0 mb-4 text-xl">Salida</h3>
              <label htmlFor="image-output-format" className="font-medium block mb-2">Formato</label>
              <select
                id="image-output-format"
                value={outputFormat}
                onChange={(event) => setOutputFormat(event.target.value)}
                className="p-inputtext p-component w-full"
              >
                <option value="auto">Automatico inteligente</option>
                <option value="webp">WEBP recomendado</option>
                <option value="jpeg">JPG compatible</option>
                <option value="png">PNG comprimido</option>
                <option value="source">Mismo formato comprimido</option>
              </select>
              <div className="text-sm text-color-secondary line-height-3 mt-3">
                Automatico descarga el mas liviano. JPG, PNG y WEBP fuerzan ese formato.
              </div>
            </div>
          </div>

          <div className="col-12 lg:col-8">
            <div className="surface-50 border-round p-4 mb-4">
              <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
                <div>
                  <h3 className="mt-0 mb-2 text-xl">Imagenes cargadas</h3>
                  <div className="text-color-secondary">{files.length ? `${files.length} imagen(es), ${formatBytes(totalInputBytes)}` : 'Aun no hay imagenes seleccionadas.'}</div>
                </div>
                {processing && (
                  <div className="md:text-right">
                    <div className="font-semibold mb-2">{progress}%</div>
                    <div className="text-sm text-color-secondary">{activeFile}</div>
                  </div>
                )}
              </div>

              {files.length > 0 && (
                <div className="flex flex-column gap-2 mt-4">
                  {files.map((file, index) => (
                    <div key={`${file.file.name}-${file.file.lastModified}-${index}`} className="flex align-items-center justify-content-between gap-3 border-top-1 surface-border py-3">
                      <div className="flex align-items-center gap-3 min-w-0">
                        <img
                          src={file.previewUrl}
                          alt={`Vista previa de ${file.file.name}`}
                          className="border-round flex-shrink-0"
                          style={{ width: '56px', height: '56px', objectFit: 'cover', background: 'var(--surface-ground)' }}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-overflow-ellipsis overflow-hidden white-space-nowrap">{file.file.name}</div>
                          <div className="text-sm text-color-secondary">Imagen - {formatBytes(file.file.size)}</div>
                        </div>
                      </div>
                      <i className="pi pi-image text-green-500 text-xl flex-shrink-0"></i>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div className="surface-50 border-round p-4">
                <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-3">
                  <div>
                    <h3 className="mt-0 mb-2 text-xl">Resultados</h3>
                    <div className="text-color-secondary">
                      {formatBytes(totalInputBytes)} a {formatBytes(totalOutputBytes)} ({compressionLabel(totalInputBytes, totalOutputBytes)})
                    </div>
                  </div>
                </div>

                <div className="flex flex-column gap-3">
                  {results.map((result) => (
                    <div key={result.id} className="surface-0 border-1 surface-border border-round p-3">
                      <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-overflow-ellipsis overflow-hidden white-space-nowrap">{result.outputName}</div>
                          <div className="text-sm text-color-secondary mt-1">
                            Imagen - {formatBytes(result.inputBytes)} a {formatBytes(result.blob.size)} ({compressionLabel(result.inputBytes, result.blob.size)}) - {result.details}
                          </div>
                        </div>
                        <Button label="Descargar" icon="pi pi-download" severity="success" className="w-full md:w-auto flex-shrink-0" onClick={() => downloadResult(result)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileCompressor;
