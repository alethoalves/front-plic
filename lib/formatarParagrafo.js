export const transformarQuebrasEmParagrafos = (texto) => {
  if (!texto) return null;
  
  // Converte para string caso não seja
  const textoString = typeof texto === 'string' ? texto : String(texto);
  
  return textoString.split("\n").map((paragrafo, index) => (
    <p key={index} className="mb-3">
      {paragrafo}
    </p>
  ));
};