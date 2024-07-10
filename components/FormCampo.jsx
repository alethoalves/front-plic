import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from "@/components/Button";
import { RiSave2Line } from '@remixicon/react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from "@/components/Input";
import Select from "@/components/Select";
import styles from './Form.module.scss';
import { createCampo, updateCampo } from '@/app/api/clientReq';
import { campoSchema } from '@/lib/zodSchemas/campoSchema';



const FormCampo = ({ tenantSlug, formularioId, initialData, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { control, handleSubmit, setValue, reset } = useForm({
    resolver: zodResolver(campoSchema),
    defaultValues: {
      label: '',
      descricao: '',
      tipo: '',
      maxChar: '',
      obrigatorio: 'false',
      ordem:'1'
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue('label', initialData.label);
      setValue('descricao', initialData.descricao);
      setValue('tipo', initialData.tipo);
      setValue('maxChar', initialData.maxChar.toString());
      setValue('obrigatorio', initialData.obrigatorio ? 'true' : 'false');
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

  const handleFormSubmit = async (data) => {
    console.log('Form Data:', data); // Adiciona log para verificar os dados do formulário
    setLoading(true);
    setErrorMessage('');
    try {
      if (initialData) {
        await updateCampo(tenantSlug, formularioId, initialData.id, data);
      } else {
        await createCampo(tenantSlug, formularioId, data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error.response?.data?.error?.message ?? "Erro na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(handleFormSubmit)}>
      <div className={styles.input}>
        <Input
          className="mb-2"
          control={control}
          name="label"
          label='Título da pergunta'
          inputType="text"
          placeholder='Digite aqui o título da pergunta'
          disabled={loading}
        />
        <Input
          className="mb-2"
          control={control}
          name="descricao"
          label='Descrição da pergunta, se necessário'
          inputType="text"
          placeholder='Digite aqui a descrição da pergunta'
          disabled={loading}
        />
        <Input
          control={control}
          name="obrigatorio"
          label='Obrigatório'
          inputType="checkbox"
          disabled={loading}
        />
        <Select
          className="mb-2"
          control={control}
          name="tipo"
          label='Tipo de campo'
          options={[
            { label: "Selecione uma opção", value: "" },
            { label: "Texto curto", value: "text" },
            { label: "Texto longo", value: "textLong" },
            { label: "Seleção", value: "select" },
            { label: "Arquivo", value: "arquivo" },
            { label: "Link", value: "link" },
          ]}
          disabled={loading}
        />
        <Input
          className="mb-2"
          control={control}
          name="maxChar"
          label='Máximo de caracteres'
          inputType="number"
          placeholder='Informe o número máximo de caracteres'
          disabled={loading}
        />
        
      </div>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      <div className={styles.btnSubmit}>
        <Button
          icon={RiSave2Line}
          className="btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Salvar campo'}
        </Button>
      </div>
    </form>
  );
};

export default FormCampo;
