import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useNavigate } from 'react-router-dom';

const DEFAULT_LOGO_COLOR = '#2563eb';
const DEFAULT_REMOVE_COLOR = '#ffffff';
const DEFAULT_CANVAS_BACKGROUND = '#ffffff';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const parseHexColor = (value) => {
  const clean = value.replace('#', '').trim();
  const hex = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;

  if (!/^[\dA-Fa-f]{6}$/.test(hex)) return [255, 255, 255];

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ];
};

const colorDistance = (red, green, blue, target) => (
  Math.sqrt(
    ((red - target[0]) ** 2)
    + ((green - target[1]) ** 2)
    + ((blue - target[2]) ** 2)
  )
);

const averageEdgeBackground = (data, width, height) => {
  const stride = Math.max(1, Math.floor(Math.min(width, height) / 80));
  const colors = [];

  for (let x = 0; x < width; x += stride) {
    const top = x * 4;
    const bottom = (((height - 1) * width) + x) * 4;

    if (data[top + 3] > 0) colors.push([data[top], data[top + 1], data[top + 2]]);
    if (data[bottom + 3] > 0) colors.push([data[bottom], data[bottom + 1], data[bottom + 2]]);
  }

  for (let y = 0; y < height; y += stride) {
    const left = (y * width) * 4;
    const right = ((y * width) + (width - 1)) * 4;

    if (data[left + 3] > 0) colors.push([data[left], data[left + 1], data[left + 2]]);
    if (data[right + 3] > 0) colors.push([data[right], data[right + 1], data[right + 2]]);
  }

  if (!colors.length) return [255, 255, 255];

  return [0, 1, 2].map((channel) => (
    Math.round(colors.reduce((sum, color) => sum + color[channel], 0) / colors.length)
  ));
};

const removeBackgroundPixels = (data, targetColor, tolerance) => {
  const feather = Math.max(24, Math.round(tolerance * 0.7));

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    if (alpha === 0) continue;

    const distance = colorDistance(data[index], data[index + 1], data[index + 2], targetColor);

    if (distance <= tolerance) {
      data[index + 3] = 0;
      continue;
    }

    if (distance <= tolerance + feather) {
      const keepRatio = clamp((distance - tolerance) / feather, 0, 1);
      data[index + 3] = Math.round(alpha * keepRatio);
    }
  }
};

const pixelLuma = (red, green, blue) => (
  ((red * 0.2126) + (green * 0.7152) + (blue * 0.0722)) / 255
);

const getAlphaBounds = (data, width, height) => {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[((y * width) + x) * 4 + 3];
      if (alpha === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) return null;
  return { left, top, right, bottom };
};

const loadImageFromFile = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => resolve({ image, url });
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('No se pudo cargar la imagen.'));
  };
  image.src = url;
});

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error('No se pudo exportar la imagen.'));
  }, 'image/png');
});

const processImage = async (image, options) => {
  const sourceCanvas = document.createElement('canvas');
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  sourceCanvas.width = image.naturalWidth;
  sourceCanvas.height = image.naturalHeight;
  sourceContext.drawImage(image, 0, 0);

  const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const { data, width, height } = imageData;
  const removeColor = options.backgroundMode === 'auto'
    ? averageEdgeBackground(data, width, height)
    : parseHexColor(options.removeColor);
  const logoColor = parseHexColor(options.logoColor);

  if (options.removeBackground) {
    removeBackgroundPixels(data, removeColor, options.tolerance);
  }

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    if (alpha === 0) continue;

    let nextAlpha = alpha;

    if (options.makeMonochrome) {
      if (options.useLumaAlpha) {
        const luma = pixelLuma(data[index], data[index + 1], data[index + 2]);
        nextAlpha = Math.round(nextAlpha * (0.62 + ((1 - luma) * 0.38)));
      }

      data[index] = logoColor[0];
      data[index + 1] = logoColor[1];
      data[index + 2] = logoColor[2];
    }

    data[index + 3] = nextAlpha;
  }

  sourceContext.putImageData(imageData, 0, 0);

  let renderCanvas = sourceCanvas;

  if (options.trim) {
    const bounds = getAlphaBounds(data, width, height);

    if (bounds) {
      const padding = options.padding;
      const left = Math.max(0, bounds.left - padding);
      const top = Math.max(0, bounds.top - padding);
      const right = Math.min(width - 1, bounds.right + padding);
      const bottom = Math.min(height - 1, bounds.bottom + padding);
      const trimCanvas = document.createElement('canvas');
      const trimContext = trimCanvas.getContext('2d');
      trimCanvas.width = right - left + 1;
      trimCanvas.height = bottom - top + 1;
      trimContext.drawImage(
        sourceCanvas,
        left,
        top,
        trimCanvas.width,
        trimCanvas.height,
        0,
        0,
        trimCanvas.width,
        trimCanvas.height
      );
      renderCanvas = trimCanvas;
    }
  }

  if (options.solidBackground) {
    const backgroundCanvas = document.createElement('canvas');
    const backgroundContext = backgroundCanvas.getContext('2d');
    backgroundCanvas.width = renderCanvas.width;
    backgroundCanvas.height = renderCanvas.height;
    backgroundContext.fillStyle = options.canvasBackground;
    backgroundContext.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    backgroundContext.drawImage(renderCanvas, 0, 0);
    renderCanvas = backgroundCanvas;
  }

  return {
    blob: await canvasToBlob(renderCanvas),
    width: renderCanvas.width,
    height: renderCanvas.height
  };
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

