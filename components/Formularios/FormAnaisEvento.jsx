"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  RiBookOpenLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiFilePdf2Line,
  RiFileTextLine,
  RiFileWordLine,
  RiImageAddLine,
  RiImageLine,
  RiSave2Line,
} from "@remixicon/react";

import styleSecao from "@/components/Formularios/FormConfiguracoesEvento.module.scss";
import styles from "@/components/Formularios/FormAnaisEvento.module.scss";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Textarea from "@/components/Textarea";
import { getAnaisEvento, salvarAnaisEvento, gerarAnaisEvento } from "@/app/api/client/anais";
import { uploadImagemEvento } from "@/app/api/client/eventos";
import { LICENCAS_ANAIS_OPTIONS } from "@/lib/licencasAnais";

// Aba "Anais" das Configurações: dados das páginas iniciais, imagens
// opcionais e a geração dos arquivos PDF e Word (em segundo plano na API —
// enquanto gera, a aba consulta o estado a cada poucos segundos). Os arquivos
// ficam salvos no bucket e são reaproveitados até o admin gerar de novo; a
// aba avisa quando os dados mudaram depois da geração. Entram todas as
// submissões do evento que têm resumo, agrupadas por grande área e área.

const INTERVALO_CONSULTA_MS = 4000;

const IMAGENS = [
  {
    nome: "imagemCapa",
    label: "Capa",
    dica: "Página inteira, A4 retrato (ex. 2480×3508 px). Sobras fora da proporção são cortadas. Sem capa, o PDF começa na folha de rosto.",
  },
  {
    nome: "imagemCabecalho",
    label: "Cabeçalho",
    dica: "Faixa larga no topo das páginas dos trabalhos (ex. 2480×300 px). Substitui o cabeçalho com o título dos Anais.",
  },
  {
    nome: "imagemRodape",
    label: "Rodapé",
    dica: "Faixa larga na base das páginas dos trabalhos (ex. 2480×250 px). O número da página fica logo acima.",
  },
  {
    nome: "imagemModeloPagina",
    label: "Modelo de página",
    dica: "Arte A4 inteira no fundo de todas as páginas menos a capa. Use tons bem claros para não atrapalhar a leitura.",
  },
];

const valoresIniciais = (estado) => {
  const anais = estado?.anais;
  const sugestao = estado?.sugestao || {};
  const texto = (valor) => (valor === null || valor === undefined ? "" : String(valor));
  return {
    titulo: texto(anais ? anais.titulo : sugestao.titulo),
    subtitulo: texto(anais?.subtitulo),
    nomeEventoCitacao: texto(anais ? anais.nomeEventoCitacao : sugestao.nomeEventoCitacao),
    numeroEdicao: texto(anais?.numeroEdicao),
    issn: texto(anais?.issn),
    editora: texto(anais?.editora),
    localPublicacao: texto(anais?.localPublicacao),
    anoPublicacao: texto(anais ? anais.anoPublicacao : sugestao.anoPublicacao),
    organizadores: (anais?.organizadores || []).join("\n"),
    licenca: anais?.licenca || "CC_BY",
    apresentacao: texto(anais?.apresentacao),
    expediente: texto(anais?.expediente),
    fichaCatalografica: texto(anais?.fichaCatalografica),
    imagemCapa: anais?.imagemCapa || "",
    imagemCabecalho: anais?.imagemCabecalho || "",
    imagemRodape: anais?.imagemRodape || "",
    imagemModeloPagina: anais?.imagemModeloPagina || "",
  };
};

const formatarDataHora = (iso) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : "";

