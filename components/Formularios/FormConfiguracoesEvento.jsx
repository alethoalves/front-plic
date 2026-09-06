"use client";

//HOOKS
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formConfiguracoesEvento } from "@/lib/zodSchemas/formConfiguracoesEvento";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/FormConfiguracoesEvento.module.scss";
import {
  RiAwardLine,
  RiCalendarEventLine,
  RiImageAddLine,
  RiInformationLine,
  RiMailSendLine,
  RiPaletteLine,
  RiSave2Line,
} from "@remixicon/react";
import FormMoldeResumo from "@/components/Formularios/FormMoldeResumo";
import FormCategorias from "@/components/Formularios/FormCategorias";
import FormCriteriosAvaliacao from "@/components/Formularios/FormCriteriosAvaliacao";
import FormSessoes from "@/components/Formularios/FormSessoes";
import FormCertificados from "@/components/Formularios/FormCertificados";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Textarea from "@/components/Textarea";
import Image from "next/image";
import {
  updateEventoConfiguracoes,
  uploadImagemEvento,
} from "@/app/api/client/eventos";
import { getSessoesBySlug } from "@/app/api/client/sessoes";
import { getLayoutCertificados } from "@/app/api/client/certificado";
import { resolveEventoImageSrc } from "@/lib/resolveEventoImage";
import FormInstituicoesParceiras from "@/components/Formularios/FormInstituicoesParceiras";
import FormTenantsVinculados from "@/components/Formularios/FormTenantsVinculados";

const METODO_CALCULO_NOTA_OPTIONS = [
  { value: "MEDIA", label: "Média das avaliações" },
  { value: "ULTIMA_AVALIACAO", label: "Última avaliação" },
];

const CAMPOS_GERAL = ["nomeEvento", "slug", "local", "telefone", "linkGrupo", "isbn"];
const CAMPOS_DATAS = ["inicio", "fim"];
const CAMPOS_CONVITE = ["assinatura", "conteudoDefaultConvite"];
const CAMPOS_APARENCIA = ["primaryColor", "bgColor", "pathBanner", "pathBannerMobile", "pathLogo"];
const CAMPOS_AVALIACAO = [
  "permitirSubmissoes",
  "liberarFichaAvaliacao",
  "depurarComentarioComIA",
  "metodoCalculoNota",
  "notaMinimaMencaoHonrosa",
  "notaMinimaPremio",
];

const isoToBR = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const brToIso = (br) => {
  if (!br || br.length < 10) return undefined;
  const [dd, mm, yyyy] = br.split("/");
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
};

