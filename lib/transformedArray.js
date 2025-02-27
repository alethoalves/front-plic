export const transformedArray = (items) => {
    const data = items?.flatMap((item) => {
      // Criar um array inicial com a área principal
      const result = [{ value: item.id, label: item.area }];

      // Adicionar subáreas, se houver
      const subareaResults = item.subareas.map((subarea) => ({
        value: item.id,
        label: `${item.area} - ${subarea.subarea}`,
      }));

      // Concatenar o array da área principal com as subáreas
      return result.concat(subareaResults);
    });

    // Organizar por `value` crescente e depois por `label`
    return data.sort((a, b) => {
      // Primeiro, organizar por `value` crescente
      if (a.value < b.value) return -1;
      if (a.value > b.value) return 1;

      // Se os `values` forem iguais, organizar por `label`
      return a.label.localeCompare(b.label);
    });
  };