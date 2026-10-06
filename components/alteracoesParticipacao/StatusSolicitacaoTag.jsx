import styles from "./alteracoes.module.scss";
import { ROTULO_STATUS, TOM_STATUS } from "@/lib/alteracaoParticipacao";

const StatusSolicitacaoTag = ({ status }) => (
  <span className={`${styles.tag} ${styles[`tag_${TOM_STATUS[status] || "neutral"}`]}`}>
    {ROTULO_STATUS[status] || status}
  </span>
);

export default StatusSolicitacaoTag;
