"use client";

//HOOKS
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formConfiguracoesEvento } from "@/lib/zodSchemas/formConfiguracoesEvento";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import {
  RiAwardLine,
  RiCalendarEventLine,
  RiImageAddLine,
  RiInformationLine,
  RiMailSendLine,
  RiPaletteLine,
  RiSave2Line,
} from "@remixicon/react";

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
import { resolveEventoImageSrc } from "@/lib/resolveEventoImage";
import FormInstituicoesParceiras from "@/components/Formularios/FormInstituicoesParceiras";

const METODO_CALCULO_NOTA_OPTIONS = [
  { value: "MEDIA", label: "Média das avaliações" },
  { value: "ULTIMA_AVALIACAO", label: "Última avaliação" },
];

const CAMPOS_GERAL = ["nomeEvento", "slug", "local", "telefone", "linkGrupo", "isbn"];
const CAMPOS_DATAS = ["inicio", "fim"];
const CAMPOS_CONVITE = ["assinatura", "conteudoDefaultConvite"];
const CAMPOS_APARENCIA = ["primaryColor", "bgColor", "pathBanner", "pathBannerMobile", "pathLogo", "bgImg"];
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

// Cada card tem seu próprio botão de salvar, discreto, que envia só os
// campos daquela seção (update parcial) em vez de um submit único da página.
const Secao = ({ icon: Icon, titulo, status, onSalvar, children }) => (
  <div className={styles.secao}>
    <div className={styles.secaoHead}>
      <div className={styles.secaoIcon}>
        <Icon />
      </div>
      <h6>{titulo}</h6>
    </div>
    <div className={styles.secaoContent}>{children}</div>
    <div className={styles.secaoFooter}>
      {status?.success && <p className={styles.statusSucesso}>Salvo!</p>}
      {status?.error && <p className={styles.statusErro}>{status.error}</p>}
      <div className={styles.secaoBotao}>
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
    </div>
  </div>
);

const FormConfiguracoesEvento = ({ eventoSlug, initialData }) => {
  const router = useRouter();
  //ESTADOS (um status independente por seção: { loading, error, success })
  const [statusSecoes, setStatusSecoes] = useState({});

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
      bgImg: initialData?.bgImg || "",
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
  const bgImg = watch("bgImg");
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
    if (["pathBanner", "pathBannerMobile", "pathLogo", "bgImg"].includes(nome)) {
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
    <div className={`${styles.formulario} ${styles.formularioConfiguracoes}`}>
      <Secao
        icon={RiInformationLine}
        titulo="Geral"
        status={statusSecoes.geral}
        onSalvar={() => salvarSecao("geral", CAMPOS_GERAL)}
      >
        <div className={styles.secaoGrid}>
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
        </div>
      </Secao>

      <Secao
        icon={RiCalendarEventLine}
        titulo="Datas"
        status={statusSecoes.datas}
        onSalvar={() => salvarSecao("datas", CAMPOS_DATAS)}
      >
        <div className={styles.secaoGrid}>
          <Input control={control} name="inicio" label="Início" inputType="date" placeholder="DD/MM/AAAA" />
          <Input control={control} name="fim" label="Fim" inputType="date" placeholder="DD/MM/AAAA" />
        </div>
      </Secao>

      <Secao
        icon={RiMailSendLine}
        titulo="Convite e assinatura"
        status={statusSecoes.convite}
        onSalvar={() => salvarSecao("convite", CAMPOS_CONVITE)}
      >
        <div className={styles.secaoGrid}>
          <Input control={control} name="assinatura" label="Assinatura" inputType="text" />
        </div>
        <div className={`${styles.secaoGrid} mt-2`}>
          <Textarea control={control} name="conteudoDefaultConvite" label="Conteúdo padrão do convite" maxLength={1000} />
        </div>
      </Secao>

      <Secao
        icon={RiPaletteLine}
        titulo="Aparência"
        status={statusSecoes.aparencia}
        onSalvar={() => salvarSecao("aparencia", CAMPOS_APARENCIA)}
      >
        <div className={styles.secaoGrid}>
          <CampoCor control={control} name="primaryColor" label="Cor primária" valor={primaryColor} onChangeSwatch={(v) => setValue("primaryColor", v)} />
          <CampoCor control={control} name="bgColor" label="Cor de fundo" valor={bgColor} onChangeSwatch={(v) => setValue("bgColor", v)} />
        </div>
        <div className={`${styles.imagensGrid} mt-2`}>
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
          <CampoImagem label="Imagem de fundo" value={bgImg} onChange={(f) => setValue("bgImg", f)} />
        </div>
      </Secao>

      <Secao
        icon={RiAwardLine}
        titulo="Avaliação"
        status={statusSecoes.avaliacao}
        onSalvar={() => salvarSecao("avaliacao", CAMPOS_AVALIACAO)}
      >
        <div className={styles.checkboxGrid}>
          <Input control={control} name="permitirSubmissoes" label="Permitir submissões" inputType="checkbox" />
          <Input control={control} name="liberarFichaAvaliacao" label="Liberar ficha de avaliação" inputType="checkbox" />
          <Input control={control} name="depurarComentarioComIA" label="Depurar comentário com IA" inputType="checkbox" />
        </div>
        <div className={`${styles.secaoGrid} mt-2`}>
          <Select control={control} name="metodoCalculoNota" label="Método de cálculo da nota" options={METODO_CALCULO_NOTA_OPTIONS} />
          <Input control={control} name="notaMinimaMencaoHonrosa" label="Nota mínima para menção honrosa" inputType="number" />
          <Input control={control} name="notaMinimaPremio" label="Nota mínima para prêmio" inputType="number" />
        </div>
      </Secao>

      <FormInstituicoesParceiras
        eventoSlug={eventoSlug}
        initialParceiras={initialData?.instituicoesParceiras}
      />
    </div>
  );
};

export default FormConfiguracoesEvento;
