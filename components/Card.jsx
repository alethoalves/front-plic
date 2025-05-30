import styles from "./Card.module.scss";
import Button from "@/components/Button";
import {
  RiDeleteBin6Line,
  RiEditLine,
  RiLogoutBoxRLine,
} from "@remixicon/react";
import { MultiSelect } from "primereact/multiselect";
import { useEffect, useState } from "react";

const Card = ({
  title,
  subtitle,
  onEdit,
  onDelete,
  onView,
  editais,
  tenantSlug,
  onLinkChange,
  formulario,
  campoEdital, // Nova prop para substituir o fieldMap interno
  isGlobal, // Nova prop para controlar se é global
  additionalInfo, // Nova prop para informações adicionais
}) => {
  // Lógica para compatibilidade com o Formularios.jsx
  const fieldMapLegacy = {
    orientador: "formOrientadorId",
    aluno: "formAlunoId",
    planoDeTrabalho: "formPlanoDeTrabalhoId",
    avaliacaoProjeto: "formAvaliacaoProjetoId",
    avaliacaoPlano: "formAvaliacaoPlanoDeTrabalhoId",
  };

  // Determina o campo a ser usado (prioriza a prop campoEdital se existir)
  const campo =
    campoEdital || (formulario?.tipo ? fieldMapLegacy[formulario.tipo] : null);

  // Determina se é global (prioriza a prop isGlobal se existir)
  const global =
    isGlobal !== undefined ? isGlobal : formulario?.tipo === "projeto";

  /* seleção inicial (somente se não for global e houver campo) */
  const initial =
    !global && campo
      ? editais.filter((e) => e[campo] === formulario.id).map((e) => e.id)
      : [];

  const [selectedIds, setSelectedIds] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (global || !campo) return;
    const fresh = editais
      .filter((e) => e[campo] === formulario.id)
      .map((e) => e.id);
    setSelectedIds(fresh);
  }, [editais, campo, formulario?.id, global]);

  const handleChange = async (ids) => {
    if (global || !campo) return;
    setSelectedIds(ids);
    setSaving(true);

    const promises = editais.map((e) => {
      const deveVincular = ids.includes(e.id);
      const jaVinculado = e[campo] === formulario.id;
      if (deveVincular === jaVinculado) return null;
      return onLinkChange(tenantSlug, e.id, {
        [campo]: deveVincular ? formulario.id : null,
      });
    });

    try {
      await Promise.all(promises.filter(Boolean));
    } finally {
      setSaving(false);
    }
  };

  const options = editais?.map((e) => ({
    label: `${e.titulo} (${e.ano})`,
    value: e.id,
  }));

  return (
    <div className={styles.btnItem}>
      {/* cabeçalho */}
      <div className={`${styles.header} mr-2`}>
        <div className={`h7 ${styles.destaque}`}>{title}</div>
        <p>{subtitle}</p>
        {additionalInfo && (
          <p className={styles.additionalInfo}>{additionalInfo}</p>
        )}
      </div>

      {/* seletor ou badge */}
      {global ? (
        <span className="p-tag p-tag-rounded bg-primary text-white mb-2">
          Formulário único para todos os editais
        </span>
      ) : campo ? (
        <div className="w-100 mb-2">
          <MultiSelect
            style={{ width: "100%" }}
            value={selectedIds}
            options={options}
            onChange={(e) => handleChange(e.value)}
            placeholder="Vincular editais"
            display="chip"
            disabled={saving}
          />
        </div>
      ) : null}

      {/* ações */}
      <div className={styles.actions}>
        <div className={`${styles.group1} mr-1`}>
          <Button
            icon={RiLogoutBoxRLine}
            className="btn-primary"
            type="button"
            onClick={onView}
          >
            Acessar
          </Button>
        </div>
        <div className={styles.group2}>
          <Button
            icon={RiEditLine}
            className="btn-secondary mr-1"
            type="button"
            onClick={onEdit}
          />
          <Button
            icon={RiDeleteBin6Line}
            className="btn-error"
            type="button"
            onClick={onDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default Card;
