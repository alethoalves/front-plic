"use client";

import { useState } from "react";
import styles from "@/components/Formularios/Form.module.scss";
import {
  RiBuildingLine,
  RiToggleLine,
  RiToggleFill,
} from "@remixicon/react";
import { atualizarApresentacaoObrigatoria } from "@/app/api/client/eventos";

// Cada tenant vinculado a este evento (TenantEvento) pode exigir que seus
// próprios bolsistas/voluntários apresentem no congresso como condição para
// o certificado de conclusão do plano de trabalho — ver
// certificadoPlanoController.js:generateCertificatePlano, que consulta esta
// flag junto com Edital.eventoObrigatorioId (configurado por tenant, fora
// desta tela).
const FormTenantsVinculados = ({ eventoSlug, initialTenantsVinculados }) => {
  const [tenantsVinculados, setTenantsVinculados] = useState(
    initialTenantsVinculados || []
  );
  const [alternandoId, setAlternandoId] = useState(null);
  const [erro, setErro] = useState("");

  const toggleApresentacaoObrigatoria = async (tenantEvento) => {
    setAlternandoId(tenantEvento.tenantId);
    setErro("");
    try {
      const resposta = await atualizarApresentacaoObrigatoria(
        eventoSlug,
        tenantEvento.tenantId,
        !tenantEvento.apresentacaoObrigatoria
      );
      setTenantsVinculados((prev) =>
        prev.map((te) =>
          te.tenantId === tenantEvento.tenantId ? resposta.tenantEvento : te
        )
      );
    } catch (error) {
      setErro(
        error.response?.data?.message ??
          "Erro ao atualizar a configuração deste tenant."
      );
    } finally {
      setAlternandoId(null);
    }
  };

  if (tenantsVinculados.length === 0) return null;

  return (
    <div className={styles.secao}>
      <div className={styles.secaoHead}>
        <div className={styles.secaoIcon}>
          <RiBuildingLine />
        </div>
        <h6>Tenants vinculados</h6>
      </div>
      <div className={styles.secaoContent}>
        <p className={styles.dica}>
          Quando ativado para um tenant, os bolsistas/voluntários desse
          tenant só recebem o certificado de conclusão do plano de trabalho
          se apresentarem neste evento (ou justificarem a ausência, com
          assinatura do orientador). Também é necessário indicar, no edital
          de cada tenant, que este é o evento obrigatório correspondente.
        </p>

        <div className={styles.lista}>
          {tenantsVinculados.map((tenantEvento) => (
            <div key={tenantEvento.tenantId} className={styles.listaItem}>
              <div
                className={styles.icon}
                onClick={() => toggleApresentacaoObrigatoria(tenantEvento)}
                title={
                  tenantEvento.apresentacaoObrigatoria
                    ? "Tornar apresentação opcional"
                    : "Tornar apresentação obrigatória"
                }
              >
                {alternandoId === tenantEvento.tenantId ? (
                  "..."
                ) : tenantEvento.apresentacaoObrigatoria ? (
                  <RiToggleFill />
                ) : (
                  <RiToggleLine />
                )}
              </div>
              <div className={`${styles.content} ${styles.betweenIcons}`}>
                <p>
                  <strong>{tenantEvento.tenant?.sigla}</strong> -{" "}
                  {tenantEvento.tenant?.nome}
                  {tenantEvento.apresentacaoObrigatoria
                    ? " (apresentação obrigatória)"
                    : " (apresentação opcional)"}
                </p>
              </div>
            </div>
          ))}
        </div>
        {erro && <p className={styles.statusErro}>{erro}</p>}
      </div>
    </div>
  );
};

export default FormTenantsVinculados;