const CampoImagemAnais = ({ label, dica, valor, enviando, onEscolher, onRemover }) => {
  const inputRef = useRef();
  return (
    <div className={styles.campoImagem}>
      <p className="p5 mb-1">
        <strong>{label}</strong>
      </p>
      <div
        className={styles.previa}
        onClick={() => !enviando && inputRef.current.click()}
        title="Clique para escolher a imagem (JPG ou PNG)"
      >
        {valor ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={valor} alt={label} />
        ) : (
          <RiImageAddLine />
        )}
        {enviando && <span className={styles.previaEnviando}>Enviando...</span>}
        <input
          type="file"
          ref={inputRef}
          style={{ display: "none" }}
          accept=".jpg,.jpeg,.png"
          onChange={(e) => {
            if (e.target.files[0]) onEscolher(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>
      {valor && (
        <button type="button" className={styles.remover} onClick={onRemover}>
          <RiDeleteBinLine /> Remover
        </button>
      )}
      <p className={styleSecao.dica}>{dica}</p>
    </div>
  );
};

const ARQUIVOS = [
  {
    formato: "pdf",
    rotulo: "PDF",
    icone: RiFilePdf2Line,
    campos: { url: "pdfUrl", data: "pdfGeradoEm", total: "pdfTotalTrabalhos", paginas: "pdfTotalPaginas" },
    descricao: "Diagramado e pronto para publicar. Com milhares de resumos leva alguns minutos.",
  },
  {
    formato: "docx",
    rotulo: "Word",
    icone: RiFileWordLine,
    campos: { url: "docxUrl", data: "docxGeradoEm", total: "docxTotalTrabalhos" },
    descricao:
      "Para editar ou diagramar fora do sistema. Ao abrir, o Word pede para atualizar sumário, índice e páginas das citações.",
  },
];

// Partes da referência (api-plic/src/services/anais/referenciaAnais.js).
const MOTIVOS_DESATUALIZADO = {
  resumos: "resumos ou autores foram incluídos ou alterados",
  configuracao: "as configurações dos Anais mudaram",
  evento: "dados do evento (nome, local, datas, ISBN, cor ou divulgação das premiações) mudaram",
};

const CartaoArquivo = ({ arquivo, anais, gerando, motivos, desabilitado, onGerar }) => {
  const { campos } = arquivo;
  const url = anais?.[campos.url];
  const esteGerando = gerando === arquivo.formato;
  return (
    <div className={styles.cartaoArquivo}>
      <p className="p5">
        <strong>{arquivo.rotulo}</strong>
      </p>
      <p className={styleSecao.dica}>{arquivo.descricao}</p>
      {esteGerando ? (
        <p className="p5 mt-1">
          <strong>Gerando...</strong> Pode sair desta tela, a geração continua no servidor.
          {anais?.geracaoIniciadaEm && ` Iniciada em ${formatarDataHora(anais.geracaoIniciadaEm)}.`}
        </p>
      ) : url ? (
        <p className="p5 mt-1">
          Gerado em {formatarDataHora(anais[campos.data])}
          {anais[campos.total] != null && ` · ${anais[campos.total]} trabalhos`}
          {campos.paginas && anais[campos.paginas] != null && ` · ${anais[campos.paginas]} páginas`}.
        </p>
      ) : (
        <p className="p5 mt-1">Ainda não gerado.</p>
      )}
      {url && !esteGerando && motivos?.length > 0 && (
        <p className={styles.avisoDesatualizado}>
          Pode estar desatualizado: {motivos.map((motivo) => MOTIVOS_DESATUALIZADO[motivo] || motivo).join("; ")}{" "}
          desde a geração. Gere de novo para incluir as mudanças.
        </p>
      )}
      <div className={styles.acoesGeracao}>
        {url && !esteGerando && (
          <a href={url} target="_blank" rel="noreferrer" className={styles.linkPdf}>
            <RiExternalLinkLine /> {arquivo.formato === "pdf" ? "Abrir" : "Baixar"} {arquivo.rotulo}
          </a>
        )}
        <Button
          icon={arquivo.icone}
          className={url ? "btn-secondary" : "btn-primary"}
          type="button"
          onClick={onGerar}
          disabled={desabilitado}
        >
          {esteGerando ? "Gerando..." : url ? "Gerar novamente" : `Gerar ${arquivo.rotulo}`}
        </Button>
      </div>
    </div>
  );
};

const FormAnaisEvento = ({ eventoSlug }) => {
  const [estado, setEstado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [statusSalvar, setStatusSalvar] = useState({});
  const [erroGerar, setErroGerar] = useState("");
  const [enviandoImagem, setEnviandoImagem] = useState(null);

  const { control, watch, setValue, getValues, reset, formState } = useForm({
    defaultValues: valoresIniciais(null),
  });

  const carregar = useCallback(async () => {
    const dados = await getAnaisEvento(eventoSlug);
    setEstado(dados);
    return dados;
  }, [eventoSlug]);

  useEffect(() => {
    carregar()
      .then((dados) => reset(valoresIniciais(dados)))
      .catch(() => setErroCarregar("Erro ao carregar os Anais do evento."))
      .finally(() => setCarregando(false));
  }, [carregar, reset]);

  // Enquanto a API gera o PDF, consulta o estado até terminar.
  const gerando = estado?.gerando || null; // "pdf" | "docx" | null
  useEffect(() => {
    if (!gerando) return undefined;
    const intervalo = setInterval(() => {
      carregar().catch(() => {});
    }, INTERVALO_CONSULTA_MS);
    return () => clearInterval(intervalo);
  }, [gerando, carregar]);

  const payload = () => {
    const dados = getValues();
    return {
      ...dados,
      organizadores: dados.organizadores
        .split("\n")
        .map((nome) => nome.trim())
        .filter(Boolean),
    };
  };

  const salvar = async () => {
    setSalvando(true);
    setStatusSalvar({});
    try {
      const dados = await salvarAnaisEvento(eventoSlug, payload());
      setEstado(dados);
      reset(getValues());
      setStatusSalvar({ success: true });
      return true;
    } catch (error) {
      setStatusSalvar({ error: error.response?.data?.message ?? "Erro na conexão com o servidor." });
      return false;
    } finally {
      setSalvando(false);
    }
  };

  // Salva antes de gerar, pra o arquivo sair com o que está na tela.
  const salvarEGerar = async (formato) => {
    setErroGerar("");
    if (!estado?.anais || formState.isDirty) {
      const ok = await salvar();
      if (!ok) {
        setErroGerar("Corrija as configurações abaixo antes de gerar os arquivos.");
        return;
      }
    }
    try {
      const dados = await gerarAnaisEvento(eventoSlug, formato);
      setEstado(dados);
    } catch (error) {
      setErroGerar(error.response?.data?.message ?? "Erro na conexão com o servidor.");
    }
  };

  const escolherImagem = async (nome, arquivo) => {
    if (!["image/jpeg", "image/png"].includes(arquivo.type)) {
      setStatusSalvar({ error: "Use imagens JPG ou PNG." });
      return;
    }
    if (arquivo.size > 15 * 1024 * 1024) {
      setStatusSalvar({ error: "A imagem excede o limite de 15MB." });
      return;
    }
    setEnviandoImagem(nome);
    setStatusSalvar({});
    try {
      const formData = new FormData();
      formData.append("file", arquivo);
      const { fileUrl } = await uploadImagemEvento(eventoSlug, formData);
      setValue(nome, fileUrl, { shouldDirty: true });
    } catch (error) {
      setStatusSalvar({ error: error.response?.data?.message ?? "Erro ao enviar a imagem." });
    } finally {
      setEnviandoImagem(null);
    }
  };

  if (carregando) return <p className={styleSecao.dica}>Carregando Anais...</p>;
  if (erroCarregar) return <p className={styleSecao.statusErro}>{erroCarregar}</p>;

  const anais = estado?.anais;
  const totalResumos = estado?.totalResumos ?? 0;

  return (
    <>
      <section className={styleSecao.section}>
        <div className={styleSecao.sectionHead}>
          <div className={styleSecao.sectionIcon}>
            <RiFilePdf2Line />
          </div>
          <div>
            <h6>Arquivos dos Anais</h6>
            <p>
              Reúnem os resumos de todas as {totalResumos} submissões do evento, agrupados por
              grande área e área, com sumário, &quot;Como citar&quot; em cada trabalho e índice de
              autores. Os selos de premiação só aparecem se a divulgação estiver liberada (aba
              Avaliação). Cada arquivo fica salvo e pode ser baixado quantas vezes quiser — só é
              preciso gerar de novo quando os dados mudarem.
            </p>
          </div>
        </div>
        <div className={styles.painelGeracao}>
          {!gerando && anais?.erroGeracao && (
            <p className={styleSecao.statusErro}>Última tentativa falhou: {anais.erroGeracao}</p>
          )}
          {erroGerar && <p className={styleSecao.statusErro}>{erroGerar}</p>}
          <div className={styles.arquivos}>
            {ARQUIVOS.map((arquivo) => (
              <CartaoArquivo
                key={arquivo.formato}
                arquivo={arquivo}
                anais={anais}
                gerando={gerando}
                motivos={estado?.desatualizado?.[arquivo.formato]}
                desabilitado={Boolean(gerando) || salvando || totalResumos === 0}
                onGerar={() => salvarEGerar(arquivo.formato)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className={styleSecao.section}>
        <div className={styleSecao.sectionHead}>
          <div className={styleSecao.sectionIcon}>
            <RiBookOpenLine />
          </div>
          <div>
            <h6>Publicação</h6>
            <p>
              Folha de rosto, créditos e a referência ABNT de cada trabalho. O ISBN é o da aba
              Geral{estado?.isbn ? ` (${estado.isbn})` : " (não informado)"}.
            </p>
          </div>
        </div>
        <div className={styleSecao.sectionGrid}>
          <Input control={control} name="titulo" label="Título dos Anais" inputType="text" />
          <Input control={control} name="subtitulo" label="Subtítulo (opcional)" inputType="text" />
          <div>
            <Input
              control={control}
              name="nomeEventoCitacao"
              label="Nome do evento na referência"
              inputType="text"
            />
            <p className={styleSecao.dica}>
              Sem o número da edição — sai em maiúsculas em &quot;In: NOME DO EVENTO, 31., 2025,
              Brasília&quot;.
            </p>
          </div>
          <div className={styles.linha}>
            <Input control={control} name="numeroEdicao" label="Nº da edição" inputType="number" />
            <Input control={control} name="issn" label="ISSN" inputType="text" placeholder="1234-5679" />
            <Input control={control} name="anoPublicacao" label="Ano de publicação" inputType="number" />
          </div>
          <div className={styles.linha}>
            <Input control={control} name="editora" label="Editora" inputType="text" />
            <Input control={control} name="localPublicacao" label="Local de publicação (cidade)" inputType="text" />
          </div>
          <Select control={control} name="licenca" label="Licença" options={LICENCAS_ANAIS_OPTIONS} />
          <Textarea
            control={control}
            name="organizadores"
            label="Organizadores (um por linha)"
            maxLength={5000}
          />
        </div>
      </section>

      <section className={styleSecao.section}>
        <div className={styleSecao.sectionHead}>
          <div className={styleSecao.sectionIcon}>
            <RiFileTextLine />
          </div>
          <div>
            <h6>Páginas iniciais</h6>
            <p>Cada uma só entra no PDF se estiver preenchida.</p>
          </div>
        </div>
        <div className={styleSecao.sectionGrid}>
          <Textarea control={control} name="apresentacao" label="Apresentação" maxLength={30000} />
          <div>
            <Textarea control={control} name="expediente" label="Expediente" maxLength={30000} />
            <p className={styleSecao.dica}>
              Separe os grupos por uma linha em branco. Em cada grupo, a 1ª linha é o nome (ex.
              &quot;Comissão organizadora&quot;) e as seguintes, as pessoas.
            </p>
          </div>
          <div>
            <Textarea
              control={control}
              name="fichaCatalografica"
              label="Ficha catalográfica"
              maxLength={5000}
            />
            <p className={styleSecao.dica}>
              Texto da ficha fornecida pela biblioteca, como deve sair dentro do quadro (espaços e
              quebras de linha são mantidos).
            </p>
          </div>
        </div>
      </section>

      <section className={styleSecao.section}>
        <div className={styleSecao.sectionHead}>
          <div className={styleSecao.sectionIcon}>
            <RiImageLine />
          </div>
          <div>
            <h6>Capa, cabeçalho e rodapé</h6>
            <p>Todas opcionais. JPG ou PNG, até 15MB.</p>
          </div>
        </div>
        <div className={styles.imagensGrid}>
          {IMAGENS.map((imagem) => (
            <CampoImagemAnais
              key={imagem.nome}
              {...imagem}
              valor={watch(imagem.nome)}
              enviando={enviandoImagem === imagem.nome}
              onEscolher={(arquivo) => escolherImagem(imagem.nome, arquivo)}
              onRemover={() => setValue(imagem.nome, "", { shouldDirty: true })}
            />
          ))}
        </div>
        <div className={styleSecao.sectionFooter}>
          {statusSalvar.success && <p className={styleSecao.statusSucesso}>Salvo!</p>}
          {statusSalvar.error && <p className={styleSecao.statusErro}>{statusSalvar.error}</p>}
          <Button
            icon={RiSave2Line}
            className="btn-secondary"
            type="button"
            onClick={salvar}
            disabled={salvando || Boolean(enviandoImagem)}
          >
            {salvando ? "Salvando..." : "Salvar configurações dos Anais"}
          </Button>
        </div>
      </section>
    </>
  );
};

export default FormAnaisEvento;
