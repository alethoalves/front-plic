import { useEffect, useState } from "react";

// Controla um modal de "ajuda"/regras que abre automaticamente na primeira
// visita à página e pode ser reaberto a qualquer momento (ex.: ícone de
// ajuda no header da página). A preferência "não mostrar novamente" é só
// local no navegador, escopada por tenant (mesmo padrão de
// app/[tenant]/gestor/[ano]/participacoes/selecao/alunos/page.jsx) — nunca
// sincronizada com o backend.
export const useModalAjuda = (storageKey, tenant) => {
  const [isOpen, setIsOpen] = useState(false);
  const [naoMostrarNovamente, setNaoMostrarNovamente] = useState(false);
  const chave = `${storageKey}_${tenant}`;

  useEffect(() => {
    try {
      const dispensado = localStorage.getItem(chave) === "true";
      setIsOpen(!dispensado);
    } catch {
      // localStorage indisponível (modo privado, quota etc.) — abre por padrão
      setIsOpen(true);
    }
  }, [chave]);

  const fechar = () => {
    setIsOpen(false);
    if (naoMostrarNovamente) {
      try {
        localStorage.setItem(chave, "true");
      } catch {
        // localStorage indisponível — ignora, só não persiste a preferência
      }
    }
  };

  const reabrir = () => setIsOpen(true);

  return { isOpen, fechar, reabrir, naoMostrarNovamente, setNaoMostrarNovamente };
};
