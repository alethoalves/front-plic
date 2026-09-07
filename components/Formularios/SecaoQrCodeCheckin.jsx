"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { InputText } from "primereact/inputtext";
import { RiDownloadLine, RiQrCodeLine } from "@remixicon/react";
import Button from "@/components/Button";
import styles from "@/components/Formularios/FormConfiguracoesEvento.module.scss";

// Mesmo domínio fixo já usado em getConviteLink()
// (app/evento/[eventoSlug]/admin/avaliadores/page.jsx) para o link de
// convite de avaliador.
const getUrlCheckin = (eventoRootSlug, eventoSlug) =>
  `https://www.plic.app.br/evento/${eventoRootSlug}/edicao/${eventoSlug}/checkin`;

const SecaoQrCodeCheckin = ({ eventoSlug, eventoRootSlug }) => {
  const [dataUrl, setDataUrl] = useState("");
  const downloadRef = useRef(null);

  const urlCheckin = eventoRootSlug ? getUrlCheckin(eventoRootSlug, eventoSlug) : "";

  useEffect(() => {
    if (!urlCheckin) return;
    QRCode.toDataURL(urlCheckin, { width: 320 })
      .then(setDataUrl)
      .catch((error) => console.error("Erro ao gerar QR Code:", error));
  }, [urlCheckin]);

  const baixarImagem = () => {
    if (!dataUrl || !downloadRef.current) return;
    downloadRef.current.href = dataUrl;
    downloadRef.current.download = `qrcode-checkin-${eventoSlug}.png`;
    downloadRef.current.click();
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionIcon}>
          <RiQrCodeLine />
        </div>
        <div>
          <h6>Check-in presencial (QR Code)</h6>
          <p>
            Imprima e cole no evento — o aluno escaneia com a câmera do
            celular para fazer o check-in do pôster.
          </p>
        </div>
      </div>

      <div className={styles.sectionGrid}>
        {!eventoRootSlug ? (
          <p className={styles.dica}>Carregando...</p>
        ) : (
          <>
            <div className="flex align-items-center gap-1">
              {dataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dataUrl}
                  alt="QR Code de check-in"
                  // Um estilo global (svg, img { width: 100% }) sobrescreveria
                  // os atributos width/height do HTML — precisa ser inline
                  // pra vencer essa regra.
                  style={{ width: 56, height: 56, maxWidth: 56, borderRadius: 4, flexShrink: 0 }}
                />
              )}
              <InputText
                readOnly
                value={urlCheckin}
                aria-label="URL pública de check-in"
                className={`${styles.eventoInput} w-100`}
              />
              <Button icon={RiDownloadLine} onClick={baixarImagem} title="Baixar imagem" className="btn-secondary" />
            </div>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a ref={downloadRef} style={{ display: "none" }} />
          </>
        )}
      </div>
    </section>
  );
};

export default SecaoQrCodeCheckin;
