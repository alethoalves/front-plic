"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styleSecao from "@/components/Formularios/FormConfiguracoesEvento.module.scss";
import stylesCert from "./FormCertificados.module.scss";
import styles from "./FormCertificadosFuncao.module.scss";
import styleTextarea from "@/components/Textarea.module.scss";
import {
  RiAddCircleLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiDownload2Line,
  RiImageAddLine,
  RiPencilLine,
  RiSearchLine,
  RiTeamLine,
  RiUserStarLine,
} from "@remixicon/react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import Image from "next/image";
import {
  CAMPOS_POR_TIPO,
  CAMPOS_COMUNS,
  resolverTextoPreview,
  funcaoComGenero,
  formatarCargaHoraria,
  getModelosCertificadoFuncao,
  criarModeloCertificadoFuncao,
  atualizarModeloCertificadoFuncao,
  excluirModeloCertificadoFuncao,
  uploadImagemModeloCertificadoFuncao,
  consultarCpfCertificadoFuncao,
  getPessoasCertificadoFuncao,
  adicionarPessoaCertificadoFuncao,
  atualizarPessoaCertificadoFuncao,
  removerPessoaCertificadoFuncao,
  generateAndDownloadCertificadoFuncaoPDF,
} from "@/app/api/client/certificado";

const TEXTO_MAX_LENGTH = 3000;
// Mesma escala do certificado gerado (1123x794) — ver FormCertificados.jsx
const CERTIFICADO_LARGURA = 1123;
const CERTIFICADO_ALTURA = 794;

const apenasNumeros = (valor) => (valor || "").replace(/\D/g, "");

