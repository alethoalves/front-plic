import { zodResolver } from '@hookform/resolvers/zod';
import Button from "@/components/Button";
import { RiSearchLine } from '@remixicon/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { buscador } from '@/lib/zodSchemas/buscador';
import Input from "@/components/Input";
import Select from "@/components/Select";

import styles from './FormNewFormulario.module.scss'
import { formNewFormulario } from '@/lib/zodSchemas/formNewFormulario';

const FormNewFormulario = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
    
    
    
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
            <Input
              control={control}
              name="titulo"
              label='Título do formulário'
              inputType="text" // text, password
              placeholder='Digite aqui o título do formulário'
              //autoFocus
              disabled={loading}
            />
            <Select
              control={control}
              name="tipo"
              label='Título do formulário'
              inputType="text" // text, password
              placeholder='Digite aqui o título do formulário'
              options={[{label:"Selecione uma opção", value:""},{label:"option 1", value:"option1"},{label:"option 2", value:"option2"}]}
              //autoFocus
              disabled={loading}
            />
          </div>
          <div className={`${styles.btnSubmit}`}>
            <Button
                icon={RiSearchLine}
                className="btn-primary"
                type="submit" // submit, reset, button
                disabled={loading}
              >{loading ? 'Carregando...' : 'Pesquisar'}
            </Button>
          </div>
      </form>
    );
  };
  
  export default FormNewFormulario;