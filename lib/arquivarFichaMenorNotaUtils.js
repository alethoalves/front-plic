import { combinarFichasPorAvaliador } from "./fichaAvaliacaoUtils";

// Para cada plano selecionado, arquiva a ficha do avaliador com a nota mais
// baixa (projeto + este plano, mesmo critério usado manualmente no modal de
// detalhe), desde que haja pelo menos 2 fichas ativas — planos com só 1
// ficha ativa, ou com empate na nota mais baixa, são ignorados (reportados
// no final, nenhuma ficha é tocada neles).
//
// Processa sequencialmente (não em lotes paralelos como a nota de corte):
// arquivar a ficha de projeto de um avaliador propaga pra TODOS os planos
// irmãos daquele avaliador (mesma cascata de toggleArquivarFichaAvaliacao,
// backend) — se dois planos selecionados forem irmãos do mesmo projeto,
// chamadas em paralelo poderiam corromper a ordem de recálculo da mesma
// InscricaoProjeto.
export const handleArquivarFichaMenorNota = async ({
  selectedItems,
  params,
  arquivarFichaAvaliacaoApi,
  fetchInitialData,
  setIsLoadingArquivarMenorNota,
  setProgress,
  setSelectedItems,
  toast,
}) => {
  setIsLoadingArquivarMenorNota(true);
  setProgress(0);

  const planosArquivados = [];
  const planosIgnorados = []; // { id, motivo }
  const planosComErro = []; // { id, erro }

  try {
    const total = selectedItems.length;
    let processados = 0;

    for (const item of selectedItems) {
      try {
        const combinadas = combinarFichasPorAvaliador(
          item.inscricaoProjeto?.FichaAvaliacao || [],
          item.FichaAvaliacao || []
        ).filter((f) => !f.arquivada);

        if (combinadas.length < 2) {
          planosIgnorados.push({
            id: item.id,
            motivo: "menos de 2 fichas ativas",
          });
        } else {
          const menorNota = Math.min(...combinadas.map((f) => f.notaTotal));
          const candidatos = combinadas.filter(
            (f) => f.notaTotal === menorNota
          );

          if (candidatos.length > 1) {
            planosIgnorados.push({
              id: item.id,
              motivo: "empate na menor nota",
            });
          } else {
            const alvo = candidatos[0];
            const idsParaArquivar = [
              alvo.fichaProjetoId,
              alvo.fichaPlanoId,
            ].filter(Boolean);
            for (const fichaId of idsParaArquivar) {
              await arquivarFichaAvaliacaoApi(params.tenant, fichaId, true);
            }
            planosArquivados.push(item.id);
          }
        }
      } catch (err) {
        planosComErro.push({ id: item.id, erro: err.message });
      }

      processados += 1;
      setProgress(Math.round((processados / total) * 100));
    }

    if (planosArquivados.length > 0) {
      toast.current?.show({
        severity: "success",
        summary: "Fichas arquivadas",
        detail: `${planosArquivados.length} plano(s) tiveram a ficha de menor nota arquivada.`,
        life: 4000,
      });
    }
    if (planosIgnorados.length > 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Planos ignorados",
        detail: `${planosIgnorados.length} plano(s) ignorado(s) (menos de 2 fichas ativas ou empate na menor nota).`,
        life: 7000,
      });
    }
    if (planosComErro.length > 0) {
      toast.current?.show({
        severity: "error",
        summary: "Falhas",
        detail: `${planosComErro.length} plano(s) falharam ao tentar arquivar.`,
        life: 7000,
      });
    }

    await fetchInitialData();
    setSelectedItems([]);
  } catch (error) {
    console.error("Erro ao arquivar fichas de menor nota:", error);
    toast.current?.show({
      severity: "error",
      summary: "Erro",
      detail: "Falha ao processar a ação em lote.",
      life: 4000,
    });
  } finally {
    setIsLoadingArquivarMenorNota(false);
  }
};
