import { useState } from "react";
import styles from "./FileInput.module.scss";

const FileInput = ({ label, onFileSelect, errorMessage, disabled }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (onFileSelect) onFileSelect(file);
    }
  };

  return (
    <div className={styles.fileInputContainer}>
      <label className={styles.label}>
        <p>{label}</p>
        <input
          type="file"
          className={styles.fileInput}
          onChange={handleFileChange}
          disabled={disabled}
        />
        <span className={styles.customButton}>
          <p>
            {disabled ? "Carregando..." : "Selecione Arquivo em formato .XML"}
          </p>
        </span>
      </label>
      {selectedFile && (
        <p className={styles.fileName}>Arquivo: {selectedFile.name}</p>
      )}
      {errorMessage && <p className={styles.errorMsg}>{errorMessage}</p>}
    </div>
  );
};

export default FileInput;
