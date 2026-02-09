import { Controller } from "react-hook-form";
import styles from "./Select.module.scss";

const Select = ({
  control,
  name,
  label,
  placeholder = "Selecione uma opção",
  disabled = false,
  options = [],
  rules = {},
  error = null,
  className = "",
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <label className={`${styles.select} select`}>
          <div className={`flex-space ${styles.label}`}>
            <p>{label}</p>
            {fieldState.error?.message && (
              <div className={styles.errorMsg}>{fieldState.error.message}</div>
            )}
          </div>

          <div className={`${styles.selectContainer} ${className}`}>
            <select
              {...field}
              disabled={disabled}
              className={`${styles.selectInput} ${
                fieldState.invalid ? styles.inputError : ""
              }`}
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.id} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </label>
      )}
    />
  );
};

export default Select;