const CampoCor = ({ control, name, label, disabled, valor, onChangeSwatch }) => (
  <div className={styles.campoCor}>
    <Input
      control={control}
      name={name}
      label={label}
      inputType="text"
      placeholder="#RRGGBB"
      disabled={disabled}
    />
    <input
      type="color"
      className={styles.swatch}
      value={/^#[0-9a-fA-F]{6}$/.test(valor) ? valor : "#ffffff"}
      onChange={(e) => onChangeSwatch(e.target.value)}
      disabled={disabled}
      title={label}
    />
  </div>
);

const CampoImagem = ({ label, value, onChange, disabled }) => {
  const fileInputRef = useRef();
  const isLocalFile = value instanceof File;
  const previewUrl = isLocalFile
    ? URL.createObjectURL(value)
    : resolveEventoImageSrc(value);

  return (
    <div className={styles.campoImagem}>
      <p className="mb-1">{label}</p>
      <div
        className={`${styles.bgCertificado}`}
        onClick={() => !disabled && fileInputRef.current.click()}
      >
        <div className={styles.certificadoImg}>
          {previewUrl && isLocalFile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={label}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : previewUrl ? (
            <Image
              fill
              src={previewUrl}
              alt={label}
              sizes="(max-width: 768px) 100vw, 300px"
              style={{ objectFit: "contain" }}
            />
          ) : (
            <RiImageAddLine />
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".jpg,.jpeg,.png,.svg"
          disabled={disabled}
          onChange={(e) => e.target.files[0] && onChange(e.target.files[0])}
        />
      </div>
    </div>
  );
};

// Cada seção tem seu próprio botão de salvar, discreto, que envia só os
// campos dela (update parcial) em vez de um submit único da página. Mesmo
// padrão visual de admin/page.module.scss .section (divisor entre seções
// dentro de um único card, não cards separados).
const Secao = ({ icon: Icon, titulo, descricao, status, onSalvar, children }) => (
  <section className={styles.section}>
    <div className={styles.sectionHead}>
      <div className={styles.sectionIcon}>
        <Icon />
      </div>
      <div>
        <h6>{titulo}</h6>
        {descricao && <p>{descricao}</p>}
      </div>
    </div>
    <div className={styles.sectionGrid}>{children}</div>
    <div className={styles.sectionFooter}>
      {status?.success && <p className={styles.statusSucesso}>Salvo!</p>}
      {status?.error && <p className={styles.statusErro}>{status.error}</p>}
      <Button
        icon={RiSave2Line}
        className="btn-secondary"
        type="button"
        onClick={onSalvar}
        disabled={status?.loading}
      >
        {status?.loading ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  </section>
);

const ABAS = [
  { id: "geral", label: "Geral" },
  { id: "aparencia", label: "Aparência" },
  { id: "convite", label: "Convite" },
  { id: "avaliacao", label: "Avaliação" },
  { id: "instituicoes", label: "Instituições" },
  { id: "sessoes", label: "Sessões" },
  { id: "certificados", label: "Certificados" },
];

const FormConfiguracoesEvento = ({ eventoSlug, initialData }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abaInicial = searchParams.get("aba");
  const [abaAtiva, setAbaAtiva] = useState(
    ABAS.some((aba) => aba.id === abaInicial) ? abaInicial : "geral"
  );
  //ESTADOS (um status independente por seção: { loading, error, success })
  const [statusSecoes, setStatusSecoes] = useState({});

  // Sessões/subsessões (aba "Sessões") — busca só quando a aba é aberta,
  // já que não faz parte de getEventoConfiguracoes.
  const [sessoes, setSessoes] = useState(null);
  const [carregandoSessoes, setCarregandoSessoes] = useState(false);

  useEffect(() => {
    if (abaAtiva !== "sessoes" || sessoes) return;
    const fetchSessoes = async () => {
      setCarregandoSessoes(true);
      try {
        setSessoes(await getSessoesBySlug(eventoSlug));
      } catch (error) {
        console.error("Erro ao buscar sessões:", error);
      } finally {
        setCarregandoSessoes(false);
      }
    };
    fetchSessoes();
  }, [abaAtiva, eventoSlug, sessoes]);

  // Layouts de certificado (aba "Certificados") — mesmo padrão de busca sob
  // demanda da aba "Sessões".
  const [certificadosLayouts, setCertificadosLayouts] = useState(null);
  const [carregandoCertificados, setCarregandoCertificados] = useState(false);

  useEffect(() => {
    if (abaAtiva !== "certificados" || certificadosLayouts) return;
    const fetchCertificados = async () => {
      setCarregandoCertificados(true);
      try {
        setCertificadosLayouts(await getLayoutCertificados(eventoSlug));
      } catch (error) {
        console.error("Erro ao buscar certificados:", error);
      } finally {
        setCarregandoCertificados(false);
      }
    };
    fetchCertificados();
  }, [abaAtiva, eventoSlug, certificadosLayouts]);

  const atualizarStatus = (id, patch) =>
    setStatusSecoes((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const { control, watch, setValue, getValues, trigger } = useForm({
    resolver: zodResolver(formConfiguracoesEvento),
    defaultValues: {
      nomeEvento: initialData?.nomeEvento || "",
      slug: initialData?.slug || "",
      local: initialData?.local || "",
      telefone: initialData?.telefone || "",
      linkGrupo: initialData?.linkGrupo || "",
      assinatura: initialData?.assinatura || "",
      conteudoDefaultConvite: initialData?.conteudoDefaultConvite || "",
      isbn: initialData?.isbn || "",
      pathBanner: initialData?.pathBanner || "",
      pathBannerMobile: initialData?.pathBannerMobile || "",
      pathLogo: initialData?.pathLogo || "",
      bgColor: initialData?.bgColor || "",
      primaryColor: initialData?.primaryColor || "",
      inicio: isoToBR(initialData?.inicio),
      fim: isoToBR(initialData?.fim),
      permitirSubmissoes: initialData?.permitirSubmissoes === false ? "false" : "true",
      liberarFichaAvaliacao: initialData?.liberarFichaAvaliacao ? "true" : "false",
      depurarComentarioComIA: initialData?.depurarComentarioComIA ? "true" : "false",
      metodoCalculoNota: initialData?.metodoCalculoNota || "MEDIA",
      notaMinimaMencaoHonrosa:
        initialData?.notaMinimaMencaoHonrosa != null
          ? String(initialData.notaMinimaMencaoHonrosa)
          : "",
      notaMinimaPremio:
        initialData?.notaMinimaPremio != null
          ? String(initialData.notaMinimaPremio)
          : "",
    },
  });

  const pathBanner = watch("pathBanner");
  const pathBannerMobile = watch("pathBannerMobile");
  const pathLogo = watch("pathLogo");
  const primaryColor = watch("primaryColor");
  const bgColor = watch("bgColor");

  // Converte o valor bruto de um campo do form pro formato esperado pela API
  const resolverCampo = async (nome, valor) => {
    if (nome === "inicio" || nome === "fim") return brToIso(valor);
    if (["permitirSubmissoes", "liberarFichaAvaliacao", "depurarComentarioComIA"].includes(nome)) {
      return valor === "true";
    }
    if (["notaMinimaMencaoHonrosa", "notaMinimaPremio"].includes(nome)) {
      return valor !== "" ? Number(valor) : undefined;
    }
    if (["pathBanner", "pathBannerMobile", "pathLogo"].includes(nome)) {
      if (!(valor instanceof File)) return valor || undefined;
      const formData = new FormData();
      formData.append("file", valor);
      const { fileUrl } = await uploadImagemEvento(eventoSlug, formData);
      setValue(nome, fileUrl); // troca o File pendente pela URL já salva
      return fileUrl;
    }
    return valor || undefined;
  };

  const salvarSecao = async (id, campos) => {
    const valido = await trigger(campos);
    if (!valido) return;

    atualizarStatus(id, { loading: true, error: "", success: false });
    try {
      const data = getValues();
      const entradas = await Promise.all(
        campos.map(async (nome) => [nome, await resolverCampo(nome, data[nome])])
      );
      const payload = Object.fromEntries(entradas);

      await updateEventoConfiguracoes(eventoSlug, payload);
      atualizarStatus(id, { loading: false, success: true });

      // O slug é a própria rota de admin (/evento/:slug/admin/...) — se ele
      // mudou, a URL atual já não existe mais, então navega pra nova antes
      // que o usuário tente salvar outra seção ou dê refresh na página velha.
      if (payload.slug && payload.slug !== eventoSlug) {
        router.replace(`/evento/${payload.slug}/admin/configuracoes`);
      }
    } catch (error) {
      console.error("Error:", error);
      atualizarStatus(id, {
        loading: false,
        error: error.response?.data?.message ?? "Erro na conexão com o servidor.",
      });
    }
  };

  return (
    <div>
      <div className={styles.abas}>
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            type="button"
            className={`${styles.aba} ${abaAtiva === aba.id ? styles.abaAtiva : ""}`}
            onClick={() => setAbaAtiva(aba.id)}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {abaAtiva === "geral" && (
        <>
          <Secao
            icon={RiInformationLine}
            titulo="Geral"
            descricao="Identificação e informações de contato do evento."
            status={statusSecoes.geral}
            onSalvar={() => salvarSecao("geral", CAMPOS_GERAL)}
          >
            <Input control={control} name="nomeEvento" label="Nome do evento" inputType="text" />
            <div>
              <Input control={control} name="slug" label="Slug (URL)" inputType="text" />
              <p className={styles.dica}>
                Usado na URL pública e na URL desta página de administração
                (/evento/<strong>slug</strong>/...). Apenas letras minúsculas,
                números e hífen. Ao trocar, links antigos com o slug anterior
                param de funcionar.
              </p>
            </div>
            <Input control={control} name="local" label="Local" inputType="text" />
            <Input control={control} name="telefone" label="Telefone" inputType="phone" />
            <Input control={control} name="linkGrupo" label="Link do grupo" inputType="text" />
            <Input control={control} name="isbn" label="ISBN" inputType="text" />
          </Secao>

          <Secao
            icon={RiCalendarEventLine}
            titulo="Datas"
            descricao="Período de realização do evento."
            status={statusSecoes.datas}
            onSalvar={() => salvarSecao("datas", CAMPOS_DATAS)}
          >
            <Input control={control} name="inicio" label="Início" inputType="date" placeholder="DD/MM/AAAA" />
            <Input control={control} name="fim" label="Fim" inputType="date" placeholder="DD/MM/AAAA" />
          </Secao>
        </>
      )}

      {abaAtiva === "aparencia" && (
        <Secao
          icon={RiPaletteLine}
          titulo="Aparência"
          descricao="Cores, banner e logo exibidos na página pública do evento."
          status={statusSecoes.aparencia}
          onSalvar={() => salvarSecao("aparencia", CAMPOS_APARENCIA)}
        >
          <CampoCor control={control} name="primaryColor" label="Cor primária" valor={primaryColor} onChangeSwatch={(v) => setValue("primaryColor", v)} />
          <CampoCor control={control} name="bgColor" label="Cor de fundo" valor={bgColor} onChangeSwatch={(v) => setValue("bgColor", v)} />
          <div className={styles.imagensGrid}>
            <div className={styles.campoImagemGroup}>
              <div className={styles.campoImagemGroupImagens}>
                <CampoImagem label="Banner (desktop)" value={pathBanner} onChange={(f) => setValue("pathBanner", f)} />
                <CampoImagem label="Banner (mobile)" value={pathBannerMobile} onChange={(f) => setValue("pathBannerMobile", f)} />
              </div>
              <p className={styles.dicaImagem}>
                Desktop: proporção 2,6:1 (ex. 1560×600px). Mobile: proporção 4:3
                (ex. 1200×900px). Formatos aceitos: JPG, PNG ou SVG, até 15MB.
                Se não enviar a versão mobile, o banner do desktop é reaproveitado
                (com faixas em branco nas laterais, já que a imagem não é cortada).
              </p>
            </div>
            <CampoImagem label="Logo" value={pathLogo} onChange={(f) => setValue("pathLogo", f)} />
          </div>
        </Secao>
      )}

      {abaAtiva === "convite" && (
        <Secao
          icon={RiMailSendLine}
          titulo="Convite e assinatura"
          descricao="Texto padrão e assinatura usados nos convites enviados a avaliadores."
          status={statusSecoes.convite}
          onSalvar={() => salvarSecao("convite", CAMPOS_CONVITE)}
        >
          <Input control={control} name="assinatura" label="Assinatura" inputType="text" />
          <Textarea control={control} name="conteudoDefaultConvite" label="Conteúdo padrão do convite" maxLength={1000} />
        </Secao>
      )}

      {abaAtiva === "avaliacao" && (
        <>
          <Secao
            icon={RiAwardLine}
            titulo="Avaliação"
            descricao="Regras de submissão e cálculo de nota."
            status={statusSecoes.avaliacao}
            onSalvar={() => salvarSecao("avaliacao", CAMPOS_AVALIACAO)}
          >
            <div className={styles.checkboxGrid}>
              <Input control={control} name="permitirSubmissoes" label="Permitir submissões" inputType="checkbox" />
              <Input control={control} name="liberarFichaAvaliacao" label="Liberar ficha de avaliação" inputType="checkbox" />
              <Input control={control} name="depurarComentarioComIA" label="Depurar comentário com IA" inputType="checkbox" />
            </div>
            <Select control={control} name="metodoCalculoNota" label="Método de cálculo da nota" options={METODO_CALCULO_NOTA_OPTIONS} />
            <Input control={control} name="notaMinimaMencaoHonrosa" label="Nota mínima para menção honrosa" inputType="number" />
            <Input control={control} name="notaMinimaPremio" label="Nota mínima para prêmio" inputType="number" />
          </Secao>

          <FormMoldeResumo
            eventoSlug={eventoSlug}
            initialPartes={initialData?.moldeResumo?.partes}
          />

          <FormCategorias
            eventoSlug={eventoSlug}
            initialOptions={initialData?.categorias?.options}
          />

          <FormCriteriosAvaliacao eventoSlug={eventoSlug} />
        </>
      )}

      {abaAtiva === "instituicoes" && (
        <>
          <FormInstituicoesParceiras
            eventoSlug={eventoSlug}
            initialParceiras={initialData?.instituicoesParceiras}
          />

          <FormTenantsVinculados
            eventoSlug={eventoSlug}
            initialTenantsVinculados={initialData?.tenantsVinculados}
          />
        </>
      )}

      {abaAtiva === "sessoes" && (
        <>
          {carregandoSessoes && (
            <p className={styles.dica}>Carregando sessões...</p>
          )}
          {!carregandoSessoes && sessoes && (
            <FormSessoes
              eventoSlug={eventoSlug}
              initialSessoes={sessoes}
              basePath={`/evento/${eventoSlug}/admin/sessoes`}
            />
          )}
        </>
      )}

      {abaAtiva === "certificados" && (
        <>
          {carregandoCertificados && (
            <p className={styles.dica}>Carregando certificados...</p>
          )}
          {!carregandoCertificados && certificadosLayouts && (
            <FormCertificados
              eventoSlug={eventoSlug}
              initialCertificados={certificadosLayouts}
              evento={initialData}
            />
          )}
        </>
      )}
    </div>
  );
};

export default FormConfiguracoesEvento;
