import React from 'react';
import { Card } from 'primereact/card';
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

      <div className="grid justify-content-center gap-4 w-full max-w-6xl">
        <div className="col-12 md:col-5 lg:col-4">
          <Card
            title="Base 64"
            subTitle="Excel"
            className="shadow-3 hover:shadow-6 transition-duration-300 h-full"
            header={
              <div className="flex justify-content-center align-items-center border-round-top p-4 h-8rem" style={{ backgroundColor: 'var(--indigo-500)', color: '#ffffff' }}>
                <i className="pi pi-code" style={{ fontSize: '3rem' }}></i>
              </div>
            }
          >
            <p className="m-0 mb-4 line-height-3 text-color-secondary">
              Convierte fácilmente cadenas de texto codificadas en Base64 directamente a archivos descargables (como Excel .xlsx o .csv).
            </p>
            
            <div className="flex flex-column gap-3 mt-4 border-top-1 surface-border pt-4">
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
          </Card>
        </div>

        <div className="col-12 md:col-5 lg:col-4">
          <Card
            title="Text to Speech"
            subTitle="Sintetizador de voz"
            className="shadow-3 hover:shadow-6 transition-duration-300 h-full"
            header={
              <div className="flex justify-content-center align-items-center border-round-top p-4 h-8rem" style={{ backgroundColor: 'var(--teal-500)', color: '#ffffff' }}>
                <i className="pi pi-volume-up" style={{ fontSize: '3rem' }}></i>
              </div>
            }
          >
            <p className="m-0 mb-4 line-height-3 text-color-secondary">
              Convierte textos o documentos en formato Markdown a audio utilizando las voces neuronales de alta calidad de Edge TTS.
            </p>
            <Button
              label="Abrir Herramienta"
              icon="pi pi-arrow-right"
              iconPos="right"
              severity="success"
              className="w-full"
              onClick={() => navigate('/text-to-speech')}
            />
          </Card>
        </div>

        <div className="col-12 md:col-5 lg:col-4">
          <Card
            title="Cédula Ecuador"
            subTitle="Generador y Validador"
            className="shadow-3 hover:shadow-6 transition-duration-300 h-full"
            header={
              <div className="flex justify-content-center align-items-center border-round-top p-4 h-8rem" style={{ backgroundColor: 'var(--orange-500)', color: '#ffffff' }}>
                <i className="pi pi-id-card" style={{ fontSize: '3rem' }}></i>
              </div>
            }
          >
            <p className="m-0 mb-4 line-height-3 text-color-secondary">
              Valida si una cédula ecuatoriana es correcta o genera cédulas algorítmicamente válidas para realizar pruebas.
            </p>
            <Button
              label="Abrir Herramienta"
              icon="pi pi-arrow-right"
              iconPos="right"
              severity="warning"
              className="w-full"
              onClick={() => navigate('/cedula-ecuador')}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
