import React from 'react';

import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-column align-items-center mt-5">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 text-primary">Dashboard de Utilidades</h1>
        <p className="text-color-secondary text-lg">Selecciona la herramienta que deseas utilizar</p>
      </div>

      <div className="grid justify-content-center gap-4 w-full max-w-5xl">
        <div className="col-12">
          <div className="surface-card shadow-3 hover:shadow-6 transition-duration-300 border-round flex flex-column md:flex-row overflow-hidden w-full h-full">
            <div className="flex justify-content-center align-items-center p-5 md:w-4 lg:w-3 flex-shrink-0" style={{ backgroundColor: 'var(--indigo-500)', color: '#ffffff', minHeight: '10rem' }}>
              <i className="pi pi-code" style={{ fontSize: '4rem' }}></i>
            </div>
            
            <div className="flex flex-column p-4 md:p-5 flex-grow-1">
              <div className="text-2xl font-bold mb-1">Base 64</div>
              <div className="text-color-secondary mb-3 font-medium">Excel</div>
              <p className="m-0 mb-4 line-height-3 text-color-secondary">
                Convierte fácilmente cadenas de texto codificadas en Base64 directamente a archivos descargables (como Excel .xlsx o .csv).
              </p>
              
              <div className="flex flex-column gap-3 mt-auto border-top-1 surface-border pt-4">
                <span className="text-sm font-semibold text-color-secondary uppercase tracking-wide">Herramientas Disponibles</span>
                
                <div 
                  className="p-3 border-round-xl surface-50 hover:surface-100 cursor-pointer transition-colors transition-duration-200 flex align-items-center border-1 surface-border"
                  onClick={() => navigate('/base64-decoder')}
                >
                  <div className="flex align-items-center justify-content-center bg-indigo-100 border-round p-2 mr-3">
                    <i className="pi pi-file-excel text-xl text-indigo-600"></i>
                  </div>
                  <div className="flex flex-column flex-grow-1">
                    <span className="font-medium text-lg text-color">Excel</span>
                    <span className="text-sm text-color-secondary">xls, xlsx, csv</span>
                  </div>
                  <i className="pi pi-angle-right text-color-secondary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="surface-card shadow-3 hover:shadow-6 transition-duration-300 border-round flex flex-column md:flex-row overflow-hidden w-full h-full">
            <div className="flex justify-content-center align-items-center p-5 md:w-4 lg:w-3 flex-shrink-0" style={{ backgroundColor: 'var(--teal-500)', color: '#ffffff', minHeight: '10rem' }}>
              <i className="pi pi-volume-up" style={{ fontSize: '4rem' }}></i>
            </div>
            
            <div className="flex flex-column p-4 md:p-5 flex-grow-1">
              <div className="text-2xl font-bold mb-1">Text to Speech</div>
              <div className="text-color-secondary mb-3 font-medium">Sintetizador de voz</div>
              <p className="m-0 mb-4 line-height-3 text-color-secondary">
                Convierte textos o documentos en formato Markdown a audio utilizando las voces neuronales de alta calidad de Edge TTS.
              </p>
              <div className="mt-auto">
                <Button
                  label="Abrir Herramienta"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  severity="success"
                  className="w-full md:w-auto"
                  onClick={() => navigate('/text-to-speech')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="surface-card shadow-3 hover:shadow-6 transition-duration-300 border-round flex flex-column md:flex-row overflow-hidden w-full h-full">
            <div className="flex justify-content-center align-items-center p-5 md:w-4 lg:w-3 flex-shrink-0" style={{ backgroundColor: 'var(--orange-500)', color: '#ffffff', minHeight: '10rem' }}>
              <i className="pi pi-id-card" style={{ fontSize: '4rem' }}></i>
            </div>
            
            <div className="flex flex-column p-4 md:p-5 flex-grow-1">
              <div className="text-2xl font-bold mb-1">Cédula Ecuador</div>
              <div className="text-color-secondary mb-3 font-medium">Generador y Validador</div>
              <p className="m-0 mb-4 line-height-3 text-color-secondary">
                Valida si una cédula ecuatoriana es correcta o genera cédulas algorítmicamente válidas para realizar pruebas.
              </p>
              <div className="mt-auto">
                <Button
                  label="Abrir Herramienta"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  severity="warning"
                  className="w-full md:w-auto"
                  onClick={() => navigate('/cedula-ecuador')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="surface-card shadow-3 hover:shadow-6 transition-duration-300 border-round flex flex-column md:flex-row overflow-hidden w-full h-full">
            <div className="flex justify-content-center align-items-center p-5 md:w-4 lg:w-3 flex-shrink-0" style={{ backgroundColor: 'var(--pink-500)', color: '#ffffff', minHeight: '10rem' }}>
              <i className="pi pi-shield" style={{ fontSize: '4rem' }}></i>
            </div>
            
            <div className="flex flex-column p-4 md:p-5 flex-grow-1">
              <div className="text-2xl font-bold mb-1">JWT Encoder / Decoder</div>
              <div className="text-color-secondary mb-3 font-medium">JSON Web Tokens</div>
              <p className="m-0 mb-4 line-height-3 text-color-secondary">
                Decodifica, verifica y genera JSON Web Tokens (JWT). Inspecciona el header, el payload y valida la firma.
              </p>
              <div className="mt-auto">
                <Button
                  label="Abrir Herramienta"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  severity="danger"
                  className="w-full md:w-auto"
                  onClick={() => navigate('/jwt-tool')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="surface-card shadow-3 hover:shadow-6 transition-duration-300 border-round flex flex-column md:flex-row overflow-hidden w-full h-full">
            <div className="flex justify-content-center align-items-center p-5 md:w-4 lg:w-3 flex-shrink-0" style={{ backgroundColor: 'var(--cyan-500)', color: '#ffffff', minHeight: '10rem' }}>
              <i className="pi pi-camera" style={{ fontSize: '4rem' }}></i>
            </div>
            
            <div className="flex flex-column p-4 md:p-5 flex-grow-1">
              <div className="text-2xl font-bold mb-1">Metadata de Fotografía</div>
              <div className="text-color-secondary mb-3 font-medium">EXIF e información de archivo</div>
              <p className="m-0 mb-4 line-height-3 text-color-secondary">
                Extrae datos de una fotografía: dimensiones, tamaño, cámara, lente, fecha, parámetros de captura y coordenadas GPS cuando estén disponibles.
              </p>
              <div className="mt-auto">
                <Button
                  label="Abrir Herramienta"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  severity="info"
                  className="w-full md:w-auto"
                  onClick={() => navigate('/photo-metadata')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
