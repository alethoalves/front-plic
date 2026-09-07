import Button from "@/components/Button";
import ProgressoEtapas from "./ProgressoEtapas";
import styles from "./checkin.module.scss";

// Tela genérica de instrução do fluxo de check-in — renderiza um único passo
// de PASSOS_INSTRUCAO (definido em page.jsx) por vez, deixando explícito ao
// aluno que ele está seguindo uma sequência (ProgressoEtapas) em vez de ler
// tudo de uma vez.
const EtapaInstrucao = ({ passo, atual, total, onProximo, onNao, loading }) => (
  <div className={styles.card}>
    <ProgressoEtapas atual={atual} total={total} />
    <h1 className="h-editorial-sm mb-2">{passo.titulo}</h1>
    <p className="mb-3">{passo.corpo}</p>
    <Button className="btn-primary w-100" onClick={onProximo} loading={loading}>
      {passo.confirmacao ? "Sim, finalizar check-in" : "Próximo"}
    </Button>
    {passo.confirmacao && (
      <Button className="btn-link w-100 mt-1" onClick={onNao} disabled={loading}>
        Não, voltar ao início
      </Button>
    )}
  </div>
);

export default EtapaInstrucao;
