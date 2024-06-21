'use client'
import Header from "@/components/Header";
import { RiAddCircleLine, RiAtLine, RiSearchLine } from '@remixicon/react';
import Input from "@/components/Input";
import Button from "@/components/Button";
import styles from "./page.module.scss";
import { useState } from 'react';
import { buscador } from '@/lib/zodSchemas/buscador';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
const Page = () => {
  const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    // Formulário
    const handleFormSubmit = async (data) => {
      
      setLoading(true);
      setErrorMessage('');
      
      try {
        const response = await signin(data);
        if(response.success){
          console.log('sucesso')
        }
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
  <main>
    <Header 
    className="mb-3"
    titulo="Formulários"
    subtitulo="Edite e crie os formulários da sua instituição"
    descricao="Aqui você gerencia os formulários usados nas diversas etapas da iniciação científica."
    />
    <div >
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
    </div>
    <div className={`${styles.content}`}>
      <div className={`${styles.btnNewItem}`}>
        <div className={`${styles.icon}`}>
          <RiAddCircleLine/>
        </div>
        <p>Criar novo</p>
      </div>
      
      <div className={`${styles.btnItem}`}>
        <div className={styles.header}>
          <div className="h7">Formulário de participação</div>
          <p>Inscrição de aluno do PIBIC e PIBITI</p>
        </div>
        <div className={styles.actions}>
          <div className={`${styles.group1} mr-3`}>
            <Button
              icon={RiSearchLine}
              className="btn-primary "
              type="submit" // submit, reset, button
              disabled={loading}
            >{loading ? 'Carregando...' : 'Pesquisar'}</Button>
          </div>
          <div className={styles.group2}>
            <Button
              icon={RiSearchLine}
              className="btn-primary mr-1"
              type="submit" // submit, reset, button
              disabled={loading}
            ></Button>
            <Button
              icon={RiSearchLine}
              className="btn-primary"
              type="submit" // submit, reset, button
              disabled={loading}
            ></Button>
          </div>
          
        </div>
      </div>
    </div>
  </main>
  );
}

export default Page;