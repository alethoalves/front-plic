import { useForm } from "react-hook-form";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import Input from "../Input";

export const RenderPalavrasChaveCard = ({
  initialPalavrasChave = [],
  onSavePalavrasChave,
}) => {
  const [palavrasChave, setPalavrasChave] = useState(initialPalavrasChave);
  const toast = useRef(null);
  const [palavraChaveInput, setPalavraChaveInput] = useState("");

  const adicionarPalavraChave = () => {
    const palavra = palavraChaveInput.trim();

    if (!palavra) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Digite uma palavra-chave válida",
        life: 5000,
      });
      return;
    }

    if (palavra.length > 50) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "A palavra-chave não pode ter mais de 50 caracteres",
        life: 5000,
      });
      return;
    }

    if (palavrasChave.some((p) => p.toLowerCase() === palavra.toLowerCase())) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Esta palavra-chave já foi adicionada",
        life: 5000,
      });
      return;
    }

    setPalavrasChave([...palavrasChave, palavra]);
    setPalavraChaveInput("");
  };

  const removerPalavraChave = (palavra) => {
    setPalavrasChave(palavrasChave.filter((p) => p !== palavra));
  };

  const salvarPalavrasChave = () => {
    if (palavrasChave.length < 3) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Você deve adicionar pelo menos 3 palavras-chave",
        life: 5000,
      });
      return;
    }

    onSavePalavrasChave(palavrasChave);
    toast.current.show({
      severity: "success",
      summary: "Sucesso",
      detail: "Palavras-chave salvas com sucesso",
      life: 3000,
    });
  };

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <div className="flex flex-column gap-3">
        <div className="flex flex-column gap-2">
          <div className="field">
            <label htmlFor="palavraChave" className="block">
              Palavra-chave (máx. 50 caracteres) *
            </label>
            <div className="p-inputgroup">
              <input
                id="palavraChave"
                value={palavraChaveInput}
                onChange={(e) => setPalavraChaveInput(e.target.value)}
                className="p-inputtext"
                placeholder="Digite uma palavra-chave"
                maxLength={50}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarPalavraChave();
                  }
                }}
              />
              <Button
                icon="pi pi-plus"
                onClick={adicionarPalavraChave}
                disabled={!palavraChaveInput.trim()}
              />
            </div>
            <small>Obrigatório adicionar pelo menos 3 palavras-chave</small>
          </div>
        </div>

        <div className="card">
          <h6>Palavras-chave Adicionadas ({palavrasChave.length})</h6>
          {palavrasChave.length === 0 ? (
            <p>Nenhuma palavra-chave adicionada</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {palavrasChave.map((palavra, index) => (
                <li
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div>
                    <p>
                      <strong>{palavra}</strong>
                    </p>
                  </div>
                  <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-sm"
                    onClick={() => removerPalavraChave(palavra)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-content-between">
          <Button
            label="Limpar Tudo"
            severity="secondary"
            onClick={() => {
              setPalavrasChave([]);
              setPalavraChaveInput("");
            }}
            disabled={palavrasChave.length === 0}
          />
          <Button
            label="Salvar Palavras-chave"
            onClick={salvarPalavrasChave}
            disabled={palavrasChave.length < 3}
          />
        </div>
      </div>
    </>
  );
};
