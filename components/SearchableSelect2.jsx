import { useState, useEffect, useRef, useMemo } from "react";
import styles from "./SearchableSelect.module.scss";

const SearchableSelect2 = ({
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
  const [searchTerm, setSearchTerm] = useState("");
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

  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  const filteredOptions = extendedOptions.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <label className={`${styles.select} select`} ref={selectRef}>
      <div className={`flex-space ${styles.label}`}>
        <p>{label}</p>
      </div>

      <div
        className={`${styles.selectContainer} ${className}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
      >
        <div
          className={`${styles.selectedOption} ${isOpen ? styles.open : ""}`}
        >
          {selectedOption ? selectedOption.label : "Selecione uma opção"}
          <div className={`${styles.arrow} ${isOpen ? styles.open : ""}`} />
        </div>
        {isOpen && !disabled && (
          <div
            className={styles.optionsListContainer}
            style={{ zIndex: 1000 }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              placeholder="Pesquisar..."
            />
            <ul className={styles.optionsList}>
              {filteredOptions.map((option, i) => (
                <li
                  key={i}
                  className={styles.optionItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option);
                  }}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </label>
  );
};

export default SearchableSelect2;
