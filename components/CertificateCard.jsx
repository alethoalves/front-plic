// components/CertificateCard.tsx
import React from "react";
import styles from "./CertificateCard.module.scss";

const CertificateCard = ({ data }) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Detalhes do Certificado</h3>
        <div className={`${styles.statusBadge} ${styles[data.status]}`}>
          {data.status === "valid" ? "Válido" : "Inválido"}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.label}>Código:</span>
            <span className={styles.value}>{data.code}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Participante:</span>
            <span className={styles.value}>{data.participantName}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Evento:</span>
            <span className={styles.value}>{data.eventName}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Data do Evento:</span>
            <span className={styles.value}>{data.eventDate}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Carga Horária:</span>
            <span className={styles.value}>{data.hours} horas</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Tipo:</span>
            <span className={styles.value}>{data.eventType}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Emitido por:</span>
            <span className={styles.value}>{data.issuer}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Data de Emissão:</span>
            <span className={styles.value}>{data.issuedAt}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>E-mail:</span>
            <span className={styles.value}>{data.participantEmail}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateCard;
