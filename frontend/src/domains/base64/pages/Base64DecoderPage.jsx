import React, { useState, useRef } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useNavigate } from 'react-router-dom';

const Base64Decoder = () => {
  const navigate = useNavigate();
  const [base64String, setBase64String] = useState('');
  const [format, setFormat] = useState('xlsx');
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const formatOptions = [
    { label: 'Excel (.xlsx)', value: 'xlsx' },
    { label: 'Excel 97-2003 (.xls)', value: 'xls' },
    { label: 'CSV (.csv)', value: 'csv' }
  ];

  const handleConvert = async () => {
    if (!base64String.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Advertencia', detail: 'Por favor, ingresa una cadena Base64 válida', life: 3000 });
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const cleanBase64 = base64String.replace(/\s+/g, '').replace(/^data:.*?;base64,/, "");
      
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.codePointAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      let mimeType = 'application/octet-stream';
      if (format === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (format === 'xls') mimeType = 'application/vnd.ms-excel';
      if (format === 'csv') mimeType = 'text/csv';
      
      const blob = new Blob([byteArray], { type: mimeType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.current.show({ severity: 'success', summary: 'Éxito', detail: `Archivo ${format.toUpperCase()} generado correctamente`, life: 3000 });
      setBase64String('');
    } catch (error) {
      console.error(error);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al procesar la solicitud o el Base64 es inválido', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-content-center p-4">
      <Toast ref={toast} />
      
      <div className="surface-card p-5 shadow-3 border-round w-full max-w-4xl">
        <div className="flex align-items-center mb-4">
          <Button icon="pi pi-arrow-left" text rounded severity="secondary" onClick={() => navigate('/')} className="mr-3" />
          <h2 className="m-0 text-3xl font-bold">Decodificador Base64</h2>
        </div>
        
        <p className="text-color-secondary mb-5">
          Pega el contenido Base64, selecciona el formato de salida y descárgalo directamente en tu computadora.
        </p>

        <div className="grid">
          <div className="col-12 md:col-4 mb-4">
            <label htmlFor="format-select" className="font-medium text-lg block mb-2">Formato de Salida</label>
            <Dropdown 
              id="format-select" 
              value={format} 
              options={formatOptions} 
              onChange={(e) => setFormat(e.value)} 
              placeholder="Selecciona formato" 
              className="w-full" 
            />
          </div>

          <div className="col-12 mb-4">
            <label htmlFor="base64-input" className="font-medium text-lg block mb-2">Contenido Base64</label>
            <InputTextarea 
              id="base64-input" 
              value={base64String} 
              onChange={(e) => setBase64String(e.target.value)} 
              rows={10} 
              autoResize 
              placeholder="UEsDBAoAAAAIAKGcq1yR28AJWQEAAPAEAAATAAAA..."
              className="w-full text-base font-code"
            />
          </div>
        </div>

        <div className="flex justify-content-end">
          <Button 
            label={`Descargar ${format.toUpperCase()}`} 
            icon="pi pi-download" 
            loading={loading} 
            onClick={handleConvert} 
            className="w-full md:w-auto"
            size="large"
          />
        </div>
      </div>
    </div>
  );
};

export default Base64Decoder;
