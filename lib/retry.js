// Repete uma chamada assíncrona uma vez em caso de erro transitório (sem
// resposta do servidor, ou 5xx) antes de desistir — não repete erro de
// validação (4xx), já que tentar de novo não muda o resultado. Criado pra
// absorver quedas intermitentes de conexão com o banco (Railway) durante
// salvamentos de edição inline nas tabelas de seleção.
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ehErroTransitorio = (err) => !err?.response || err.response.status >= 500;

export const comRetry = async (fn, tentativas = 1, esperaMs = 400) => {
  try {
    return await fn();
  } catch (err) {
    if (tentativas > 0 && ehErroTransitorio(err)) {
      await esperar(esperaMs);
      return comRetry(fn, tentativas - 1, esperaMs);
    }
    throw err;
  }
};
