//HOOKS
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formNewFormulario } from '@/lib/zodSchemas/formNewFormulario';

//ESTILOS E ÍCONES
import styles from './Form.module.scss'
import { RiSave2Line } from '@remixicon/react';

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";

//FUNÇÕES
import { createFormulario, updateFormulario } from '@/app/api/clientReq';

const FormNewFormulario = ({ tenantSlug, initialData, onClose, onSuccess }) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { control, handleSubmit, setValue, reset } = useForm({
    resolver: zodResolver(formNewFormulario),
    defaultValues: {
      titulo: '',
      descricao:'',
      tipo:'',
      onSubmitStatus: ''
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue('titulo', initialData.titulo);
      setValue('descricao', initialData.descricao);
      setValue('tipo', initialData.tipo);
      setValue('onSubmitStatus', initialData.onSubmitStatus);
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    try {
      if (initialData) {
        await updateFormulario(tenantSlug, initialData.id, data);
      } else {
        await createFormulario(tenantSlug, data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error.response?.data?.error?.message ?? "Erro na conexão com o servidor.")
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={`${styles.formulario}`} onSubmit={handleSubmit(handleFormSubmit)}>
      <div className={`${styles.input}`}>
        <Input
          className="mb-2"
          control={control}
          name="titulo"
          label='Título do formulário'
          inputType="text"
          placeholder='Digite aqui o título do formulário'
          disabled={loading}
        />
        <Input
          className="mb-2"
          control={control}
          name="descricao"
          label='Descrição do formulário'
          inputType="text"
          placeholder='Digite aqui o título do formulário'
          disabled={loading}
        />
        <Select
          className="mb-2"
          control={control}
          name="tipo"
          label='Tipo de formulário'
          options={[
            { label: "Selecione uma opção", value: "" },
            { label: "orientador", value: "orientador" },
            { label: "aluno", value: "aluno" },
            { label: "projeto", value: "projeto" },
            { label: "plano de trabalho", value: "planoDeTrabalho" },
            { label: "atividade", value: "atividade" },
            { label: "avaliacao", value: "avaliacao" }
          ]}
          disabled={loading}
        />
        <Select
          control={control}
          name="onSubmitStatus"
          label='Status após submissão'
          options={[
            { label: "Selecione uma opção", value: "" },
            { label: "Concluído", value: "concluido" },
            { label: "Aguardando Avaliação", value: "aguardandoAvaliacao" }
          ]}
          disabled={loading}
        />
      </div>
      <div className={`${styles.btnSubmit}`}>
        <Button
          icon={RiSave2Line}
          className="btn-primary"
          type="submit"
          disabled={loading}
        >{loading ? 'Carregando...' : 'Salvar formulário'}
        </Button>
      </div>
      {errorMessage && <div className={`notification notification-error`}><p className='p5'>{errorMessage}</p></div> }
    </form>
  );
};

export default FormNewFormulario;
