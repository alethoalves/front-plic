import { zodResolver } from '@hookform/resolvers/zod';
import Button from "@/components/Button";
import { RiSave2Line } from '@remixicon/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Input from "@/components/Input";
import styles from './Form.module.scss'
import { formEdital } from '@/lib/zodSchemas/formEdital';
import { createEdital } from '@/app/api/clientReq';

const FormEdital = ({ tenant, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await createEdital(tenant, data);
      console.log(response)
      if (response) {
        onSuccess(); // Chama a função de sucesso para fechar o modal e atualizar a lista
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error.response?.data?.error?.message ?? "Erro na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(formEdital),
    defaultValues: {
      titulo: '',
      ano: ''
    },
  });

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
          name="ano"
          label='Ano do edital'
          inputType="number"
          placeholder='Digite aqui o ano do edital'
          disabled={loading}
        />
      </div>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      <div className={`${styles.btnSubmit}`}>
        <Button
          icon={RiSave2Line}
          className="btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Criar formulário'}
        </Button>
      </div>
    </form>
  );
};

export default FormEdital;
