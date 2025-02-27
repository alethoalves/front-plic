const calcularMedia = (fichas) => {
    const notas = fichas
      .map((f) => f.notaTotal)
      .filter((n) => n !== null && !isNaN(n));

    return notas.length > 0
      ? Number((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2))
      : null;
  };
export default calcularMedia;
