import styles from "./Card.module.scss";
import Button from "@/components/Button";
import {
  RiDeleteBin6Line,
  RiEditLine,
  RiLogoutBoxRLine,
} from "@remixicon/react";
import { MultiSelect } from "primereact/multiselect";
import { useEffect, useState } from "react";

/* mapeia o tipo do formulário → campo no Edital */
const fieldMap = {
  orientador: "formOrientadorId",
  aluno: "formAlunoId",
  planoDeTrabalho: "formPlanoDeTrabalhoId",
  /* projeto não entra: é global */
};

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
}) => {
  const isGlobal = formulario.tipo === "projeto";

  /* se não houver campo no map, não precisamos de MultiSelect */
  const campo = fieldMap[formulario.tipo];

  /* seleção inicial (somente se houver MultiSelect) */
  const initial =
    !isGlobal && campo
      ? editais.filter((e) => e[campo] === formulario.id).map((e) => e.id)
      : [];

  const [selectedIds, setSelectedIds] = useState(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (isGlobal || !campo) return;
    const fresh = editais
      .filter((e) => e[campo] === formulario.id)
      .map((e) => e.id);
    setSelectedIds(fresh);
  }, [editais, campo, formulario.id, isGlobal]);
  const handleChange = async (ids) => {
    if (isGlobal || !campo) return;
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

  const options = editais.map((e) => ({
    label: `${e.titulo} (${e.ano})`,
    value: e.id,
  }));

  return (
    <div className={styles.btnItem}>
      {/* cabeçalho */}
      <div className={`${styles.header} mr-2`}>
        <div className={`h7 ${styles.destaque}`}>{title}</div>
        <p>{subtitle}</p>
      </div>

      {/* seletor ou badge */}
      {isGlobal ? (
        <span className="p-tag p-tag-rounded bg-primary text-white mb-2">
          Formulário único para todos os editais
        </span>
      ) : (
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
      )}

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
