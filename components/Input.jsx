
import styles from './Input.module.scss'

import { RiEyeLine } from "@remixicon/react";
import { RiEyeOffLine } from "@remixicon/react";
import { useState } from "react";
import { useController } from "react-hook-form";


const Input = (props) => {
    const [showPassword, setShowPassword] = useState(false);
    const Icon = props.icon;
    const togglePasswordVisibility = () => {
        setShowPassword(prevState => !prevState);
    };

    const { field, fieldState } = useController(props);

    const handleChange = (event) => {
        let inputValue = event.target.value;
        if (props.className.includes("phone-input")) {
            inputValue = inputValue.replace(/\D/g, '');
            if (inputValue.length <= 11) {
                inputValue = inputValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            }
        } else if (props.className.includes("cpf-input")) {
            inputValue = inputValue.replace(/\D/g, '');
            if (inputValue.length <= 11) {
                inputValue = inputValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            }
        }
        field.onChange(inputValue);
    };

    return (
        <label className={`${styles.inputContainer}`}>
            <div className="flex-space">
                <p>{props.label}</p>
                {fieldState.error?.message &&
                    <p className={styles.errorMsg}>{fieldState.error.message}</p>
                }
            </div>

            {props.icon &&
                <Icon className={styles.inputIcon} />
            }
            {props.inputType === 'password' && (
                showPassword ?
                    <RiEyeLine className={styles.inputIconHiddenText} onClick={togglePasswordVisibility} />
                    :
                    <RiEyeOffLine className={styles.inputIconHiddenText} onClick={togglePasswordVisibility} />
            )}
            <input
                {...field}
                value={field.value}  // Garanta que sempre haja um valor
                className={`${props.className} ${props.icon ? styles.inputWithIconLeft : styles.inputWithoutIconLeft} ${fieldState.invalid && styles.inputError}`}
                type={props.inputType === 'password' && showPassword ? 'text' : (props.inputType === 'password' ? 'password' : props.inputType)}
                placeholder={props.placeholder}
                autoFocus={props.autoFocus}
                disabled={props.disabled}
                onChange={handleChange}
            />
        </label>
    );
}
export default Input;