const mascararCpf = (valor) => {
  const d = apenasNumeros(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};

// "" → null (limpa), senão inteiro positivo; undefined = inválido
const lerCargaHoraria = (valor) => {
  const texto = String(valor ?? "").trim();
  if (texto === "") return null;
  const n = Number(texto);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

/* --------------------------- Aba "Modelo" --------------------------- */

const EditorModelo = ({ eventoSlug, evento, modelo, onAtualizado, onExcluido }) => {
  const [form, setForm] = useState(() => ({
    funcaoMasculino: modelo.funcaoMasculino,
    funcaoFeminino: modelo.funcaoFeminino,
    cargaHorariaPadrao: modelo.cargaHorariaPadrao ?? "",
    texto: modelo.texto || "",
    posicaoTextoX: modelo.posicaoTextoX ?? 80,
    posicaoTextoY: modelo.posicaoTextoY ?? 260,
    liberado: modelo.liberado,
  }));
  const [status, setStatus] = useState({});
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erroImagem, setErroImagem] = useState("");
  const fileInputRef = useRef();
  const textareaRef = useRef();

  const set = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setStatus({});
  };

  const funcaoImpressa = funcaoComGenero(form.funcaoMasculino, form.funcaoFeminino);
  const cargaPadrao = lerCargaHoraria(form.cargaHorariaPadrao);

  // Insere o campo onde o cursor está (não só no fim, como no FormCertificados)
  const handleInserirCampo = (chave) => {
    const marcador = `<<[${chave}]>>`;
    const el = textareaRef.current;
    setForm((atual) => {
      const inicio = el?.selectionStart ?? atual.texto.length;
      const fim = el?.selectionEnd ?? atual.texto.length;
      return { ...atual, texto: atual.texto.slice(0, inicio) + marcador + atual.texto.slice(fim) };
    });
    setStatus({});
  };

  const handleSalvar = async () => {
    if (cargaPadrao === undefined) {
      setStatus({ error: "Carga horária padrão deve ser um número inteiro de horas." });
      return;
    }
    setStatus({ loading: true });
    try {
      const atualizado = await atualizarModeloCertificadoFuncao(eventoSlug, modelo.id, {
        funcaoMasculino: form.funcaoMasculino,
        funcaoFeminino: form.funcaoFeminino,
        cargaHorariaPadrao: cargaPadrao,
        texto: form.texto,
        posicaoTextoX: Number(form.posicaoTextoX),
        posicaoTextoY: Number(form.posicaoTextoY),
        liberado: form.liberado,
      });
      onAtualizado(atualizado);
      setStatus({ success: true });
    } catch (err) {
      setStatus({ error: err.message });
    }
  };

  const handleImagem = async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    const formData = new FormData();
    formData.append("file", arquivo);
    setEnviandoImagem(true);
    setErroImagem("");
    try {
      onAtualizado(await uploadImagemModeloCertificadoFuncao(eventoSlug, modelo.id, formData));
    } catch (err) {
      setErroImagem(err.message);
    } finally {
      setEnviandoImagem(false);
      e.target.value = "";
    }
  };

  const handleExcluir = async () => {
    if (!window.confirm(`Excluir o modelo "${funcaoImpressa}"?`)) return;
    try {
      await excluirModeloCertificadoFuncao(eventoSlug, modelo.id);
      onExcluido(modelo.id);
    } catch (err) {
      setStatus({ error: err.message });
    }
  };

  const x = Number(form.posicaoTextoX) || 0;
  const y = Number(form.posicaoTextoY) || 0;

  return (
    <div className={styles.editor}>
      <div className={styles.linhaCampos}>
        <label className={styles.campo}>
          <span>Função (masculino)</span>
          <input className={styles.input} value={form.funcaoMasculino} onChange={set("funcaoMasculino")} placeholder="Ex.: Monitor" maxLength={80} />
        </label>
        <label className={styles.campo}>
          <span>Função (feminino)</span>
          <input className={styles.input} value={form.funcaoFeminino} onChange={set("funcaoFeminino")} placeholder="Ex.: Monitora" maxLength={80} />
        </label>
        <label className={`${styles.campo} ${styles.campoCurto}`}>
          <span>Carga horária padrão (h)</span>
          <input className={styles.input} value={form.cargaHorariaPadrao} onChange={set("cargaHorariaPadrao")} inputMode="numeric" placeholder="Opcional" />
        </label>
      </div>
      <p className={styleSecao.dica}>
        No certificado: <strong>{funcaoImpressa || "—"}</strong>. A carga horária padrão vale para quem
        estiver sem carga horária própria na lista; se ficar vazia, a frase da carga horária some.
      </p>

      <div className={`${stylesCert.bgCertificado} mt-2`} onClick={() => fileInputRef.current.click()}>
        <div className={stylesCert.certificadoImg}>
          {modelo.imagemFundo ? (
            <Image
              priority
              fill
              src={modelo.imagemFundo}
              alt={`Certificado de ${funcaoImpressa}`}
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <RiImageAddLine />
          )}
        </div>
        <div
          className={stylesCert.certificadoTextoOverlay}
          style={{
            left: `${(x / CERTIFICADO_LARGURA) * 100}%`,
            top: `${(y / CERTIFICADO_ALTURA) * 100}%`,
            width: `calc(100% - ${((x / CERTIFICADO_LARGURA) * 100 * 2).toFixed(2)}%)`,
          }}
        >
          {resolverTextoPreview(form.texto, "FUNCAO", evento, {
            funcao: funcaoImpressa,
            cargaHoraria: formatarCargaHoraria(cargaPadrao),
          })}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".jpg,.jpeg,.png,.svg"
          onChange={handleImagem}
        />
      </div>
      <p className={stylesCert.previewLabel}>
        Prévia com nome de exemplo — clique na imagem para {modelo.imagemFundo ? "trocar" : "enviar"} o fundo (JPG, PNG ou SVG, proporção A4 deitada)
      </p>
      {enviandoImagem && <p className={stylesCert.uploading}>Enviando arquivo...</p>}
      {erroImagem && <p className={styleSecao.statusErro}>{erroImagem}</p>}

      <div className={`${styles.linhaCampos} mt-2`}>
        <label className={styles.campo}>
          <span>Margem esquerda do texto: {x}px</span>
          <input type="range" min={0} max={500} value={x} onChange={set("posicaoTextoX")} />
        </label>
        <label className={styles.campo}>
          <span>Distância do topo: {y}px</span>
          <input type="range" min={0} max={700} value={y} onChange={set("posicaoTextoY")} />
        </label>
      </div>

      <div className={`${styleTextarea.textareaLabel} mt-2`}>
        <p>
          Texto do certificado&nbsp;({form.texto.length}/{TEXTO_MAX_LENGTH})
        </p>
        <textarea
          ref={textareaRef}
          className={styleTextarea.textarea}
          value={form.texto}
          maxLength={TEXTO_MAX_LENGTH}
          onChange={set("texto")}
          placeholder="Texto exibido no certificado. Use os campos abaixo para inserir dados de cada pessoa."
        />
      </div>
      <div className={`${stylesCert.campos} mt-1`}>
        {[...CAMPOS_POR_TIPO.FUNCAO, ...CAMPOS_COMUNS].map((campo) => (
          <button
            key={campo.key}
            type="button"
            className={stylesCert.campoChip}
            onClick={() => handleInserirCampo(campo.key)}
          >
            + {campo.label}
          </button>
        ))}
      </div>
      <p className={styleSecao.dica}>
        &quot;Carga horária&quot; já entra com a vírgula e a frase (&quot;, com carga horária de 20 horas&quot;), e some quando não houver.
      </p>

      <label className={`${styles.checkbox} mt-2`}>
        <input type="checkbox" checked={form.liberado} onChange={set("liberado")} />
        <span>
          Liberar na busca pública — quem estiver na lista encontra e baixa o certificado pelo CPF na página de certificados do evento
        </span>
      </label>

      <div className={styleSecao.sectionFooter}>
        {status.success && <p className={styleSecao.statusSucesso}>Salvo!</p>}
        {status.error && <p className={styleSecao.statusErro}>{status.error}</p>}
        {modelo._count?.certificados === 0 && (
          <Button icon={RiDeleteBinLine} className="btn-error" type="button" onClick={handleExcluir}>
            Excluir modelo
          </Button>
        )}
        <Button className="btn-secondary" type="button" onClick={handleSalvar} disabled={status.loading}>
          {status.loading ? "Salvando..." : "Salvar modelo"}
        </Button>
      </div>
    </div>
  );
};

