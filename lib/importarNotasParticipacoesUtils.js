// Importa (grava) em PlanoDeTrabalho.notaAluno/notaOrientador a média da
// "Nota Total Geral" das participações de aluno/orientador de cada plano —
// mesmo cálculo usado nas telas de Seleção de Participações. Roda sobre
// TODOS os planos carregados na tabela (independente de filtro/seleção
// aplicados), em lotes, no mesmo padrão de handleDefinirNotaCorte
// (front-plic/lib/notaCorteUtils.js).
export const handleImportarNotasParticipacoes = async ({
  planoIds,
  params,
  importarNotasParticipacoesApi,
  fetchInitialData,
  setIsLoadingImportarNotas,
  setProgress,
  toast,
}) => {
  if (!planoIds || planoIds.length === 0) {
    toast.current?.show({
      severity: "warn",
      summary: "Atenção",
      detail: "Nenhum plano de trabalho encontrado para importar notas",
      life: 3000,
    });
    return;
  }

  setIsLoadingImportarNotas(true);
  setProgress(0);

  try {
    const batchSize = 20;
    const totalItems = planoIds.length;
    let processedItems = 0;

    const batches = [];
    for (let i = 0; i < planoIds.length; i += batchSize) {
      batches.push(planoIds.slice(i, i + batchSize));
    }

    const processBatch = async (batch) =>
      importarNotasParticipacoesApi(params.tenant, batch);

    const parallelLimit = 3;
    let totalAtualizados = 0;
    let planosIgnorados = [];

    for (let i = 0; i < batches.length; i += parallelLimit) {
      const currentBatches = batches.slice(i, i + parallelLimit);
      const batchResults = await Promise.all(currentBatches.map(processBatch));

      for (const result of batchResults) {
        if (result && typeof result === "object") {
          totalAtualizados += result.totalAtualizados || 0;
          if (Array.isArray(result.planosIgnorados)) {
            planosIgnorados.push(...result.planosIgnorados);
          }
        }
      }

      processedItems += currentBatches.reduce(
        (sum, batch) => sum + batch.length,
        0
      );

      const newProgress = Math.round((processedItems / totalItems) * 100);
      setProgress(newProgress);

      toast.current?.show({
        severity: "info",
        summary: "Processando...",
        detail: `${processedItems} de ${totalItems} planos processados (${newProgress}%)`,
        life: 2000,
      });
    }

    if (totalAtualizados > 0) {
      toast.current?.show({
        severity: "success",
        summary: "Notas importadas",
        detail: `${totalAtualizados} plano(s) de trabalho atualizados com sucesso`,
        life: 4000,
      });
    }

    if (planosIgnorados.length > 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Planos ignorados",
        detail: `${planosIgnorados.length} plano(s) ignorado(s) por não ter nenhuma participação de aluno nem de orientador`,
        life: 7000,
      });
    }

    await fetchInitialData();
  } catch (error) {
    console.error("Erro ao importar notas das participações:", error);
    toast.current?.show({
      severity: "error",
      summary: "Erro",
      detail: error.message || "Falha ao importar notas das participações",
      life: 3000,
    });
  } finally {
    setIsLoadingImportarNotas(false);
  }
};
