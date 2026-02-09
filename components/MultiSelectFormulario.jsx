import React from "react";
import { Controller } from "react-hook-form";
import styles from "@/components/Input.module.scss"; // Crie um arquivo de estilo

const MultiSelectFormulario = ({
  control,
  name,
  label,
  placeholder,
  disabled,
  options,
  rules,
}) => {
  return (
    <div className={styles.multiSelectContainer}>
      {label && <label className={styles.label}>{label}</label>}
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => {
          const value = field.value || [];
          const selectedValues = Array.isArray(value)
            ? value
            : value.split(",").filter((v) => v);

          const handleChange = (e) => {
            const selectedOptions = Array.from(e.target.selectedOptions);
            const selectedIds = selectedOptions.map((option) => option.value);
            field.onChange(selectedIds);
          };

          return (
            <>
              <select
                multiple
                value={selectedValues}
                onChange={handleChange}
                className={`${styles.multiSelect} ${fieldState.error ? styles.error : ""}`}
                disabled={disabled}
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldState.error && (
                <span className={styles.errorMessage}>
                  {fieldState.error.message}
                </span>
              )}
              <small className={styles.helpText}>
                Mantenha a tecla Ctrl pressionada para selecionar múltiplas
                opções
              </small>
            </>
          );
        }}
      />
    </div>
  );
};

export default MultiSelectFormulario;
