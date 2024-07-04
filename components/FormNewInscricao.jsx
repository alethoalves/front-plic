import { zodResolver } from '@hookform/resolvers/zod';
import Button from "@/components/Button";
import { RiSave2Line, RiSearchLine } from '@remixicon/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { buscador } from '@/lib/zodSchemas/buscador';
import Input from "@/components/Input";
import Select from "@/components/Select";

import styles from './Form.module.scss'
import { formNewFormulario } from '@/lib/zodSchemas/formNewFormulario';

const FormNewInscricao =  ({data}) => {
  console.log(data)
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const editais = [
    { label: "Selecione uma opção", value: "" },
    ...data.editais.map(item => ({
        label: `${item.titulo} - ${item.ano}`,
        value: item.id
    }))
];
    const handleFormSubmit = async (data) => {
      setLoading(true);
      setErrorMessage('');
      try {
        console.log(data)
        //const response = await signin(data);
        //if(response.success){
        //  console.log('sucesso')
        //}
      } catch (error) {
        console.error('Error:', error);
        setErrorMessage(error.response?.data?.error?.message ?? "Erro na conexão com o servidor.")
      } finally {
        setLoading(false);
      }
    };
   
    const { control, handleSubmit} = useForm({
      resolver: zodResolver(formNewFormulario),
      defaultValues: {
        titulo: '',
        tipo: ''
      },
    });
    return (
      <form className={`${styles.formulario}`} onSubmit={handleSubmit(handleFormSubmit)}>
          <div className={`${styles.input}`}>
            
            <Select
              control={control}
              name="tipo"
              label='Escolha o edital'
              options={editais}
              disabled={loading}
            />
          </div>
          <div className={`${styles.btnSubmit}`}>
            <Button
                icon={RiSave2Line}
                className="btn-primary"
                type="submit" // submit, reset, button
                disabled={loading}
              >{loading ? 'Carregando...' : 'Iniciar inscrição'}
            </Button>
          </div>
      </form>
    );
  };
  
  export default FormNewInscricao;