/* --------------------------- Aba "Pessoas" --------------------------- */

const ORIGEM_NOME = {
  usuario: "Nome da conta da pessoa no PLIC.",
  receita: "Nome encontrado na consulta de CPF.",
};

const ListaPessoas = ({ eventoSlug, evento, modelo, onTotalAlterado }) => {
  const [pessoas, setPessoas] = useState(null);
  const [erroLista, setErroLista] = useState("");
  const [cpf, setCpf] = useState("");
  const [consulta, setConsulta] = useState(null); // { cpf, nome, origem, jaNaLista }
  const [nome, setNome] = useState("");
  const [carga, setCarga] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [erroAdd, setErroAdd] = useState("");
  const [filtro, setFiltro] = useState("");
  const [editando, setEditando] = useState(null); // { id, nome, carga }
  const [erroEdit, setErroEdit] = useState("");
  const [baixando, setBaixando] = useState({});
  const cpfRef = useRef();

  useEffect(() => {
    let ativo = true;
    getPessoasCertificadoFuncao(eventoSlug, modelo.id)
      .then((lista) => ativo && setPessoas(lista))
      .catch((err) => ativo && setErroLista(err.message));
    return () => {
      ativo = false;
    };
  }, [eventoSlug, modelo.id]);

  const atualizarLista = (fn) => {
    const nova = fn(pessoas || []);
    setPessoas(nova);
    onTotalAlterado(nova.length);
  };

  const limparConsulta = () => {
    setConsulta(null);
    setNome("");
    setCarga("");
    setErroAdd("");
  };

  const handleConsultar = async (e) => {
    e.preventDefault();
    if (apenasNumeros(cpf).length !== 11) {
      setErroAdd("Digite os 11 dígitos do CPF.");
      return;
    }
    setConsultando(true);
    limparConsulta();
    try {
      const resultado = await consultarCpfCertificadoFuncao(eventoSlug, modelo.id, apenasNumeros(cpf));
      setConsulta(resultado);
      setNome(resultado.nome || "");
    } catch (err) {
      setErroAdd(err.message);
    } finally {
      setConsultando(false);
    }
  };

  const handleAdicionar = async () => {
    const cargaHoraria = lerCargaHoraria(carga);
    if (cargaHoraria === undefined) {
      setErroAdd("Carga horária deve ser um número inteiro de horas.");
      return;
    }
    if (nome.trim().length < 3) {
      setErroAdd("Informe o nome completo.");
      return;
    }
    setAdicionando(true);
    setErroAdd("");
    try {
      const pessoa = await adicionarPessoaCertificadoFuncao(eventoSlug, modelo.id, {
        cpf: consulta.cpf,
        nome: nome.trim(),
        cargaHoraria,
      });
      atualizarLista((lista) =>
        [...lista, pessoa].sort((a, b) => a.nomeDestinatario.localeCompare(b.nomeDestinatario, "pt-BR"))
      );
      limparConsulta();
      setCpf("");
      cpfRef.current?.focus();
    } catch (err) {
      setErroAdd(err.message);
    } finally {
      setAdicionando(false);
    }
  };

  const handleSalvarEdicao = async () => {
    const cargaHoraria = lerCargaHoraria(editando.carga);
    if (cargaHoraria === undefined) {
      setErroEdit("Carga horária deve ser um número inteiro de horas.");
      return;
    }
    if (editando.nome.trim().length < 3) {
      setErroEdit("Informe o nome completo.");
      return;
    }
    try {
      const atualizada = await atualizarPessoaCertificadoFuncao(eventoSlug, modelo.id, editando.id, {
        nome: editando.nome.trim(),
        cargaHoraria,
      });
      atualizarLista((lista) => lista.map((p) => (p.id === atualizada.id ? atualizada : p)));
      setEditando(null);
      setErroEdit("");
    } catch (err) {
      setErroEdit(err.message);
    }
  };

  const handleRemover = async (pessoa) => {
    const ok = window.confirm(
      `Remover ${pessoa.nomeDestinatario} da lista?\n\nO código ${pessoa.codigo} deixa de valer: um PDF que já tenha sido enviado não vai mais passar na autenticação.`
    );
    if (!ok) return;
    try {
      await removerPessoaCertificadoFuncao(eventoSlug, modelo.id, pessoa.id);
      atualizarLista((lista) => lista.filter((p) => p.id !== pessoa.id));
    } catch (err) {
      setErroLista(err.message);
    }
  };

  const handleBaixar = async (pessoa) => {
    setBaixando((atual) => ({ ...atual, [pessoa.id]: true }));
    try {
      await generateAndDownloadCertificadoFuncaoPDF(evento.id, pessoa.codigo);
    } catch (err) {
      setErroLista(err.message);
    } finally {
      setBaixando((atual) => ({ ...atual, [pessoa.id]: false }));
    }
  };

  const pessoasFiltradas = useMemo(() => {
    if (!pessoas) return [];
    const termo = filtro.trim().toLowerCase();
    if (!termo) return pessoas;
    const termoCpf = apenasNumeros(termo);
    return pessoas.filter(
      (p) =>
        p.nomeDestinatario.toLowerCase().includes(termo) ||
        (termoCpf && p.cpfDestinatario.includes(termoCpf)) ||
        p.codigo.toLowerCase() === termo
    );
  }, [pessoas, filtro]);

  return (
    <div className={styles.pessoas}>
      {!modelo.imagemFundo && (
        <p className={styles.aviso}>
          Este modelo ainda não tem imagem de fundo — dá pra montar a lista, mas envie o fundo na aba
          &quot;Modelo&quot; antes de baixar os certificados.
        </p>
      )}

      <form onSubmit={handleConsultar} className={styles.linhaCampos}>
        <label className={`${styles.campo} ${styles.campoCpf}`}>
          <span>CPF</span>
          <input
            ref={cpfRef}
            className={styles.input}
            value={cpf}
            onChange={(e) => {
              setCpf(mascararCpf(e.target.value));
              if (consulta) limparConsulta();
            }}
            placeholder="000.000.000-00"
            inputMode="numeric"
          />
        </label>
        <div className={styles.botaoLinha}>
          <Button icon={RiSearchLine} className="btn-secondary" type="submit" disabled={consultando}>
            {consultando ? "Consultando..." : "Consultar"}
          </Button>
        </div>
      </form>

      {consulta && consulta.jaNaLista && (
        <p className={styles.aviso}>
          {consulta.jaNaLista.nomeDestinatario} já está na lista deste modelo (código {consulta.jaNaLista.codigo}).
        </p>
      )}

      {consulta && !consulta.jaNaLista && (
        <div className={styles.confirmacao}>
          <div className={styles.linhaCampos}>
            <label className={styles.campo}>
              <span>Nome no certificado</span>
              <input
                className={styles.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                maxLength={200}
                autoFocus={!consulta.nome}
              />
            </label>
            <label className={`${styles.campo} ${styles.campoCurto}`}>
              <span>Carga horária (h)</span>
              <input
                className={styles.input}
                value={carga}
                onChange={(e) => setCarga(e.target.value)}
                inputMode="numeric"
                placeholder={modelo.cargaHorariaPadrao ? `Padrão: ${modelo.cargaHorariaPadrao}` : "Opcional"}
              />
            </label>
          </div>
          <p className={styleSecao.dica}>
            {ORIGEM_NOME[consulta.origem] ||
              "Não encontramos o nome deste CPF — digite o nome completo."}{" "}
            Confira antes de confirmar: é assim que o nome vai sair no certificado.
          </p>
          <div className={styles.acoesConfirmacao}>
            <button type="button" className={styles.botaoSecundario} onClick={limparConsulta}>
              <RiCloseLine size={14} /> Cancelar
            </button>
            <Button icon={RiCheckLine} className="btn-primary" type="button" onClick={handleAdicionar} disabled={adicionando}>
              {adicionando ? "Adicionando..." : "Confirmar e adicionar"}
            </Button>
          </div>
        </div>
      )}
      {erroAdd && <p className={styleSecao.statusErro}>{erroAdd}</p>}

      <div className={styles.cabecalhoLista}>
        <h6>
          {pessoas ? `${pessoas.length} pessoa${pessoas.length === 1 ? "" : "s"} na lista` : "Carregando lista..."}
        </h6>
        {pessoas?.length > 8 && (
          <input
            className={`${styles.input} ${styles.filtro}`}
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar por nome, CPF ou código"
          />
        )}
      </div>
      {erroLista && <p className={styleSecao.statusErro}>{erroLista}</p>}

      {pessoasFiltradas.length > 0 && (
        <ul className={styles.lista}>
          {pessoasFiltradas.map((pessoa) =>
            editando?.id === pessoa.id ? (
              <li key={pessoa.id} className={styles.item}>
                <div className={styles.linhaCampos}>
                  <label className={styles.campo}>
                    <span>Nome</span>
                    <input
                      className={styles.input}
                      value={editando.nome}
                      onChange={(e) => setEditando((atual) => ({ ...atual, nome: e.target.value }))}
                      maxLength={200}
                    />
                  </label>
                  <label className={`${styles.campo} ${styles.campoCurto}`}>
                    <span>Carga horária (h)</span>
                    <input
                      className={styles.input}
                      value={editando.carga}
                      onChange={(e) => setEditando((atual) => ({ ...atual, carga: e.target.value }))}
                      inputMode="numeric"
                      placeholder={modelo.cargaHorariaPadrao ? `Padrão: ${modelo.cargaHorariaPadrao}` : "Opcional"}
                    />
                  </label>
                </div>
                {erroEdit && <p className={styleSecao.statusErro}>{erroEdit}</p>}
                <div className={styles.acoesConfirmacao}>
                  <button type="button" className={styles.botaoSecundario} onClick={() => setEditando(null)}>
                    <RiCloseLine size={14} /> Cancelar
                  </button>
                  <button type="button" className={styles.botaoPrimario} onClick={handleSalvarEdicao}>
                    <RiCheckLine size={14} /> Salvar
                  </button>
                </div>
              </li>
            ) : (
              <li key={pessoa.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <p className={styles.itemNome}>{pessoa.nomeDestinatario}</p>
                  <p className={styles.itemMeta}>
                    CPF {mascararCpf(pessoa.cpfDestinatario)} · código {pessoa.codigo}
                    {(pessoa.cargaHoraria ?? modelo.cargaHorariaPadrao) &&
                      ` · ${pessoa.cargaHoraria ?? modelo.cargaHorariaPadrao}h${pessoa.cargaHoraria == null ? " (padrão)" : ""}`}
                  </p>
                </div>
                <div className={styles.itemAcoes}>
                  <button
                    type="button"
                    className={styles.botaoPrimario}
                    onClick={() => handleBaixar(pessoa)}
                    disabled={baixando[pessoa.id]}
                    title="Baixar PDF"
                  >
                    <RiDownload2Line size={14} /> {baixando[pessoa.id] ? "Gerando..." : "PDF"}
                  </button>
                  <button
                    type="button"
                    className={styles.icone}
                    onClick={() => {
                      setEditando({ id: pessoa.id, nome: pessoa.nomeDestinatario, carga: pessoa.cargaHoraria ?? "" });
                      setErroEdit("");
                    }}
                    title="Editar"
                  >
                    <RiPencilLine />
                  </button>
                  <button
                    type="button"
                    className={`${styles.icone} ${styles.iconeExcluir}`}
                    onClick={() => handleRemover(pessoa)}
                    title="Remover da lista"
                  >
                    <RiDeleteBinLine />
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
      {pessoas?.length > 0 && pessoasFiltradas.length === 0 && (
        <p className={styleSecao.dica}>Ninguém na lista corresponde ao filtro.</p>
      )}
    </div>
  );
};

/* ------------------------------ Seção ------------------------------ */

// Certificados por função (organizador, monitor, coordenador...): modelos
// livres criados pelo admin, cada um com sua lista de CPFs — a pessoa não
// precisa ter conta no PLIC. Fica abaixo dos certificados de tipo fixo
// (FormCertificados), na mesma aba.
const FormCertificadosFuncao = ({ eventoSlug, evento }) => {
  const [modelos, setModelos] = useState(null);
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);
  const [novo, setNovo] = useState({ funcaoMasculino: "", funcaoFeminino: "" });
  const [statusNovo, setStatusNovo] = useState({});
  const [modeloAbertoId, setModeloAbertoId] = useState(null);
  const [aba, setAba] = useState("modelo");

  useEffect(() => {
    let ativo = true;
    getModelosCertificadoFuncao(eventoSlug)
      .then((lista) => ativo && setModelos(lista))
      .catch((err) => ativo && setErro(err.message));
    return () => {
      ativo = false;
    };
  }, [eventoSlug]);

  const modeloAberto = modelos?.find((m) => m.id === modeloAbertoId) || null;

  const atualizarModelo = (atualizado) =>
    setModelos((lista) => lista.map((m) => (m.id === atualizado.id ? atualizado : m)));

  const abrir = (modelo, abaInicial = "modelo") => {
    setModeloAbertoId(modelo.id);
    setAba(abaInicial);
  };

  const handleCriar = async (e) => {
    e.preventDefault();
    setStatusNovo({ loading: true });
    try {
      const modelo = await criarModeloCertificadoFuncao(eventoSlug, {
        funcaoMasculino: novo.funcaoMasculino.trim(),
        funcaoFeminino: novo.funcaoFeminino.trim() || novo.funcaoMasculino.trim(),
      });
      setModelos((lista) => [...lista, modelo]);
      setNovo({ funcaoMasculino: "", funcaoFeminino: "" });
      setCriando(false);
      setStatusNovo({});
      abrir(modelo);
    } catch (err) {
      setStatusNovo({ error: err.message });
    }
  };

  return (
    <section className={styleSecao.section}>
      <div className={styleSecao.sectionHead}>
        <div className={styleSecao.sectionIcon}>
          <RiUserStarLine />
        </div>
        <div>
          <h6>Certificados por função</h6>
          <p>
            Modelos para organizadores, monitores, coordenadores ou qualquer outra função. Cada modelo tem
            uma lista de CPFs — a pessoa não precisa ter conta no PLIC.
          </p>
        </div>
      </div>

      <div className={styleSecao.sectionGrid}>
        {erro && <p className={styleSecao.statusErro}>{erro}</p>}
        {!modelos && !erro && <p className={styleSecao.dica}>Carregando modelos...</p>}

        {modelos && (
          <div className={stylesCert.certificados}>
            {modelos.map((modelo) => (
              <div key={modelo.id} className={stylesCert.certificado} onClick={() => abrir(modelo)}>
                <div className={stylesCert.certificadoImg}>
                  {modelo.imagemFundo ? (
                    <Image
                      src={modelo.imagemFundo}
                      alt={`Certificado de ${modelo.funcaoMasculino}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 240px"
                      style={{ objectFit: "contain" }}
                    />
                  ) : (
                    <RiImageAddLine />
                  )}
                </div>
                <div className={`${stylesCert.descricao} ${styles.descricaoModelo}`}>
                  <p>{funcaoComGenero(modelo.funcaoMasculino, modelo.funcaoFeminino)}</p>
                  <span
                    className={styles.contagem}
                    onClick={(e) => {
                      e.stopPropagation();
                      abrir(modelo, "pessoas");
                    }}
                  >
                    <RiTeamLine size={12} /> {modelo._count?.certificados ?? 0}
                    {modelo.liberado ? " · público" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {modelos && !criando && (
          <div>
            <Button icon={RiAddCircleLine} className="btn-secondary" type="button" onClick={() => setCriando(true)}>
              Novo modelo por função
            </Button>
          </div>
        )}

        {criando && (
          <form onSubmit={handleCriar} className={styles.novoModelo}>
            <div className={styles.linhaCampos}>
              <label className={styles.campo}>
                <span>Função (masculino)</span>
                <input
                  className={styles.input}
                  value={novo.funcaoMasculino}
                  onChange={(e) => setNovo((atual) => ({ ...atual, funcaoMasculino: e.target.value }))}
                  placeholder="Ex.: Monitor"
                  maxLength={80}
                  autoFocus
                />
              </label>
              <label className={styles.campo}>
                <span>Função (feminino)</span>
                <input
                  className={styles.input}
                  value={novo.funcaoFeminino}
                  onChange={(e) => setNovo((atual) => ({ ...atual, funcaoFeminino: e.target.value }))}
                  placeholder="Ex.: Monitora"
                  maxLength={80}
                />
              </label>
            </div>
            {novo.funcaoMasculino.trim() && (
              <p className={styleSecao.dica}>
                No certificado:{" "}
                <strong>
                  {funcaoComGenero(novo.funcaoMasculino, novo.funcaoFeminino || novo.funcaoMasculino)}
                </strong>
              </p>
            )}
            {statusNovo.error && <p className={styleSecao.statusErro}>{statusNovo.error}</p>}
            <div className={styles.acoesConfirmacao}>
              <button type="button" className={styles.botaoSecundario} onClick={() => setCriando(false)}>
                <RiCloseLine size={14} /> Cancelar
              </button>
              <Button
                className="btn-secondary"
                type="submit"
                disabled={statusNovo.loading || novo.funcaoMasculino.trim().length < 2}
              >
                {statusNovo.loading ? "Criando..." : "Criar modelo"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <Modal isOpen={!!modeloAberto} onClose={() => setModeloAbertoId(null)} size="large">
        {modeloAberto && (
          <>
            <div className={`${stylesCert.icon} mb-2`}>
              <RiUserStarLine />
            </div>
            <h4>Certificado de {funcaoComGenero(modeloAberto.funcaoMasculino, modeloAberto.funcaoFeminino)}</h4>

            <div className={`${styles.abas} mt-2`}>
              <button
                type="button"
                className={`${styles.aba} ${aba === "modelo" ? styles.abaAtiva : ""}`}
                onClick={() => setAba("modelo")}
              >
                Modelo
              </button>
              <button
                type="button"
                className={`${styles.aba} ${aba === "pessoas" ? styles.abaAtiva : ""}`}
                onClick={() => setAba("pessoas")}
              >
                Pessoas ({modeloAberto._count?.certificados ?? 0})
              </button>
            </div>

            {/* As duas abas ficam montadas (só escondidas) pra não perder o
                que foi editado no modelo e ainda não foi salvo */}
            <div hidden={aba !== "modelo"}>
              <EditorModelo
                key={modeloAberto.id}
                eventoSlug={eventoSlug}
                evento={evento}
                modelo={modeloAberto}
                onAtualizado={atualizarModelo}
                onExcluido={(id) => {
                  setModeloAbertoId(null);
                  setModelos((lista) => lista.filter((m) => m.id !== id));
                }}
              />
            </div>
            <div hidden={aba !== "pessoas"}>
              <ListaPessoas
                key={modeloAberto.id}
                eventoSlug={eventoSlug}
                evento={evento}
                modelo={modeloAberto}
                onTotalAlterado={(total) =>
                  atualizarModelo({ ...modeloAberto, _count: { ...modeloAberto._count, certificados: total } })
                }
              />
            </div>
          </>
        )}
      </Modal>
    </section>
  );
};

export default FormCertificadosFuncao;
