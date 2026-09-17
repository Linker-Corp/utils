import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useNavigate } from 'react-router-dom';

const TIFF_TYPES = {
  1: { name: 'BYTE', size: 1 },
  2: { name: 'ASCII', size: 1 },
  3: { name: 'SHORT', size: 2 },
  4: { name: 'LONG', size: 4 },
  5: { name: 'RATIONAL', size: 8 },
  7: { name: 'UNDEFINED', size: 1 },
  9: { name: 'SLONG', size: 4 },
  10: { name: 'SRATIONAL', size: 8 }
};

const TAG_NAMES = {
  0x010e: 'Descripcion',
  0x010f: 'Fabricante',
  0x0110: 'Modelo',
  0x0112: 'Orientacion',
  0x011a: 'Resolucion X',
  0x011b: 'Resolucion Y',
  0x0128: 'Unidad de resolucion',
  0x0131: 'Software',
  0x0132: 'Fecha de modificacion',
  0x013b: 'Autor',
  0x8298: 'Copyright',
  0x829a: 'Tiempo de exposicion',
  0x829d: 'Apertura',
  0x8827: 'ISO',
  0x9003: 'Fecha original',
  0x9004: 'Fecha digitalizada',
  0x9201: 'Velocidad de obturacion',
  0x9202: 'Apertura APEX',
  0x9204: 'Compensacion de exposicion',
  0x9207: 'Modo de medicion',
  0x9209: 'Flash',
  0x920a: 'Distancia focal',
  0xa002: 'Ancho EXIF',
  0xa003: 'Alto EXIF',
  0xa217: 'Tipo de sensor',
  0xa403: 'Balance de blancos',
  0xa405: 'Focal equivalente 35mm',
  0xa406: 'Tipo de escena',
  0xa434: 'Lente'
};

const GPS_TAG_NAMES = {
  0x0001: 'Referencia latitud',
  0x0002: 'Latitud',
  0x0003: 'Referencia longitud',
  0x0004: 'Longitud',
  0x0005: 'Referencia altitud',
  0x0006: 'Altitud',
  0x0007: 'Hora GPS',
  0x001d: 'Fecha GPS'
};

const ORIENTATION = {
  1: 'Normal',
  2: 'Espejo horizontal',
  3: 'Rotada 180',
  4: 'Espejo vertical',
  5: 'Espejo horizontal y rotada 270',
  6: 'Rotada 90',
  7: 'Espejo horizontal y rotada 90',
  8: 'Rotada 270'
};

const METERING_MODE = {
  0: 'Desconocido',
  1: 'Promedio',
  2: 'Centro ponderado',
  3: 'Puntual',
  4: 'Multi-punto',
  5: 'Patron',
  6: 'Parcial'
};

const WHITE_BALANCE = {
  0: 'Automatico',
  1: 'Manual'
};

