import { zodResolver } from '@hookform/resolvers/zod';
import Button from "@/components/Button";
import { RiSearchLine } from '@remixicon/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { buscador } from '@/lib/zodSchemas/buscador';
import Input from "@/components/Input";
import styles from './BuscadorFormularios.module.scss'

const BuscadorFormularios = () => {
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
      resolver: zodResolver(buscador),
      defaultValues: {
        value: ''
      },
    });
    return (
      <form className={`${styles.buscador}`} onSubmit={handleSubmit(handleFormSubmit)}>
          <div className={`${styles.input}`}>
            <Input
              control={control}
              name="value"
              label='Buscar'
              inputType="text" // text, password
              placeholder='Pesquise aqui'
              //autoFocus
              disabled={loading}
            />
          </div>
          <div className={`${styles.btnBuscador}`}>
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
  
  export default BuscadorFormularios;