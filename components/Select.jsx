import { useState, useEffect, useRef } from 'react';
import { useController } from "react-hook-form";
import styles from './Select.module.scss';

const Select = (props) => {
  const { field, fieldState } = useController(props);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    props.options.find(option => option.value === field.value) || props.options[0]
  );
  const selectRef = useRef(null);

  useEffect(() => {
    const initialOption = props.options.find(option => option.value === field.value);
    if (initialOption) {
      setSelectedOption(initialOption);
    }
  }, [field.value, props.options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    field.onChange(option.value);
  };

  return (
    <label className={`${styles.select} select`} ref={selectRef}>
      <div className={`flex-space ${styles.label}`}>
        <p>{props.label}</p>
        {fieldState.error?.message && 
          <div className={styles.errorMsg}>{fieldState.error.message}</div>
        }
      </div>

      <div
        className={`${styles.selectContainer} ${props.className} `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`${styles.selectedOption} ${isOpen ? styles.open : ''} ${fieldState.invalid && styles.inputError}`}>
          {selectedOption.label}
          <div className={`${styles.arrow} ${isOpen ? styles.open : ''}`}></div>
        </div>
        {isOpen && !props.disabled && (
          <ul className={`${styles.optionsList} ${fieldState.invalid && styles.inputError}`}>
            {props.options.map(option => (
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
}

export default Select;
