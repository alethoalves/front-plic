export const transformarQuebrasEmParagrafos = (texto) => {
    if (!texto) return null;

    return texto.split("\n").map((paragrafo, index) => (
      <p key={index} className="mb-3">
        {paragrafo}
      </p>
    ));
  };