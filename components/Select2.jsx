import { useState, useEffect, useRef } from "react";
import styles from "./Select.module.scss";

const Select2 = ({
  options,
  label,
  className,
  disabled,
  onChange,
  extendedOpt = true,
}) => {
  // Adiciona a opção "Selecione uma opção" no início do array de opções
  let extendedOptions = [];
  if (extendedOpt) {
    extendedOptions = [{ label: "Selecione uma opção", value: "" }, ...options];
  } else {
    extendedOptions = [...options];
  }

  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(extendedOptions[0]); // Inicializa com "Selecione uma opção"
  const selectRef = useRef(null);

  // Fechar o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option); // Atualiza a opção selecionada
    setIsOpen(false); // Fecha o dropdown
    if (onChange) onChange(option.value); // Chama o onChange passando o valor selecionado
  };

  return (
    <label className={`${styles.select} select`} ref={selectRef}>
      <div className={`flex-space ${styles.label}`}>
        <p>{label}</p>
      </div>

      <div
        className={`${styles.selectContainer} ${className} `}
        onClick={() => !disabled && setIsOpen(!isOpen)} // Abre/fecha dropdown
      >
        <div
          className={`${styles.selectedOption} ${isOpen ? styles.open : ""}`}
        >
          {selectedOption.label} {/* Exibe a opção selecionada */}
          <div className={`${styles.arrow} ${isOpen ? styles.open : ""}`} />
        </div>
        {isOpen && !disabled && (
          <ul className={styles.optionsList}>
            {extendedOptions.map((option) => (
              <li
                key={option.value}
                className={styles.optionItem}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
};

export default Select2;
