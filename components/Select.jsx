import { useState } from 'react';
import { useController } from "react-hook-form";
import styles from './Select.module.scss';

const Select = (props) => {
    const { field, fieldState } = useController(props);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(
        props.options.find(option => option.value === field.value) || props.options[0]
    );

    const handleSelect = (option) => {
        setSelectedOption(option);
        setIsOpen(false);
        field.onChange(option.value);
    };

    return (
        <label className={styles.select}>
            <div className="flex-space">
                <p>{props.label}</p>
                {fieldState.error?.message && 
                    <p className={styles.errorMsg}>{fieldState.error.message}</p>
                }
            </div>

            <div
                className={`${styles.selectContainer} ${props.className} ${fieldState.invalid && styles.inputError}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`${styles.selectedOption} ${isOpen ? styles.open : ''}`}>
                    <p>{selectedOption.label}</p>
                </div>
                {isOpen && (
                    <ul className={styles.optionsList}>
                        {props.options.map(option => (
                            <li
                                key={option.value}
                                className={styles.optionItem}
                                onClick={() => handleSelect(option)}
                            >
                                <p>{option.label}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </label>
    );
}

export default Select;
