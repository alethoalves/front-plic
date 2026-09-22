"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import ProgressoEtapas from "./ProgressoEtapas";
import { RiRefreshLine } from "@remixicon/react";
import styles from "./wizard.module.scss";

const INTERVALO_VERIFICACAO_SEGUNDOS = 10;

// Passo 1 do ciclo: o avaliador escolhe as áreas de interesse entre as
// submissões AGUARDANDO_AVALIACAO. Chips grandes e tocáveis em vez do
// MultiSelect denso da tela antiga — mais adequado a toque em celular.
const EtapaEscolhaAreas = ({
  areas,
  selecionadas,
  onAlternarArea,
  onContinuar,
  onVerificarNovamente,
  carregandoAreas,
  enviando,
  erro,
}) => {
  const temSelecao = selecionadas.length > 0;
  const semAreasDisponiveis = !carregandoAreas && areas.length === 0;
  const areasOrdenadas = [...areas].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );

  const [segundosRestantes, setSegundosRestantes] = useState(
    INTERVALO_VERIFICACAO_SEGUNDOS,
  );
  // Ref pra sempre chamar a versão mais recente de onVerificarNovamente sem
  // precisar recriar o interval a cada render.
  const onVerificarNovamenteRef = useRef(onVerificarNovamente);
  onVerificarNovamenteRef.current = onVerificarNovamente;

  // Contador de "verificar de novo em Xs" — só roda enquanto a tela de
  // "sem trabalhos" estiver visível. Cada vez que uma verificação acontece
  // (automática ou pelo clique manual), o pai muda `carregandoAreas`, o que
  // desmonta esse efeito e, se continuar sem trabalhos, remonta com o
  // contador resetado — sem precisar de lógica extra de reset aqui. Pausa
  // quando a aba está em segundo plano, pra não gastar bateria/dados à toa.
  useEffect(() => {
    if (!semAreasDisponiveis) return undefined;

    setSegundosRestantes(INTERVALO_VERIFICACAO_SEGUNDOS);

    const intervalo = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          onVerificarNovamenteRef.current();
          return INTERVALO_VERIFICACAO_SEGUNDOS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [semAreasDisponiveis]);

  return (
    <>
      <div className={styles.card}>
        <ProgressoEtapas atual={1} total={4} />
        <h1 className="h-editorial-sm mb-2">Escolha suas áreas de interesse</h1>
        <p className="mb-3">
          Selecione uma ou mais áreas. Assim que confirmar, alocaremos um (1)
          trabalho para você.<br></br> <br></br>O número que aparece do lado
          direito de cada área indica quantos trabalho desta respectiva área
          aguardam avaliação.
        </p>

        {carregandoAreas && (
          <p className="text-center mb-2">Carregando áreas...</p>
        )}

        {semAreasDisponiveis && (
          <div className={styles.aviso}>
            <p className="mb-2">
              Não há trabalhos aguardando avaliação no momento. Volte a checar
              em instantes.
            </p>
            <Button
              className="btn-secondary w-100"
              onClick={onVerificarNovamente}
              icon={RiRefreshLine}
            >
              Verificar novamente
            </Button>
            <p className={styles.avisoContador}>
              Verificando automaticamente em {segundosRestantes}s
            </p>
          </div>
        )}

        {!carregandoAreas && (
          <div className={styles.chips}>
            {areasOrdenadas.map((area) => {
              const selecionada = selecionadas.includes(area.id);
              return (
                <button
                  key={area.id}
                  type="button"
                  className={`${styles.chip} ${selecionada ? styles.chipSelecionado : ""}`}
                  onClick={() => onAlternarArea(area.id)}
                >
                  <span>{area.nome}</span>
                  <span className={styles.chipContador}>{area.quantidade}</span>
                </button>
              );
            })}
          </div>
        )}

        {erro && <p className={styles.erro}>{erro}</p>}

        {/* Reserva o espaço que o botão fixo ocupa por cima do conteúdo, pra
        o último chip da lista não ficar escondido atrás dele. */}
        <div className={styles.espacoRodapeFixo} />
      </div>

      <div className={styles.rodapeFixo}>
        <Button
          className="btn-primary w-100"
          onClick={onContinuar}
          disabled={!temSelecao || carregandoAreas}
          loading={enviando}
        >
          Continuar
        </Button>
      </div>
    </>
  );
};

export default EtapaEscolhaAreas;
