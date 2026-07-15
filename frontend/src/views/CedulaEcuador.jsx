import React, { useState, useRef } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { useNavigate } from 'react-router-dom';

const CedulaEcuador = () => {
  const navigate = useNavigate();
  // Generador State
  const [cantidad, setCantidad] = useState(10);
  const [provincia, setProvincia] = useState('17');
  const [cedulasGeneradas, setCedulasGeneradas] = useState('');

  // Validador State
  const [cedulaValidar, setCedulaValidar] = useState('');
  const [resultadoValidacion, setResultadoValidacion] = useState(null);

  const toast = useRef(null);

  const provinciasOptions = Array.from({ length: 24 }, (_, i) => {
    const code = (i + 1).toString().padStart(2, '0');
    return { label: `Provincia ${code}`, value: code };
  });

  // Lógica de validación / generación
  const calcularDigitoVerificador = (base9) => {
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let valor = Number.parseInt(base9[i], 10) * coeficientes[i];
      if (valor >= 10) valor -= 9;
      suma += valor;
    }
    const residuo = suma % 10;
    return residuo === 0 ? 0 : 10 - residuo;
  };

  const validarCedulaEcuador = (cedula) => {
    if (!/^\d{10}$/.test(cedula)) return false;
    const prov = Number.parseInt(cedula.substring(0, 2), 10);
    if (prov < 1 || prov > 24) return false;
    const tercerDigito = Number.parseInt(cedula[2], 10);
    if (tercerDigito >= 6) return false;

    const base9 = cedula.substring(0, 9);
    const digitoCalculado = calcularDigitoVerificador(base9);
    const digitoReal = Number.parseInt(cedula[9], 10);
    return digitoCalculado === digitoReal;
  };

  const generarCedulaValida = (prov) => {
    const secureRandom = () => window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
    const tercerDigito = Math.floor(secureRandom() * 6).toString(); // 0 a 5
    let base9 = prov + tercerDigito;
    while (base9.length < 9) {
      base9 += Math.floor(secureRandom() * 10).toString();
    }
    const digitoVerificador = calcularDigitoVerificador(base9);
    return base9 + digitoVerificador;
  };

  // Handlers
  const handleGenerate = () => {
    if (!cantidad || cantidad < 1 || cantidad > 1000) {
      toast.current.show({ severity: 'warn', summary: 'Advertencia', detail: 'La cantidad debe ser entre 1 y 1000', life: 3000 });
      return;
    }

    const results = [];
    for (let i = 0; i < cantidad; i++) {
      results.push(generarCedulaValida(provincia));
    }
    setCedulasGeneradas(results.join('\n'));
    toast.current.show({ severity: 'success', summary: 'Éxito', detail: `${cantidad} cédulas generadas`, life: 3000 });
  };

  const handleValidate = () => {
    if (!cedulaValidar.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Advertencia', detail: 'Ingresa una cédula', life: 3000 });
      return;
    }
    const esValida = validarCedulaEcuador(cedulaValidar);
    setResultadoValidacion(esValida);
  };

  return (
    <div className="flex justify-content-center p-4">
      <Toast ref={toast} />

      <div className="surface-card p-5 shadow-3 border-round w-full max-w-4xl">
        <div className="flex align-items-center mb-4">
          <Button icon="pi pi-arrow-left" text rounded severity="secondary" onClick={() => navigate('/')} className="mr-3" />
          <h2 className="m-0 text-3xl font-bold">Cédula Ecuatoriana</h2>
        </div>

        <p className="text-color-secondary mb-5">
          Generador de datos de prueba y validador algorítmico para Cédulas de Identidad de Ecuador.
        </p>

        <TabView pt={{
          panelContainer: { className: 'bg-transparent border-none p-0 pt-5' },
          nav: { className: 'bg-transparent border-none gap-1' }
        }}>
          <TabPanel header="Generador" leftIcon="pi pi-cog mr-2">
            <div className="grid mt-3">
              <div className="col-12 md:col-4 mb-4">
                <label htmlFor="cantidad-input" className="font-medium text-lg block mb-2">Cantidad a generar</label>
                <InputNumber
                  inputId="cantidad-input"
                  value={cantidad}
                  onValueChange={(e) => setCantidad(e.value)}
                  min={1}
                  max={1000}
                  showButtons
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-5 mb-4">
                <label htmlFor="provincia-input" className="font-medium text-lg block mb-2">Provincia (01 - 24)</label>
                <Dropdown
                  inputId="provincia-input"
                  value={provincia}
                  options={provinciasOptions}
                  onChange={(e) => setProvincia(e.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-3 mb-4 flex align-items-end">
                <Button label="Generar Cédulas" icon="pi pi-bolt" onClick={handleGenerate} className="w-full" />
              </div>

              <div className="col-12">
                <label htmlFor="resultados-input" className="font-medium text-lg block mb-2">Resultados</label>
                <InputTextarea
                  id="resultados-input"
                  value={cedulasGeneradas}
                  rows={8}
                  readOnly
                  autoResize
                  className="w-full text-base font-code"
                  placeholder="Las cédulas aparecerán aquí..."
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Validador" leftIcon="pi pi-check-circle mr-2">
            <div className="mt-3 flex flex-column align-items-center">
              <label htmlFor="cedula-input" className="font-medium text-lg block mb-3 text-center">Ingresa la cédula a validar</label>

              <div className="p-inputgroup max-w-sm mb-4">
                <InputText
                  id="cedula-input"
                  value={cedulaValidar}
                  onChange={(e) => {
                    setCedulaValidar(e.target.value);
                    setResultadoValidacion(null);
                  }}
                  placeholder="Ej: 1712345678"
                  maxLength={10}
                  keyfilter="int"
                />
                <Button icon="pi pi-search" onClick={handleValidate} />
              </div>

              {resultadoValidacion !== null && (
                <div className={`p-4 border-round w-full max-w-sm text-center text-xl font-bold ${resultadoValidacion ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {resultadoValidacion ? (
                    <><i className="pi pi-check-circle mr-2"></i> Cédula Válida</>
                  ) : (
                    <><i className="pi pi-times-circle mr-2"></i> Cédula Inválida</>
                  )}
                </div>
              )}
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
};

export default CedulaEcuador;
