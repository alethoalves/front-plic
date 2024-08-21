import { useState, useEffect, useRef } from "react";
import { useController } from "react-hook-form";
import styles from "./Textarea.module.scss";

const Textarea = (props) => {
  const { field, fieldState } = useController(props);
  const [textareaValue, setTextareaValue] = useState(field.value || "");
  const textareaRef = useRef(null);

  useEffect(() => {
    setTextareaValue(field.value);
  }, [field.value]);

  const handleChange = (event) => {
    const newValue = event.target.value;
    setTextareaValue(newValue);
    field.onChange(newValue);
  };

  return (
    <label className={styles.textareaLabel}>
      <div className={`${styles.label}`}>
        <p>
          {props.label}
          <span className={styles.charCount}>
            &nbsp;{`(${textareaValue.length}/${props.maxLength})`}
          </span>
        </p>

        {fieldState.error?.message && (
          <p className={styles.errorMsg}>{fieldState.error.message}</p>
        )}
      </div>

      <textarea
        {...field}
        value={textareaValue}
        className={`${styles.textarea} ${
          fieldState.invalid && styles.inputError
        }`}
        placeholder={props.placeholder}
        disabled={props.disabled}
        onChange={handleChange}
        ref={textareaRef}
        maxLength={props.maxLength}
      />
    </label>
  );
};

export default Textarea;