const SCENE_CAPTURE = {
  0: 'Estandar',
  1: 'Paisaje',
  2: 'Retrato',
  3: 'Escena nocturna'
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

const getTagName = (tag, section) => {
  const names = section === 'GPS' ? GPS_TAG_NAMES : TAG_NAMES;
  return names[tag] || `Tag 0x${tag.toString(16).padStart(4, '0')}`;
};

const isRational = (value) => value && typeof value === 'object' && 'numerator' in value && 'denominator' in value;

const rationalToNumber = (value) => {
  if (!isRational(value) || value.denominator === 0) return Number.NaN;
  return value.numerator / value.denominator;
};

const formatRational = (value) => {
  const decimal = rationalToNumber(value);
  if (!Number.isFinite(decimal)) return `${value.numerator}/${value.denominator}`;
  if (value.numerator === 1 && value.denominator > 1) return `1/${value.denominator} (${decimal.toFixed(4)})`;
  return Number.isInteger(decimal) ? `${decimal}` : decimal.toFixed(4);
};

const formatExposureTime = (value) => (
  value.numerator === 1 ? `1/${value.denominator} s` : `${formatRational(value)} s`
);

const formatFiniteRational = (value, formatter) => {
  const number = rationalToNumber(value);
  return Number.isFinite(number) ? formatter(number) : formatRational(value);
};

const RATIONAL_FORMATTERS = {
  0x829a: formatExposureTime,
  0x829d: (value) => formatFiniteRational(value, (number) => `f/${number.toFixed(1)}`),
  0x920a: (value) => formatFiniteRational(value, (number) => `${number.toFixed(1)} mm`),
  0x9204: (value) => formatFiniteRational(value, (number) => `${number.toFixed(2)} EV`)
};

const GPS_RATIONAL_FORMATTERS = {
  0x0006: (value) => formatFiniteRational(value, (number) => `${number.toFixed(2)} m`)
};

const VALUE_LABELS = {
  0x0112: ORIENTATION,
  0x9207: METERING_MODE,
  0xa403: WHITE_BALANCE,
  0xa406: SCENE_CAPTURE
};

const SIMPLE_FORMATTERS = {
  0x9209: (value) => (Number(value) === 0 ? 'No disparado' : `Disparado (${value})`),
  0x0128: (value) => (Number(value) === 2 ? 'Pulgadas' : String(value))
};

const formatArrayValue = (value) => (
  value.map((item) => (isRational(item) ? formatRational(item) : String(item))).join(', ')
);

const getRationalFormatter = (tag, section) => (
  section === 'GPS' ? GPS_RATIONAL_FORMATTERS[tag] : RATIONAL_FORMATTERS[tag]
);

const formatExifValue = (tag, value, section) => {
  if (Array.isArray(value)) return formatArrayValue(value);

  if (isRational(value)) {
    const formatter = getRationalFormatter(tag, section);
    return formatter ? formatter(value) : formatRational(value);
  }

  const labels = VALUE_LABELS[tag];
  if (labels) return labels[value] || String(value);

  const formatter = SIMPLE_FORMATTERS[tag];
  if (formatter) return formatter(value);

  return String(value);
};

const readAscii = (view, start, length) => {
  let text = '';
  for (let i = 0; i < length; i += 1) {
    const charCode = view.getUint8(start + i);
    if (charCode === 0) break;
    text += String.fromCodePoint(charCode);
  }
  return text.trim();
};

const readExifValue = (view, tiffStart, entryOffset, littleEndian) => {
  const type = view.getUint16(entryOffset + 2, littleEndian);
  const count = view.getUint32(entryOffset + 4, littleEndian);
  const typeInfo = TIFF_TYPES[type];

  if (!typeInfo || count < 1) return null;

  const totalBytes = typeInfo.size * count;
  const valueOffset = totalBytes <= 4
    ? entryOffset + 8
    : tiffStart + view.getUint32(entryOffset + 8, littleEndian);

  const readSingle = (position) => {
    if (type === 1 || type === 7) return view.getUint8(position);
    if (type === 3) return view.getUint16(position, littleEndian);
    if (type === 4) return view.getUint32(position, littleEndian);
    if (type === 5) {
      const numerator = view.getUint32(position, littleEndian);
      const denominator = view.getUint32(position + 4, littleEndian);
      return { numerator, denominator };
    }
    if (type === 9) return view.getInt32(position, littleEndian);
    if (type === 10) {
      const numerator = view.getInt32(position, littleEndian);
      const denominator = view.getInt32(position + 4, littleEndian);
      return { numerator, denominator };
    }
    return null;
  };

  if (type === 2) return readAscii(view, valueOffset, count);

  const values = [];
  for (let index = 0; index < count; index += 1) {
    values.push(readSingle(valueOffset + (index * typeInfo.size)));
  }

  return count === 1 ? values[0] : values;
};

const parseIfd = (view, tiffStart, ifdOffset, littleEndian, section) => {
  if (!ifdOffset) return { rows: [], pointers: {} };

  const absoluteOffset = tiffStart + ifdOffset;
  const entryCount = view.getUint16(absoluteOffset, littleEndian);
  const rows = [];
  const pointers = {};

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = absoluteOffset + 2 + (index * 12);
    const tag = view.getUint16(entryOffset, littleEndian);
    const value = readExifValue(view, tiffStart, entryOffset, littleEndian);

    if (tag === 0x8769) {
      pointers.exif = value;
      continue;
    }

    if (tag === 0x8825) {
      pointers.gps = value;
      continue;
    }

    if (value === null || value === '') continue;

    rows.push({
      section,
      tag: `0x${tag.toString(16).padStart(4, '0')}`,
      label: getTagName(tag, section),
      value: formatExifValue(tag, value, section),
      rawValue: value
    });
  }

  return { rows, pointers };
};

