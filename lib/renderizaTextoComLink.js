// Adicione esta função utilitária no seu componente
export const renderizarTextoComLinks = (texto) => {
    if (!texto) return texto;
    
    // Regex para detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Dividir o texto em partes, substituindo URLs por elementos âncora
    const partes = texto.split(urlRegex);
    
    return partes.map((parte, index) => {
      if (urlRegex.test(parte)) {
        return (
          <a 
            key={index}
            href={parte} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline' }}
            onClick={(e) => e.stopPropagation()}
          >
            {parte}
          </a>
        );
      }
      return parte;
    });
  };