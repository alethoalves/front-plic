"use client";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "./page.module.scss";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Signin from "@/components/Signin";
import SolicitacaoLattesForm from "@/components/Formularios/SolicitacaoLattesForm";
import { RiCalendarEventLine, RiIdCardLine, RiWhatsappFill } from "@remixicon/react";
import { elegibilidadeAvaliadorSchema } from "@/lib/zodSchemas/avaliadorLattesSchema";
import { verificarElegibilidadeAvaliador } from "@/app/api/client/avaliador";

// Suporte do PLIC (não é o contato do tenant) — mesmo número já usado em
// FluxoInscricaoEdital.jsx e EditarParticipacao.jsx.
const SUPORTE_PLIC_WHATSAPP = "5561991651494";

const SuporteWhatsapp = () => (
  <a
    className={styles.suporteWhatsapp}
    href={`https://wa.me/${SUPORTE_PLIC_WHATSAPP}?text=${encodeURIComponent(
      "Olá! Preciso de ajuda com meu cadastro de avaliador no PLIC."
    )}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    <RiWhatsappFill />
    <div>
      <p className={styles.suporteWhatsappTitulo}>Precisa de ajuda?</p>
      <p>Fale com o suporte do PLIC pelo WhatsApp: +55 (61) 99165-1494</p>
    </div>
  </a>
);

const ConviteAvaliadorClient = ({ tenant, ano, pathLogo }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resultado, setResultado] = useState(null); // { elegibilidade, motivoRecusa?, telefoneTenant? }
  const [dadosInformados, setDadosInformados] = useState(null); // { cpf, dtNascimento }

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(elegibilidadeAvaliadorSchema),
    defaultValues: { cpf: "", dtNascimento: "" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const resp = await verificarElegibilidadeAvaliador(tenant, ano, data);
      if (resp?.status === "success") {
        setDadosInformados(data);
        setResultado(resp);
      } else {
        setErrorMessage(resp?.message ?? "Não foi possível verificar seus dados.");
      }
    } catch (error) {
      console.error("Erro ao verificar elegibilidade:", error);
      setErrorMessage(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  const Logo = () => (
    <div className={styles.logo}>
      {pathLogo ? (
        <Image priority fill src={`/image/${pathLogo}`} alt="logo do tenant" sizes="300 500 700" />
      ) : (
        <div style={{ height: 120 }} />
      )}
    </div>
  );

  let conteudo;

  // apto: já tem doutorado confirmado -> login/cadastro real, vira avaliador direto
  if (resultado?.elegibilidade === "apto") {
    conteudo = (
      <div className={styles.signinWrapper}>
        <Signin
          slug={tenant}
          pathLogo={pathLogo}
          avaliadorOnboardingAno={Number(ano)}
          cpfInicial={dadosInformados?.cpf}
        />
      </div>
    );
  } else if (
    // precisa de análise do gestor (cadastro novo ou usuário existente sem doutorado confirmado)
    resultado?.elegibilidade === "nao_cadastrado" ||
    resultado?.elegibilidade === "precisa_lattes"
  ) {
    conteudo = (
      <div className={styles.box}>
        <div className={styles.header}>
          <h4>Faça parte do Comitê Avaliador!</h4>
        </div>
        <div className={styles.boxContent}>
          <SolicitacaoLattesForm
            tenant={tenant}
            ano={Number(ano)}
            cpf={dadosInformados.cpf}
            dtNascimento={dadosInformados.dtNascimento}
            precisaCadastro={resultado.elegibilidade === "nao_cadastrado"}
            onSubmitted={() => setResultado({ elegibilidade: "pendente" })}
          />
        </div>
      </div>
    );
  } else if (resultado?.elegibilidade === "pendente" || resultado?.elegibilidade === "recusado") {
    // pedido já enviado, aguardando análise, ou já foi recusado
    const recusado = resultado.elegibilidade === "recusado";
    conteudo = (
      <div className={styles.box}>
        <div className={styles.header}>
          <h4>{recusado ? "Solicitação não aprovada" : "Solicitação em análise"}</h4>
        </div>
        <div className={styles.boxContent}>
          {recusado ? (
            <p>
              {resultado.motivoRecusa ||
                "Sua solicitação para ser avaliador não foi aprovada por não termos confirmado sua titulação de doutorado."}
            </p>
          ) : (
            <p>
              Recebemos seu Currículo Lattes e sua solicitação está aguardando
              análise do gestor. Você será avisado assim que houver uma
              decisão.
            </p>
          )}
        </div>
      </div>
    );
  } else {
    // tela inicial: CPF + data de nascimento
    conteudo = (
      <div className={styles.box}>
        <div className={styles.header}>
          <h4>Faça parte do Comitê Avaliador!</h4>
        </div>
        <div className={styles.boxContent}>
          <p>Informe seu CPF e data de nascimento para continuar.</p>
          <br />
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Input
                control={control}
                className="cpf-input"
                name="cpf"
                label="CPF"
                icon={RiIdCardLine}
                inputType="text"
                placeholder="Digite seu CPF"
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="mt-2">
              <Input
                control={control}
                name="dtNascimento"
                label="Data de nascimento"
                icon={RiCalendarEventLine}
                inputType="date"
                placeholder="DD/MM/AAAA"
                disabled={loading}
              />
            </div>
            {errorMessage && (
              <div className={`${styles.errorMsg} mb-3`}>
                <p>{errorMessage}</p>
              </div>
            )}
            <Button className="btn-primary mt-2" type="submit" disabled={loading}>
              {loading ? "Verificando..." : "Continuar"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // no caminho "apto" o conteúdo é o <Signin>, que já desenha a própria logo —
  // não repete aqui pra não duplicar
  const mostrarLogoPropria = resultado?.elegibilidade !== "apto";

  return (
    <div className={styles.content}>
      {mostrarLogoPropria && <Logo />}
      {conteudo}
      <SuporteWhatsapp />
    </div>
  );
};

export default ConviteAvaliadorClient;
