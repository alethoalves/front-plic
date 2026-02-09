"use client";

import { Controller } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import styles from "./Select.module.scss";

const SelectDynamic = ({
  control,
  name,
  label,
  placeholder = "Selecione uma opção",
  disabled = false,
  options = [],
  rules = {},
  campo = {},
  onFieldChange = null,
}) => {
  // Converte opções do formato API para formato PrimeReact
  const optionsFormatted = options.map((option) => ({
    label: option.label,
    value: option.label,
  }));

  const handleFieldChange = (valor) => {
    if (onFieldChange && campo.id) {
      onFieldChange(campo.id, valor);
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <label className={`${styles.select} select`}>
          <div className={`flex-space ${styles.label}`}>
            <p>{label}</p>
          </div>

          <div className={`${styles.selectContainer}`}>
            <Dropdown
              value={field.value || null}
              onChange={(e) => {
                field.onChange(e.value);
                handleFieldChange(e.value);
              }}
              options={optionsFormatted}
              optionLabel="label"
              optionValue="value"
              placeholder={placeholder}
              disabled={disabled}
              className={`w-full ${fieldState.invalid ? "ng-invalid ng-touched" : ""}`}
              panelClassName="w-full"
              showClear={!campo.obrigatorio}
            />
          </div>

          {fieldState.error?.message && (
            <div className={styles.errorMsg}>{fieldState.error.message}</div>
          )}
        </label>
      )}
    />
  );
};

export default SelectDynamic;