const checkerboardStyle = {
  backgroundColor: 'var(--surface-ground)',
  backgroundImage: 'linear-gradient(45deg, rgba(120,120,120,.18) 25%, transparent 25%), linear-gradient(-45deg, rgba(120,120,120,.18) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(120,120,120,.18) 75%), linear-gradient(-45deg, transparent 75%, rgba(120,120,120,.18) 75%)',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
  backgroundSize: '16px 16px'
};

const BackgroundRemover = () => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const fileInputRef = useRef(null);
  const sourceUrlRef = useRef('');
  const resultUrlRef = useRef('');
  const renderIdRef = useRef(0);

  const [fileInfo, setFileInfo] = useState(null);
  const [sourceImage, setSourceImage] = useState(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [resultBlob, setResultBlob] = useState(null);
  const [resultSize, setResultSize] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [backgroundMode, setBackgroundMode] = useState('auto');
  const [removeColor, setRemoveColor] = useState(DEFAULT_REMOVE_COLOR);
  const [tolerance, setTolerance] = useState(64);
  const [makeMonochrome, setMakeMonochrome] = useState(true);
  const [logoColor, setLogoColor] = useState(DEFAULT_LOGO_COLOR);
  const [useLumaAlpha, setUseLumaAlpha] = useState(false);
  const [solidBackground, setSolidBackground] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState(DEFAULT_CANVAS_BACKGROUND);
  const [trim, setTrim] = useState(false);
  const [padding, setPadding] = useState(18);

  useEffect(() => () => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const hasImage = Boolean(sourceImage);

  const outputName = useMemo(() => {
    if (!fileInfo?.name) return 'imagen-normalizada.png';
    return `${fileInfo.name.replace(/\.[^.]+$/, '')}-normalizada.png`;
  }, [fileInfo]);

  const clearResult = useCallback(() => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = '';
    setResultUrl('');
    setResultBlob(null);
    setResultSize(null);
  }, []);

  const resetImage = useCallback(() => {
    renderIdRef.current += 1;
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = '';
    setSourceUrl('');
    setSourceImage(null);
    setFileInfo(null);
    clearResult();
  }, [clearResult]);

  const handleFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.current.show({ severity: 'warn', summary: 'Archivo invalido', detail: 'Selecciona una imagen compatible.', life: 3000 });
      return;
    }

    setProcessing(true);
    resetImage();

    try {
      const loaded = await loadImageFromFile(file);
      sourceUrlRef.current = loaded.url;
      setSourceImage(loaded.image);
      setSourceUrl(loaded.url);
      setFileInfo({
        name: file.name,
        size: formatBytes(file.size),
        type: file.type || 'Imagen',
        width: loaded.image.naturalWidth,
        height: loaded.image.naturalHeight
      });
      toast.current.show({ severity: 'success', summary: 'Imagen lista', detail: 'Ajusta las opciones y genera el PNG.', life: 3000 });
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir la imagen.', life: 3000 });
    } finally {
      setProcessing(false);
    }
  };

  const generateResult = useCallback(async (showToast = false) => {
    if (!sourceImage) {
      if (showToast) {
        toast.current.show({ severity: 'warn', summary: 'Sin imagen', detail: 'Carga una imagen primero.', life: 3000 });
      }
      return;
    }

    const renderId = renderIdRef.current + 1;
    renderIdRef.current = renderId;
    setProcessing(true);
    clearResult();

    try {
      const result = await processImage(sourceImage, {
        removeBackground,
        backgroundMode,
        removeColor,
        tolerance,
        makeMonochrome,
        logoColor,
        useLumaAlpha,
        solidBackground,
        canvasBackground,
        trim,
        padding
      });
      const url = URL.createObjectURL(result.blob);

      if (renderId !== renderIdRef.current) {
        URL.revokeObjectURL(url);
        return;
      }

      resultUrlRef.current = url;
      setResultBlob(result.blob);
      setResultUrl(url);
      setResultSize({ width: result.width, height: result.height, bytes: result.blob.size });

      if (showToast) {
        toast.current.show({ severity: 'success', summary: 'PNG generado', detail: 'La imagen normalizada esta lista.', life: 3000 });
      }
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo normalizar la imagen.', life: 3000 });
    } finally {
      if (renderId === renderIdRef.current) setProcessing(false);
    }
  }, [
    backgroundMode,
    canvasBackground,
    clearResult,
    logoColor,
    makeMonochrome,
    padding,
    removeBackground,
    removeColor,
    solidBackground,
    sourceImage,
    tolerance,
    trim,
    useLumaAlpha
  ]);

  useEffect(() => {
    if (!sourceImage) return undefined;

    const timer = window.setTimeout(() => {
      generateResult(false);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [generateResult, sourceImage]);

  const handleProcess = () => {
    if (!sourceImage) {
      toast.current.show({ severity: 'warn', summary: 'Sin imagen', detail: 'Carga una imagen primero.', life: 3000 });
      return;
    }

    generateResult(true);
  };

  const handleDownload = () => {
    if (!resultBlob) return;

    const anchor = document.createElement('a');
    anchor.href = resultUrl;
    anchor.download = outputName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex justify-content-center p-4">
      <Toast ref={toast} />

      <div className="surface-card p-5 shadow-3 border-round w-full max-w-6xl">
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-4">
          <div className="flex align-items-center">
            <Button icon="pi pi-arrow-left" text rounded severity="secondary" onClick={() => navigate('/')} className="mr-3" />
            <h2 className="m-0 text-2xl md:text-3xl font-bold flex align-items-center">
              <i className="pi pi-sliders-h mr-3 text-purple-500" style={{ fontSize: '2rem' }}></i>
              <span>Background Remover</span>
            </h2>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button label="Generar PNG" icon="pi pi-sync" loading={processing} disabled={!hasImage} onClick={handleProcess} />
            <Button label="Descargar" icon="pi pi-download" severity="success" disabled={!resultBlob} onClick={handleDownload} />
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        {!hasImage && (
          <div
            className={`border-2 border-dashed border-round p-5 text-center transition-colors transition-duration-200 ${dragActive ? 'border-purple-500 surface-100' : 'surface-border surface-50'}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <i className="pi pi-image text-purple-500 mb-3" style={{ fontSize: '3rem' }}></i>
            <div className="text-xl font-semibold mb-2">Selecciona o arrastra una imagen</div>
            <div className="text-color-secondary mb-4">PNG, JPG, WEBP y otros formatos compatibles con el navegador.</div>
            <Button label="Elegir archivo" icon="pi pi-upload" loading={processing} onClick={() => fileInputRef.current?.click()} />
          </div>
        )}

        {hasImage && (
          <div className="grid">
            <div className="col-12 lg:col-4">
              <div className="surface-50 border-round p-4 mb-4">
                <div className="flex justify-content-between align-items-center gap-3 mb-3">
                  <h3 className="m-0 text-xl">Archivo</h3>
                  <Button icon="pi pi-refresh" text rounded severity="secondary" aria-label="Cambiar imagen" onClick={() => fileInputRef.current?.click()} />
                </div>
                <div className="flex flex-column gap-3">
                  <div><span className="font-semibold">Nombre:</span> <span className="text-color-secondary">{fileInfo.name}</span></div>
                  <div><span className="font-semibold">Tipo:</span> <span className="text-color-secondary">{fileInfo.type}</span></div>
                  <div><span className="font-semibold">Tamano:</span> <span className="text-color-secondary">{fileInfo.size}</span></div>
                  <div><span className="font-semibold">Dimensiones:</span> <span className="text-color-secondary">{fileInfo.width} x {fileInfo.height}px</span></div>
                </div>
              </div>

              <div className="surface-50 border-round p-4">
                <h3 className="mt-0 mb-4 text-xl">Opciones</h3>

                <div className="flex flex-column gap-4">
                  <label className="flex align-items-center gap-2 font-medium">
                    <input type="checkbox" checked={removeBackground} onChange={(event) => setRemoveBackground(event.target.checked)} />
                    Remover fondo
                  </label>

                  {removeBackground && (
                    <>
                      <div>
                        <label htmlFor="background-mode" className="font-medium block mb-2">Color a remover</label>
                        <select
                          id="background-mode"
                          value={backgroundMode}
                          onChange={(event) => setBackgroundMode(event.target.value)}
                          className="p-inputtext p-component w-full"
                        >
                          <option value="auto">Automatico desde esquinas</option>
                          <option value="manual">Elegir color</option>
                        </select>
                      </div>

                      {backgroundMode === 'manual' && (
                        <div>
                          <label htmlFor="remove-color" className="font-medium block mb-2">Fondo original</label>
                          <div className="flex align-items-center gap-3">
                            <input id="remove-color" type="color" value={removeColor} onChange={(event) => setRemoveColor(event.target.value)} />
                            <input className="p-inputtext p-component w-full" value={removeColor} onChange={(event) => setRemoveColor(event.target.value)} />
                          </div>
                        </div>
                      )}

                      <div>
                        <label htmlFor="tolerance" className="font-medium block mb-2">Tolerancia: {tolerance}</label>
                        <input
                          id="tolerance"
                          type="range"
                          min="0"
                          max="160"
                          value={tolerance}
                          onChange={(event) => setTolerance(Number(event.target.value))}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  <label className="flex align-items-center gap-2 font-medium">
                    <input type="checkbox" checked={makeMonochrome} onChange={(event) => setMakeMonochrome(event.target.checked)} />
                    Convertir a un solo color
                  </label>

                  {makeMonochrome && (
                    <>
                      <div>
                        <label htmlFor="logo-color" className="font-medium block mb-2">Color de la imagen</label>
                        <div className="flex align-items-center gap-3">
                          <input id="logo-color" type="color" value={logoColor} onChange={(event) => setLogoColor(event.target.value)} />
                          <input className="p-inputtext p-component w-full" value={logoColor} onChange={(event) => setLogoColor(event.target.value)} />
                        </div>
                      </div>

                      <label className="flex align-items-center gap-2 text-color-secondary">
                        <input type="checkbox" checked={useLumaAlpha} onChange={(event) => setUseLumaAlpha(event.target.checked)} />
                        Usar luminosidad como detalle de opacidad
                      </label>
                    </>
                  )}

                  <label className="flex align-items-center gap-2 font-medium">
                    <input type="checkbox" checked={solidBackground} onChange={(event) => setSolidBackground(event.target.checked)} />
                    Poner fondo solido
                  </label>

                  {solidBackground && (
                    <div>
                      <label htmlFor="canvas-background" className="font-medium block mb-2">Color del fondo final</label>
                      <div className="flex align-items-center gap-3">
                        <input id="canvas-background" type="color" value={canvasBackground} onChange={(event) => setCanvasBackground(event.target.value)} />
                        <input className="p-inputtext p-component w-full" value={canvasBackground} onChange={(event) => setCanvasBackground(event.target.value)} />
                      </div>
                    </div>
                  )}

                  <label className="flex align-items-center gap-2 font-medium">
                    <input type="checkbox" checked={trim} onChange={(event) => setTrim(event.target.checked)} />
                    Recortar margenes transparentes
                  </label>

                  {trim && (
                    <div>
                      <label htmlFor="padding" className="font-medium block mb-2">Padding: {padding}px</label>
                      <input
                        id="padding"
                        type="range"
                        min="0"
                        max="120"
                        value={padding}
                        onChange={(event) => setPadding(Number(event.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 lg:col-8">
              <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="surface-50 border-round p-3 h-full">
                    <h3 className="mt-0 mb-3 text-xl">Original</h3>
                    <div className="border-round p-3 flex align-items-center justify-content-center" style={{ ...checkerboardStyle, minHeight: '320px' }}>
                      <img src={sourceUrl} alt="Original" className="max-w-full" style={{ maxHeight: '420px', objectFit: 'contain' }} />
                    </div>
                  </div>
                </div>

                <div className="col-12 md:col-6">
                  <div className="surface-50 border-round p-3 h-full">
                    <div className="flex justify-content-between align-items-center gap-3 mb-3">
                      <h3 className="m-0 text-xl">Resultado</h3>
                      {resultSize && (
                        <span className="text-sm text-color-secondary">{resultSize.width} x {resultSize.height}px</span>
                      )}
                    </div>
                    <div className="border-round p-3 flex align-items-center justify-content-center" style={{ ...checkerboardStyle, minHeight: '320px' }}>
                      {resultUrl ? (
                        <img src={resultUrl} alt="Resultado normalizado" className="max-w-full" style={{ maxHeight: '420px', objectFit: 'contain' }} />
                      ) : (
                        <div className="text-center text-color-secondary">
                          <i className="pi pi-arrow-left mb-3" style={{ fontSize: '2rem' }}></i>
                          <div>Genera el PNG para ver el resultado.</div>
                        </div>
                      )}
                    </div>
                    {resultSize && (
                      <div className="text-color-secondary text-sm mt-3">
                        PNG final: {formatBytes(resultSize.bytes)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundRemover;
