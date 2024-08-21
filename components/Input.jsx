import { useState } from "react";
import { useController } from "react-hook-form";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import styles from "./Input.module.scss";

const Input = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  const Icon = props.icon;
  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const { field, fieldState } = useController(props);

  const handleChange = (event) => {
    let inputValue = event.target.value;

    if (props.inputType === "checkbox") {
      inputValue = event.target.checked ? "true" : "false";
    } else if (props.className?.includes("phone-input")) {
      inputValue = inputValue.replace(/\D/g, "");
      if (inputValue.length <= 11) {
        inputValue = inputValue.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      }
    } else if (props.className?.includes("cpf-input")) {
      inputValue = inputValue.replace(/\D/g, "");
      if (inputValue.length > 11) {
        inputValue = inputValue.slice(0, 11); // Limita o comprimento a 11 caracteres
      }
      if (inputValue.length <= 11) {
        inputValue = inputValue.replace(
          /(\d{3})(\d{3})(\d{3})(\d{2})/,
          "$1.$2.$3-$4"
        );
      }
    } else if (
      props.inputType === "date" ||
      props.className?.includes("date-input")
    ) {
      inputValue = inputValue.replace(/\D/g, ""); // Remove tudo que não for dígito
      if (inputValue.length > 8) {
        inputValue = inputValue.slice(0, 8); // Limita o comprimento a 8 caracteres
      }
      if (inputValue.length <= 8) {
        inputValue = inputValue.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
      }
    } else if (props.inputType === "file") {
      inputValue = event.target.files[0];
    }

    field.onChange(inputValue);
  };

  return (
    <label
      className={`${styles.inputContainer} ${
        props.inputType === "checkbox" && styles.checkboxContainer
      }`}
    >
      <div className={`${styles.label}`}>
        {props.inputType !== "file" && <p>{props.label}</p>}

        {fieldState.error?.message && (
          <p className={`${styles.errorMsg} ${styles.errorp}`}>
            {fieldState.error.message}
          </p>
        )}
      </div>

      {props.icon && <Icon className={styles.inputIcon} />}
      {props.inputType === "password" &&
        (showPassword ? (
          <RiEyeLine
            className={styles.inputIconHiddenText}
            onClick={togglePasswordVisibility}
          />
        ) : (
          <RiEyeOffLine
            className={styles.inputIconHiddenText}
            onClick={togglePasswordVisibility}
          />
        ))}
      <input
        {...field}
        checked={
          props.inputType === "checkbox" ? field?.value === "true" : undefined
        }
        value={
          props.inputType !== "checkbox" && props.inputType !== "file"
            ? field?.value || ""
            : undefined
        }
        className={`${props.className} ${
          props.icon ? styles.inputWithIconLeft : styles.inputWithoutIconLeft
        } ${fieldState.invalid && styles.inputError}`}
        type={
          props.inputType === "password" && showPassword
            ? "text"
            : props.inputType === "password"
            ? "password"
            : props.inputType === "checkbox"
            ? "checkbox"
            : props.inputType === "file"
            ? "file"
            : "text"
        } // Note que agora é um campo de texto
        placeholder={props.placeholder}
        autoFocus={props.autoFocus}
        disabled={props.disabled}
        onChange={handleChange}
        id={props.inputType === "file" ? "XYZ" : props.name || undefined}
      />
      {props.inputType === "file" && (
        <>
          <label htmlFor="XYZ" className={`${styles.fileLabel}`}>
            <p>Escolher arquivo</p>
          </label>
          {field?.value && (
            <p className={styles.fileName}>{field.value.name}</p>
          )}
        </>
      )}
    </label>
  );
};

export default Input;