const gpsToDecimal = (coordinate, reference) => {
  if (!Array.isArray(coordinate) || coordinate.length < 3) return null;
  const degrees = rationalToNumber(coordinate[0]);
  const minutes = rationalToNumber(coordinate[1]);
  const seconds = rationalToNumber(coordinate[2]);

  if (![degrees, minutes, seconds].every(Number.isFinite)) return null;

  const sign = reference === 'S' || reference === 'W' ? -1 : 1;
  return sign * (degrees + (minutes / 60) + (seconds / 3600));
};

const extractGps = (rows) => {
  const findRaw = (label) => rows.find((row) => row.label === label)?.rawValue;
  const latitude = gpsToDecimal(findRaw('Latitud'), findRaw('Referencia latitud'));
  const longitude = gpsToDecimal(findRaw('Longitud'), findRaw('Referencia longitud'));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const altitudeValue = findRaw('Altitud');
  const altitude = isRational(altitudeValue) ? rationalToNumber(altitudeValue) : null;

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
    altitude: Number.isFinite(altitude) ? Number(altitude.toFixed(2)) : null
  };
};

const parseExifSegment = (view, segmentStart) => {
  const tiffStart = segmentStart + 6;
  const byteOrder = readAscii(view, tiffStart, 2);
  const littleEndian = byteOrder === 'II';

  if (!littleEndian && byteOrder !== 'MM') {
    return { rows: [], gps: null, warning: 'El bloque EXIF tiene un orden de bytes no reconocido.' };
  }

  const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
  const primary = parseIfd(view, tiffStart, firstIfdOffset, littleEndian, 'Imagen');
  const exif = parseIfd(view, tiffStart, primary.pointers.exif, littleEndian, 'Camara');
  const gps = parseIfd(view, tiffStart, primary.pointers.gps, littleEndian, 'GPS');
  const rows = [...primary.rows, ...exif.rows, ...gps.rows];

  return {
    rows,
    gps: extractGps(gps.rows),
    warning: rows.length ? null : 'No se encontraron campos EXIF legibles en esta fotografía.'
  };
};

const parseExif = (arrayBuffer) => {
  const view = new DataView(arrayBuffer);

  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
    return { rows: [], gps: null, warning: 'El archivo no es JPEG o no contiene segmentos EXIF compatibles.' };
  }

  let offset = 2;

  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = view.getUint8(offset + 1);

    if (marker === 0xda || marker === 0xd9) break;

    const segmentLength = view.getUint16(offset + 2, false);
    const segmentStart = offset + 4;

    if (segmentLength < 2 || offset + 2 + segmentLength > view.byteLength) break;

    if (marker === 0xe1 && readAscii(view, segmentStart, 6) === 'Exif') {
      return parseExifSegment(view, segmentStart);
    }

    offset += 2 + segmentLength;
  }

  return { rows: [], gps: null, warning: 'No se encontró metadata EXIF en esta fotografía.' };
};

const loadImageDetails = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();

  img.onload = () => {
    resolve({ width: img.naturalWidth, height: img.naturalHeight, url });
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('No se pudo cargar la imagen.'));
  };

  img.src = url;
});

const buildJsonPayload = (fileInfo, imageInfo, rows, gps) => ({
  file: fileInfo,
  image: imageInfo ? {
    width: imageInfo.width,
    height: imageInfo.height,
    megapixels: imageInfo.megapixels,
    aspectRatio: imageInfo.aspectRatio
  } : null,
  gps,
  metadata: rows.map(({ section, tag, label, value }) => ({ section, tag, label, value }))
});

