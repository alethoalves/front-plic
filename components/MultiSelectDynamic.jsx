"use client";

import { Controller } from "react-hook-form";
import { MultiSelect as MultiSelectPrime } from "primereact/multiselect";
import styles from "./Input.module.scss";

const MultiSelectDynamic = ({
  control,
  name,
  label,
  placeholder = "Selecione opções",
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
      render={({ field, fieldState }) => {
        // Garante que o valor seja sempre um array
        const arrayValue = Array.isArray(field.value)
          ? field.value
          : field.value
            ? [field.value]
            : [];

        return (
          <label className={`${styles.campo}`}>
            <div className={`flex-space`}>
              <p className="p5">{label}</p>
            </div>

            <div
              className={`${styles.multiselect} ${fieldState.invalid ? styles.error : ""}`}
            >
              <MultiSelectPrime
                value={arrayValue}
                onChange={(e) => {
                  field.onChange(e.value);
                  handleFieldChange(e.value);
                }}
                options={optionsFormatted}
                optionLabel="label"
                optionValue="value"
                placeholder={placeholder}
                disabled={disabled}
                maxSelectedLabels={3}
                selectedItemsLabel="{0} selecionados"
                className="w-full"
                panelClassName="w-full"
                display="chip"
                showToggleAll={true}
              />
            </div>

            {fieldState.error?.message && (
              <div className={styles.errorMsg}>{fieldState.error.message}</div>
            )}
          </label>
        );
      }}
    />
  );
};

export default MultiSelectDynamic;
