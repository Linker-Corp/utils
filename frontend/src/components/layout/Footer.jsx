import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="surface-card text-center p-4 shadow-2 mt-auto border-top-1 surface-border">
      <div className="text-color-secondary font-medium">
        &copy; {currentYear} Linker Corp Ec. Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;
