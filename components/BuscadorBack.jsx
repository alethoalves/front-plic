import { RiSearchLine } from "@remixicon/react";
import { useState } from "react";
import Button from "@/components/Button";
import styles from "./BuscadorBack.module.scss";

const BuscadorBack = ({
  onSearch,
  btnTitle = "Pesquisar",
  placeholder = "Pesquise aqui",
  icon,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  return (
    <form className={styles.buscador} onSubmit={handleSubmit}>
      <div className={styles.input}>
        <div className="input-container">
          <input
            className="p-2"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
          />
        </div>
      </div>
      <div className={styles.btnBuscador}>
        <Button
          icon={icon ? icon : RiSearchLine}
          className="btn-secondary"
          type="submit"
        >
          {btnTitle}
        </Button>
      </div>
    </form>
  );
};

export default BuscadorBack;
