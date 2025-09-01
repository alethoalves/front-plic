import { useState } from "react";
import Modal from "./Modal";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import CPFVerificationForm from "./Formularios/CPFVerificationForm";
import { InputText } from "primereact/inputtext";

const InsertUpdateDate = ({
  isOpen,
  onClose,
  title,
  onSave,
  saveButtonLabel = "Confirmar",
  cancelButtonLabel = "Cancelar",
  showDropdown = false,
  dropdownProps = {},
  showTextarea = false,
  textareaProps = {},
  showInputText = false,
  inputTextProps = {},
  showDateInput = false,
  dateInputProps = {},
  showStatusDropdown = false, // Nova prop
  statusDropdownProps = {}, // Nova prop
  children,
  isSubstituicao = false,
  substituicaoProps = {},
  loadingData = false,
  isLoading = false,
}) => {
  const { setCpfVerificado, cpfVerificado, setNovoAluno, tenant } =
    substituicaoProps;
  const handleSave = async () => {
    await onSave();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {title && <h4 className="mb-3">{title}</h4>}
      {isSubstituicao && !cpfVerificado && (
        <CPFVerificationForm
          tenantSlug={tenant}
          onCpfVerified={(data) => {
            setCpfVerificado(data);
            setNovoAluno(data);
          }}
        />
      )}
      {((!loadingData && !isSubstituicao) || cpfVerificado) && (
        <>
          {isSubstituicao && (
            <div className="field mb-2">
              <label htmlFor="novoAluno">Novo Participante</label>
              <InputText
                className="w-100"
                id="novoAluno"
                value={cpfVerificado?.nome}
                disabled
              />
            </div>
          )}

          {/* Novo dropdown de status */}
          {showStatusDropdown && (
            <div className="field mb-3">
              <label htmlFor="statusPendencia">Status da Pendência</label>
              <Dropdown
                id="statusPendencia"
                className="w-full"
                value={statusDropdownProps.value}
                onChange={statusDropdownProps.onChange}
                options={statusDropdownProps.options}
                placeholder="Selecione o status"
              />
            </div>
          )}

          {showInputText && (
            <div className="field mb-2">
              <label htmlFor="novoAluno">{inputTextProps.label}</label>
              <InputText className="w-100" id="inputText" {...inputTextProps} />
            </div>
          )}

          {showDropdown && (
            <div className="field ">
              <label htmlFor={dropdownProps.id || "dropdown"}>
                Selecione um aluno
              </label>
              <br></br>
              <Dropdown
                className="w-100 "
                placeholder="Selecione uma opção"
                {...dropdownProps}
              />
            </div>
          )}

          {showTextarea && (
            <div className="field ">
              <label htmlFor={textareaProps.id || "inputTextArea"}>
                Observacão/Justificativa
              </label>
              <br></br>
              <InputTextarea rows={4} className="w-full " {...textareaProps} />
            </div>
          )}

          {showDateInput && (
            <div className="field mb-3">
              <label htmlFor={dateInputProps.id || "dateInput"}>Data</label>
              <br></br>
              <input
                type="date"
                className="p-inputtext p-component w-full"
                {...dateInputProps}
              />
            </div>
          )}

          {children}

          <div className="flex justify-content-end gap-1 mt-4">
            <Button
              label={cancelButtonLabel}
              severity="secondary"
              outlined
              onClick={onClose}
              disabled={isLoading}
            />
            <Button
              label={
                isLoading ? (
                  <>
                    <i className="pi pi-spinner pi-spin mr-2" /> Processando…
                  </>
                ) : (
                  saveButtonLabel
                )
              }
              onClick={handleSave}
              disabled={isLoading}
            />
          </div>
        </>
      )}
      {loadingData && <p>Carregando...</p>}
    </Modal>
  );
};

export default InsertUpdateDate;
