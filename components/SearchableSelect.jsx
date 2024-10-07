import { useState, useEffect, useRef, useMemo } from "react";
import { useController } from "react-hook-form";
import styles from "./SearchableSelect.module.scss";

const SearchableSelect = (props) => {
  const { field, fieldState } = useController(props);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState(
    props.options.find((option) => option.value === field.value) ||
      props.options[0]
  );
  const selectRef = useRef(null);

  // Memoize the options to prevent recalculation on every render
  const options = useMemo(() => {
    return Array.isArray(props.options) ? props.options : [];
  }, [props.options]);

  useEffect(() => {
    const initialOption = options.find(
      (option) => option.value === field.value
    );
    if (initialOption) {
      setSelectedOption(initialOption);
    }
  }, [field.value, options]); // Use the memoized options here

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
    setSelectedOption(option);
    setIsOpen(false);
    field.onChange(option.value);
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <label className={`${styles.select} select`} ref={selectRef}>
      <div className={`flex-space ${styles.label}`}>
        <p>{props.label}</p>
        {fieldState.error?.message && (
          <div className={styles.errorMsg}>{fieldState.error.message}</div>
        )}
      </div>

      <div
        className={`${styles.selectContainer} ${props.className}`}
        onClick={toggleDropdown}
      >
        <div
          className={`${styles.selectedOption} ${isOpen ? styles.open : ""} ${
            fieldState.invalid && styles.inputError
          }`}
        >
          {selectedOption ? selectedOption.label : "Selecione uma opção"}
          <div className={`${styles.arrow} ${isOpen ? styles.open : ""}`}></div>
        </div>
        {isOpen && !props.disabled && (
          <div
            className={styles.optionsListContainer}
            style={{ zIndex: 1000 }}
            onClick={(e) => e.stopPropagation()} // Adicionado aqui
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              placeholder="Pesquisar..."
            />
            <ul
              className={`${styles.optionsList} ${
                fieldState.invalid ? styles.inputError : ""
              }`}
            >
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

export default SearchableSelect;
