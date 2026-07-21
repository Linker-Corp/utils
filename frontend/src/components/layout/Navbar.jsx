import React from 'react';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import logoUrl from '../../assets/images/logo.png';

const Navbar = ({ isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const items = [
    {
      label: 'Dashboard',
      icon: 'pi pi-fw pi-home',
      command: () => navigate('/')
    },
    {
      label: 'Herramientas',
      icon: 'pi pi-fw pi-wrench',
      items: [
        {
          label: 'Base 64',
          icon: 'pi pi-fw pi-code',
          items: [
            {
              label: 'Excel',
              icon: 'pi pi-fw pi-file-excel',
              command: () => navigate('/base64-decoder')
            }
          ]
        },
        {
          label: 'Identidad',
          icon: 'pi pi-fw pi-id-card',
          items: [
            {
              label: 'Cédula Ecuador',
              icon: 'pi pi-fw pi-user',
              command: () => navigate('/cedula-ecuador')
            }
          ]
        },
        {
          label: 'Text to Speech',
          icon: 'pi pi-fw pi-volume-up',
          command: () => navigate('/text-to-speech')
        },
        {
          label: 'JWT',
          icon: 'pi pi-fw pi-key',
          command: () => navigate('/jwt-tool')
        },
        {
          label: 'Fotografía',
          icon: 'pi pi-fw pi-camera',
          items: [
            {
              label: 'Background Remover',
              icon: 'pi pi-fw pi-sliders-h',
              command: () => navigate('/background-remover')
            },
            {
              label: 'Metadata',
              icon: 'pi pi-fw pi-image',
              command: () => navigate('/photo-metadata')
            }
          ]
        }
      ]
    }
  ];

  const start = (
    <div
      className="flex align-items-center cursor-pointer mr-4"
      onClick={() => navigate('/')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/'); }}
    >
      <img src={logoUrl} alt="Linker Corp Ec Logo" style={{ height: '55px' }} className="mr-2" />
      <span className="text-xl font-bold">Linker Corp Ec</span>
    </div>
  );

  const end = (
    <Button
      icon={isDarkMode ? "pi pi-sun" : "pi pi-moon"}
      rounded
      text
      severity="secondary"
      aria-label="Toggle Theme"
      onClick={toggleTheme}
    />
  );

  return (
    <div className="sticky top-0" style={{ zIndex: 1000 }}>
      <Menubar model={items} start={start} end={end} className="border-none border-noround shadow-2 px-4 py-3" />
    </div>
  );
};

export default Navbar;
