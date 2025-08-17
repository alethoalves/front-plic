import { useForm } from "react-hook-form";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef, useState, useEffect } from "react";
import SearchableSelect2 from "../SearchableSelect2";
import { formatDateForDisplay } from "@/lib/formatDateForDisplay";
import { formatarHora } from "@/lib/formatarDatas";

export const RenderApresentacaoCard = ({
  initialData,
  eventoData,
  onSubmitSuccess,
}) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedSubsessao, setSelectedSubsessao] = useState(null);
  const [areasOptions, setAreasOptions] = useState([]);
  const [subsessoesOptions, setSubsessoesOptions] = useState([]);
  const [categoriasOptions, setCategoriasOptions] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(
    initialData
      ? { label: initialData.categoria, value: initialData.categoria }
      : null
  );
  const [selectedSessao, setSelectedSessao] = useState(
    initialData
      ? {
          label: eventoData.sessao.find((s) => s.id === initialData.sessaoId)
            ?.titulo,
          value: initialData.sessaoId,
        }
      : null
  );
  const { control, handleSubmit } = useForm();

  // Inicializa as opções de categoria
  useEffect(() => {
    if (eventoData?.categorias?.options) {
      setCategoriasOptions(
        eventoData.categorias.options.map((categoria) => ({
          label: categoria,
          value: categoria,
        }))
      );
    }
  }, [eventoData]);

  // Atualiza as áreas quando a sessão muda
  useEffect(() => {
    if (selectedSessao && eventoData?.sessao) {
      const sessao = eventoData.sessao.find((s) => s.id === selectedSessao.id);
      if (sessao) {
        const areas = sessao.sessaoArea.map((item) => ({
          label: item.area.area,
          value: item.area.id,
          sessaoId: sessao.id,
        }));
        setAreasOptions(areas);
      }
    } else {
      setAreasOptions([]);
    }
    setSelectedArea(null);
    setSelectedSubsessao(null);
  }, [selectedSessao, eventoData]);

  // Atualiza as subsessões quando a área muda
  useEffect(() => {
    if (selectedSessao && eventoData?.sessao) {
      const sessao = eventoData.sessao.find((s) => s.id === selectedSessao.id);
      if (sessao) {
        setSubsessoesOptions(
          sessao.subsessaoApresentacao.map((sub) => ({
            label: `${formatDateForDisplay(sub.inicio)} - início ${formatarHora(
              sub.inicio
            )}`,
            value: sub.id,
            inicio: sub.inicio,
            fim: sub.fim,
            local: sub.local,
          }))
        );
      }
    } else {
      setSubsessoesOptions([]);
    }
    setSelectedSubsessao(null);
  }, [selectedArea, selectedSessao, eventoData]);

  const onSubmit = () => {
    setLoading(true);

    const payload = {
      categoria: selectedCategoria?.value,
      sessaoId: selectedSessao.id,
      areaId: selectedArea.value,
      subsessaoId: selectedSubsessao.value,
    };

    // Simulação de envio
    setTimeout(() => {
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Apresentação agendada com sucesso!",
        life: 3000,
      });
      setLoading(false);

      // Chama a função de callback se fornecida
      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      }
    }, 1500);
  };

  // Formatando opções para o SearchableSelect2
  const sessoesOptions =
    eventoData?.sessao?.map((sessao) => ({
      label: sessao.titulo,
      value: sessao.id,
      id: sessao.id,
    })) || [];

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="w-100 flex flex-column gap-2">
          <SearchableSelect2
            label="Categoria*"
            options={categoriasOptions}
            onChange={(value) => {
              const selected = categoriasOptions.find(
                (opt) => opt.value === value
              );
              setSelectedCategoria(selected);
            }}
            value={selectedCategoria?.value || ""}
            extendedOpt={true}
          />

          <SearchableSelect2
            label="Sessão*"
            options={sessoesOptions}
            onChange={(value) => {
              const selected = sessoesOptions.find(
                (opt) => opt.value === value
              );
              setSelectedSessao(selected);
            }}
            value={selectedSessao?.value || ""}
            extendedOpt={true}
          />

          {selectedSessao && (
            <SearchableSelect2
              label="Área*"
              options={areasOptions}
              onChange={(value) => {
                const selected = areasOptions.find(
                  (opt) => opt.value === value
                );
                setSelectedArea(selected);
              }}
              value={selectedArea?.value || ""}
              disabled={!selectedSessao}
              extendedOpt={true}
            />
          )}

          {selectedArea && (
            <SearchableSelect2
              label="Data e Horário de Apresentação*"
              options={subsessoesOptions}
              onChange={(value) => {
                const selected = subsessoesOptions.find(
                  (opt) => opt.value === value
                );
                setSelectedSubsessao(selected);
              }}
              value={selectedSubsessao?.value || ""}
              disabled={!selectedArea}
              extendedOpt={true}
            />
          )}

          <div className="flex justify-content-end gap-1">
            <Button
              label={loading ? "Agendando..." : "Agendar Apresentação"}
              type="submit"
              loading={loading}
              disabled={
                !selectedSessao ||
                !selectedArea ||
                !selectedSubsessao ||
                !selectedCategoria
              }
            />
          </div>
        </div>
      </form>
    </>
  );
};
