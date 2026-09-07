"use client";

import { useEffect, useState } from "react";
import { RiMapPinLine } from "@remixicon/react";
import Button from "@/components/Button";
import { validarLocalizacaoCheckin } from "@/app/api/client/checkin";
import styles from "./checkin.module.scss";
import localStyles from "./EtapaLocalizacao.module.scss";

const MENSAGEM_ERRO_GEOLOCALIZACAO = {
  1: "Você precisa permitir o acesso à localização para continuar. Verifique as permissões do navegador e tente novamente.",
  2: "Não conseguimos obter sua localização agora. Verifique se o GPS do seu celular está ativado.",
  3: "Demorou demais para obter sua localização. Tente novamente.",
};

// Etapa que confirma presença física no evento antes de liberar as telas de
// instrução — captura a geolocalização do navegador e valida no backend
// (fail-fast, pra não fazer o aluno ler as instruções todas antes de
// descobrir que está fora do raio do evento).
const EtapaLocalizacao = ({ eventoSlug, token, submissaoId, onSucesso }) => {
  const [status, setStatus] = useState("buscando"); // buscando | validando | erroGeolocalizacao | erroGeofence | erroServidor
  const [mensagemErro, setMensagemErro] = useState("");
  const [detalheGeofence, setDetalheGeofence] = useState(null);

  const iniciar = () => {
    setStatus("buscando");
    setMensagemErro("");
    setDetalheGeofence(null);

    if (!navigator.geolocation) {
      setStatus("erroGeolocalizacao");
      setMensagemErro("Seu navegador não tem suporte a geolocalização.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (posicao) => {
        const { latitude, longitude } = posicao.coords;
        setStatus("validando");
        try {
          await validarLocalizacaoCheckin(eventoSlug, token, { submissaoId, latitude, longitude });
          onSucesso({ latitude, longitude });
        } catch (error) {
          const dados = error.response?.data;
          if (error.response?.status === 422 && dados?.distanciaMetros != null) {
            setDetalheGeofence(dados);
            setStatus("erroGeofence");
          } else {
            setMensagemErro(dados?.message ?? "Não foi possível validar sua localização.");
            setStatus("erroServidor");
          }
        }
      },
      (erro) => {
        setMensagemErro(MENSAGEM_ERRO_GEOLOCALIZACAO[erro.code] ?? "Não foi possível obter sua localização.");
        setStatus("erroGeolocalizacao");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    iniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "buscando" || status === "validando") {
    return (
      <div className={styles.card}>
        <div className={localStyles.pulseWrap}>
          <RiMapPinLine />
        </div>
        <h1 className="h-editorial-sm mb-2 text-center">
          {status === "buscando" ? "Buscando sua localização..." : "Confirmando presença..."}
        </h1>
        <p className="text-center">
          O check-in só pode ser feito nas imediações do evento. Mantenha o GPS ativado.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className="h-editorial-sm mb-2">Não foi possível confirmar sua presença</h1>
      {status === "erroGeofence" ? (
        <p className="mb-3">
          Você precisa estar presencialmente no evento para fazer o check-in
          {detalheGeofence?.distanciaMetros != null &&
            ` (você está a aproximadamente ${detalheGeofence.distanciaMetros}m do local do evento)`}
          .
        </p>
      ) : (
        <p className="mb-3">{mensagemErro}</p>
      )}
      <Button className="btn-primary w-100" onClick={iniciar}>
        Tentar novamente
      </Button>
    </div>
  );
};

export default EtapaLocalizacao;
