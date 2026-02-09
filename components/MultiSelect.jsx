import { Controller } from "react-hook-form";
import styles from "@/components/Input.module.scss";

const MultiSelect = ({
  control,
  name,
  label,
  placeholder = "Selecione opções",
  disabled = false,
  options = [],
  rules = {},
  error = null,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <div className={`${styles.campo}`}>
          {label && <label className="p5">{label}</label>}
          <div className={`${styles.multiselect} ${error ? styles.error : ""}`}>
            {options.map((option) => (
              <label key={option.id} className={`${styles.checkboxLabel}`}>
                <input
                  type="checkbox"
                  disabled={disabled}
                  value={option.label}
                  checked={field.value?.includes(option.label) || false}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...(field.value || []), option.label]
                      : (field.value || []).filter((v) => v !== option.label);
                    field.onChange(newValue);
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {error && <span className={`${styles.error}`}>{error}</span>}
        </div>
      )}
    />
  );
};

export default MultiSelect;
