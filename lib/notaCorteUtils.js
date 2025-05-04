export const handleDefinirNotaCorte = async ({
  notaCorte,
  selectedItems,
  params,
  aplicarNotaCorteApi,
  fetchInitialData,
  setIsLoadingNotaCorte,
  setProgress,
  setNotaCorte,
  setSelectedItems,
  toast
}) => {
  if (notaCorte === null) {
    toast.current?.show({
      severity: "warn",
      summary: "Atenção",
      detail: "Informe a nota de corte",
      life: 3000,
    });
    return;
  }

  setIsLoadingNotaCorte(true);
  setProgress(0);

  try {
    const batchSize = 20;
    const totalItems = selectedItems.length;
    let processedItems = 0;

    const allClassificados = [];
    const allDesclassificados = [];

    selectedItems.forEach((item) => {
      if (item.notaTotal >= notaCorte) {
        allClassificados.push(item.id);
      } else {
        allDesclassificados.push({
          id: item.id,
          notaTotal: item.notaTotal,
        });
      }
    });

    const processBatch = async (batch) => {
      const response = await aplicarNotaCorteApi(
        params.tenant,
        notaCorte,
        batch.classificados,
        batch.desclassificados
      );
      return response;
    };

    const batches = [];
    for (
      let i = 0;
      i < Math.max(allClassificados.length, allDesclassificados.length);
      i += batchSize
    ) {
      batches.push({
        classificados: allClassificados.slice(i, i + batchSize),
        desclassificados: allDesclassificados.slice(i, i + batchSize),
      });
    }

    const parallelLimit = 3;
    const results = [];
    let totalAtualizados = 0;
    let inelegiveis = [];

    for (let i = 0; i < batches.length; i += parallelLimit) {
      const currentBatches = batches.slice(i, i + parallelLimit);
      const batchResults = await Promise.all(currentBatches.map(processBatch));

      for (const result of batchResults) {
        if (result && typeof result === 'object') {
          totalAtualizados += result.totalAtualizados || 0;
          if (Array.isArray(result.planosIgnorados)) {
            inelegiveis.push(...result.planosIgnorados);
          }
        }
      }

      processedItems += currentBatches.reduce(
        (sum, batch) =>
          sum + batch.classificados.length + batch.desclassificados.length,
        0
      );

      const newProgress = Math.round((processedItems / totalItems) * 100);
      setProgress(newProgress);

      toast.current?.show({
        severity: "info",
        summary: "Processando...",
        detail: `${processedItems} de ${totalItems} itens processados (${newProgress}%)`,
        life: 2000,
      });
    }

    if (totalAtualizados > 0) {
      toast.current?.show({
        severity: "success",
        summary: "Nota de corte aplicada",
        detail: `${totalAtualizados} planos atualizados com sucesso`,
        life: 4000,
      });
    }

    if (inelegiveis.length > 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Planos ignorados",
        detail: `${inelegiveis.length} plano(s) ignorado(s): ${inelegiveis.join(", ")}`,
        life: 7000,
      });
    }

    await fetchInitialData();
    setNotaCorte(0);
    setSelectedItems([]);
  } catch (error) {
    console.error("Erro ao aplicar nota de corte:", error);
    toast.current?.show({
      severity: "error",
      summary: "Erro",
      detail: error.message || "Falha ao aplicar nota de corte",
      life: 3000,
    });
  } finally {
    setIsLoadingNotaCorte(false);
  }
};
