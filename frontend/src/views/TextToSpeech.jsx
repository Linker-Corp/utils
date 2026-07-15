import React, { useState, useEffect, useRef } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useNavigate } from 'react-router-dom';

const TextToSpeech = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const toast = useRef(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      
      // Intentar cargar primero las voces en español
      const esVoices = availableVoices.filter(voice => voice.lang.startsWith('es'));
      const options = esVoices.length > 0 ? esVoices : availableVoices;
      
      const mappedVoices = options.map((v) => ({
        name: `${v.name} (${v.lang})`,
        voiceURI: v.voiceURI,
        originalVoice: v
      }));
      
      setVoices(mappedVoices);
      
      if (mappedVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(mappedVoices[0].voiceURI);
      }
    };

    loadVoices();
    // En algunos navegadores las voces se cargan asíncronamente
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  const handlePlay = () => {
    if (!text.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Advertencia', detail: 'Por favor, ingresa el texto a escuchar', life: 3000 });
      return;
    }

    const synth = window.speechSynthesis;
    
    // Si ya está hablando, lo detenemos primero
    if (synth.speaking) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voiceToUse = voices.find(v => v.voiceURI === selectedVoice)?.originalVoice;
    
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al reproducir el audio', life: 3000 });
    };

    synth.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="flex justify-content-center p-4">
      <Toast ref={toast} />
      
      <div className="surface-card p-5 shadow-3 border-round w-full max-w-4xl">
        <div className="flex align-items-center mb-4">
          <Button icon="pi pi-arrow-left" text rounded severity="secondary" onClick={() => { handleStop(); navigate('/'); }} className="mr-3" />
          <h2 className="m-0 text-3xl font-bold">Text to Speech</h2>
        </div>
        
        <p className="text-color-secondary mb-5">
          Ingresa texto para escucharlo usando las voces nativas de tu dispositivo. (Nota: No es posible descargar el archivo de audio usando esta modalidad local).
        </p>

        <div className="grid">
          <div className="col-12 md:col-6 mb-4">
            <label htmlFor="voice-select" className="font-medium text-lg block mb-2">Seleccionar Voz</label>
            <Dropdown 
              id="voice-select" 
              value={selectedVoice} 
              options={voices} 
              onChange={(e) => setSelectedVoice(e.value)} 
              optionLabel="name"
              optionValue="voiceURI"
              placeholder={voices.length === 0 ? "Cargando voces..." : "Selecciona una voz"} 
              className="w-full"
              disabled={voices.length === 0}
            />
          </div>
          
          <div className="col-12 mb-4">
            <label htmlFor="text-input" className="font-medium text-lg block mb-2">Texto a reproducir</label>
            <InputTextarea 
              id="text-input" 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              rows={8} 
              autoResize 
              placeholder="Escribe aquí el texto que deseas escuchar..."
              className="w-full text-base"
            />
          </div>
        </div>

        <div className="flex justify-content-end gap-3">
          {isPlaying && (
            <Button 
              label="Detener" 
              icon="pi pi-stop" 
              severity="danger"
              onClick={handleStop} 
              className="w-full md:w-auto"
            />
          )}
          <Button 
            label={isPlaying ? "Reiniciar" : "Escuchar Audio"} 
            icon={isPlaying ? "pi pi-replay" : "pi pi-volume-up"} 
            severity="success"
            onClick={handlePlay} 
            className="w-full md:w-auto"
            size="large"
          />
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
