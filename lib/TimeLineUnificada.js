export function buildMergedTimeline(item) {
    const merged = [];
  
    // Pega apenas o primeiro nome (antes do primeiro espaço)
    const primeiroNome = item.user.nome.split(" ")[0];
  
    // Helper para formatar ISO → "DD/MM/YYYY HH:mm:ss"
    function formatDateTimeBR(dateObj) {
      return dateObj
        .toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(",", "");
    }
  
    // 1) Copia o historicoParticipacao (já vindo de mapHistorico)
    if (Array.isArray(item.historicoParticipacao)) {
      item.historicoParticipacao.forEach((evt) => {
        merged.push({
          id: evt.id,
          isLatest: false, //evt.isLatest,
          status: `Participação de ${primeiroNome}: ${evt.status}`,
          date: evt.date,
          observacao: evt.observacao,
          rawStatus: evt.rawStatus,
        });
      });
    }
  
    // 2) Para cada vínculo, adiciona eventos de vínculo + eventos de solicitação
    if (Array.isArray(item.VinculoSolicitacaoBolsa)) {
      item.VinculoSolicitacaoBolsa.forEach((vinculo) => {
        const sol = vinculo.solicitacaoBolsa;
        const solId = sol?.id;
  
        // 2.a) Histórico de vínculo
        if (Array.isArray(vinculo.HistoricoStatusVinculo)) {
          vinculo.HistoricoStatusVinculo.forEach((evtV) => {
            const dateFull = formatDateTimeBR(new Date(evtV.inicio));
            merged.push({
              id: evtV.id,
              isLatest: false,
              status: `Vínculo de ${primeiroNome} à Solicitação de Bolsa ID-${solId}: ${evtV.status.toLowerCase()}`,
              date: dateFull,
              observacao: evtV.observacao || null,
              rawStatus: evtV.status,
            });
          });
        }
  
        // 2.b) Histórico de solicitação
        if (sol && Array.isArray(sol.HistoricoStatusSolicitacaoBolsa)) {
          sol.HistoricoStatusSolicitacaoBolsa.forEach((evtS) => {
            const dateFull = formatDateTimeBR(new Date(evtS.inicio));
            merged.push({
              isLatest: false,
              status: `Solicitação de Bolsa ID-${solId}: ${evtS.status.toLowerCase()}`,
              date: dateFull,
              observacao: evtS.observacao || null,
              rawStatus: evtS.status,
            });
          });
        }
      });
    }
  
    // 3) Ordena cronologicamente pelo campo "date" (em "DD/MM/YYYY HH:mm:ss")
    merged.sort((a, b) => {
      function toTs(dateTimeStr) {
        const [dt, tm] = dateTimeStr.split(" ");
        const [dd, mm, yyyy] = dt.split("/").map(Number);
        const [hh, mi, ss] = tm.split(":").map(Number);
        return new Date(yyyy, mm - 1, dd, hh, mi, ss).getTime();
      }
      return toTs(b.date) - toTs(a.date);
    });
  
    return merged;
  }