const PhotoMetadata = () => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  const [metadataRows, setMetadataRows] = useState([]);
  const [gpsInfo, setGpsInfo] = useState(null);
  const [warning, setWarning] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const groupedMetadata = useMemo(() => metadataRows.reduce((groups, row) => {
    const key = row.section;
    return {
      ...groups,
      [key]: [...(groups[key] || []), row]
    };
  }, {}), [metadataRows]);

  const resetState = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setFileInfo(null);
    setImageInfo(null);
    setMetadataRows([]);
    setGpsInfo(null);
    setWarning('');
  };

  const processFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.current.show({ severity: 'warn', summary: 'Archivo invalido', detail: 'Selecciona una imagen válida.', life: 3000 });
      return;
    }

    setLoading(true);
    resetState();

    try {
      const details = await loadImageDetails(file);
      const arrayBuffer = await file.arrayBuffer();
      const exif = parseExif(arrayBuffer);
      const megapixels = (details.width * details.height) / 1000000;
      const ratio = details.width && details.height ? (details.width / details.height).toFixed(3) : null;

      setPreviewUrl(details.url);
      setFileInfo({
        name: file.name,
        type: file.type || 'Desconocido',
        size: formatBytes(file.size),
        bytes: file.size,
        lastModified: new Date(file.lastModified).toLocaleString()
      });
      setImageInfo({
        width: details.width,
        height: details.height,
        megapixels: `${megapixels.toFixed(2)} MP`,
        aspectRatio: ratio
      });
      setMetadataRows(exif.rows);
      setGpsInfo(exif.gps);
      setWarning(exif.warning || '');

      toast.current.show({
        severity: exif.rows.length ? 'success' : 'info',
        summary: exif.rows.length ? 'Metadata encontrada' : 'Imagen procesada',
        detail: exif.rows.length ? `${exif.rows.length} campos encontrados.` : 'No se encontro EXIF legible.',
        life: 3000
      });
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar la fotografía.', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    processFile(event.dataTransfer.files?.[0]);
  };

  const handleCopyJson = async () => {
    try {
      const payload = buildJsonPayload(fileInfo, imageInfo, metadataRows, gpsInfo);
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.current.show({ severity: 'success', summary: 'Copiado', detail: 'Metadata copiada como JSON.', life: 3000 });
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'El navegador no permitió copiar al portapapeles.', life: 3000 });
    }
  };

  const handleDownloadJson = () => {
    const payload = buildJsonPayload(fileInfo, imageInfo, metadataRows, gpsInfo);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileInfo?.name || 'metadata'}-metadata.json`;
    document.body.appendChild(anchor);
    anchor.click();
    URL.revokeObjectURL(url);
    anchor.remove();
  };

  const hasResult = Boolean(fileInfo);

  return (
    <div className="flex justify-content-center p-4">
      <Toast ref={toast} />

      <div className="surface-card p-5 shadow-3 border-round w-full max-w-6xl">
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-4">
          <div className="flex align-items-center">
            <Button icon="pi pi-arrow-left" text rounded severity="secondary" onClick={() => navigate('/')} className="mr-3" />
            <h2 className="m-0 text-2xl md:text-3xl font-bold flex align-items-center">
              <i className="pi pi-camera mr-3 text-cyan-500" style={{ fontSize: '2rem' }}></i>
              <span>Metadata de Fotografía</span>
            </h2>
          </div>

          {hasResult && (
            <div className="flex gap-2 flex-wrap">
              <Button label="Copiar JSON" icon="pi pi-copy" outlined severity="secondary" onClick={handleCopyJson} />
              <Button label="Descargar JSON" icon="pi pi-download" onClick={handleDownloadJson} />
            </div>
          )}
        </div>

        <p className="text-color-secondary mb-5">
          Extrae información del archivo, dimensiones de imagen y campos EXIF disponibles sin subir la fotografía a ningun servidor.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => processFile(event.target.files?.[0])}
        />

        <div
          className={`border-2 border-dashed border-round p-5 text-center mb-5 transition-colors transition-duration-200 ${dragActive ? 'border-cyan-500 surface-100' : 'surface-border surface-50'}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <i className="pi pi-image text-cyan-500 mb-3" style={{ fontSize: '3rem' }}></i>
          <div className="text-xl font-semibold mb-2">Selecciona o arrastra una fotografía</div>
          <div className="text-color-secondary mb-4">Compatible con imágenes del navegador; EXIF disponible principalmente en JPEG.</div>
          <Button
            label="Elegir archivo"
            icon="pi pi-upload"
            loading={loading}
            onClick={() => fileInputRef.current?.click()}
          />
        </div>

        {hasResult && (
          <div className="grid">
            <div className="col-12 lg:col-4">
              <div className="surface-50 border-round p-3 mb-4">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="w-full border-round"
                  style={{ maxHeight: '340px', objectFit: 'contain', background: 'var(--surface-ground)' }}
                />
              </div>

              <div className="surface-50 border-round p-4 mb-4">
                <h3 className="mt-0 mb-3 text-xl">Archivo</h3>
                <div className="flex flex-column gap-3">
                  <div><span className="font-semibold">Nombre:</span> <span className="text-color-secondary">{fileInfo.name}</span></div>
                  <div><span className="font-semibold">Tipo:</span> <span className="text-color-secondary">{fileInfo.type}</span></div>
                  <div><span className="font-semibold">Tamaño:</span> <span className="text-color-secondary">{fileInfo.size}</span></div>
                  <div><span className="font-semibold">Modificado:</span> <span className="text-color-secondary">{fileInfo.lastModified}</span></div>
                </div>
              </div>

              <div className="surface-50 border-round p-4">
                <h3 className="mt-0 mb-3 text-xl">Imagen</h3>
                <div className="flex flex-column gap-3">
                  <div><span className="font-semibold">Dimensiones:</span> <span className="text-color-secondary">{imageInfo.width} x {imageInfo.height}px</span></div>
                  <div><span className="font-semibold">Megapixeles:</span> <span className="text-color-secondary">{imageInfo.megapixels}</span></div>
                  <div><span className="font-semibold">Relación:</span> <span className="text-color-secondary">{imageInfo.aspectRatio}</span></div>
                </div>
              </div>
            </div>

            <div className="col-12 lg:col-8">
              {gpsInfo && (
                <div className="surface-50 border-round p-4 mb-4">
                  <h3 className="mt-0 mb-3 text-xl flex align-items-center">
                    <i className="pi pi-map-marker mr-2 text-cyan-500"></i>
                    <span>Ubicación GPS</span>
                  </h3>
                  <div className="grid">
                    <div className="col-12 md:col-4"><span className="font-semibold">Latitud:</span> <span className="text-color-secondary">{gpsInfo.latitude}</span></div>
                    <div className="col-12 md:col-4"><span className="font-semibold">Longitud:</span> <span className="text-color-secondary">{gpsInfo.longitude}</span></div>
                    <div className="col-12 md:col-4"><span className="font-semibold">Altitud:</span> <span className="text-color-secondary">{gpsInfo.altitude ?? 'N/D'}</span></div>
                  </div>
                </div>
              )}

              {warning && (
                <div className="surface-50 border-round p-4 mb-4 border-left-3 border-cyan-500">
                  <div className="flex align-items-start gap-3">
                    <div className="flex align-items-center justify-content-center bg-cyan-100 text-cyan-700 border-circle flex-shrink-0" style={{ width: '2.75rem', height: '2.75rem' }}>
                      <i className="pi pi-info-circle text-xl"></i>
                    </div>
                    <div>
                      <h3 className="mt-0 mb-2 text-xl">Sin metadata EXIF legible</h3>
                      <p className="m-0 text-color-secondary line-height-3">
                        {warning} La imágen se cargó correctamente, pero no trae datos técnicos embebidos o fueron removidos al exportarla.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-3 py-2 border-round bg-cyan-50 text-cyan-800 text-sm font-medium">El preview y las dimensiones siguen disponibles</span>
                        <span className="px-3 py-2 border-round surface-100 text-color-secondary text-sm font-medium">Prueba con un JPEG original de cámara o celular</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {metadataRows.length > 0 && (
                <div className="flex flex-column gap-4">
                  {Object.entries(groupedMetadata).map(([section, rows]) => (
                    <div key={section} className="surface-50 border-round p-4">
                      <h3 className="mt-0 mb-3 text-xl">{section}</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="text-left text-color-secondary">
                              <th className="py-2 pr-3 border-bottom-1 surface-border">Campo</th>
                              <th className="py-2 pr-3 border-bottom-1 surface-border">Valor</th>
                              <th className="py-2 border-bottom-1 surface-border">Tag</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => (
                              <tr key={`${row.section}-${row.tag}-${row.label}`}>
                                <td className="py-3 pr-3 border-bottom-1 surface-border font-semibold">{row.label}</td>
                                <td className="py-3 pr-3 border-bottom-1 surface-border text-color-secondary" style={{ wordBreak: 'break-word' }}>{row.value}</td>
                                <td className="py-3 border-bottom-1 surface-border font-code text-sm text-color-secondary">{row.tag}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoMetadata;
