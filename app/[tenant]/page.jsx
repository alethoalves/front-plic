'use client'
import { Notification } from "@/components/Notification";
import styles from "./page.module.scss";
import { useState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { signinSchema } from "@/lib/zodSchemas/authSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiAtLine, RiIdCardLine, RiLock2Line } from "@remixicon/react";
import { signin } from "../api/clientReq";

const Page = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (data) => {
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      const response = await signin(data);
      if(response.success){
        router.push('/gestor')
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error.response?.data?.error?.message ?? "Erro na conexão com o servidor.")
    } finally {
      setLoading(false);
    }
  };
 
  const { control, handleSubmit} = useForm({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      cpf: '',
      senha: '',
    },
  });
  return (
   <main className={styles.container}>
    <div className={styles.auth}>
      <div className={styles.logo}>
      <p>...</p>
      </div>
      <div className={styles.header}>
        <h4>Faça o login para acessar a plataforma</h4>
      </div>
      {errorMessage&&
        <Notification className="notification-error">{errorMessage}</Notification>
      }
      <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className={styles.form}>
            <div className={styles.formInput}>
              <Input
                control={control}
                className="cpf-input"
                name="cpf"
                label='CPF'
                icon={RiIdCardLine} 
                inputType="text" // text, password
                placeholder='Digite seu CPF'
                autoFocus
                disabled={loading}
              />
            </div>
            <div className={styles.formInput}>
              <Input
                control={control}
                name="senha"
                label='Senha'
                icon={RiLock2Line} 
                inputType="password" // text, password 
                placeholder='Digite sua senha'
                disabled={loading}
              />
            </div>
            
          </div>
          <div className="actions">
            <div className="actions-item-2">
              <Button
                className="btn-primary"
                type="submit" // submit, reset, button
                disabled={loading}
              >{loading ? 'Carregando...' : 'Entrar'}</Button>
            </div>
          </div>
        </form>
    </div>
    
   </main>
  );
}

export default Page;