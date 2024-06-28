'use client'
import { Notification } from "@/components/Notification";
import styles from "./page.module.scss";
import { useState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { signinSchema } from "@/lib/zodSchemas/authSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiAtLine, RiLock2Line } from "@remixicon/react";

const Page = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (data) => {
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      const response = true//await signin(data);
      if(response.success){
        //router.push('/home')
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
      email: '',
      senha: '',
      manterLogado:true
    },
  });
  return (
   <main className={styles.container}>
    <div className={styles.auth}>
      <div className={styles.logo}>
      ...
      </div>
      <div className="header">
        <h4>Faça o login para acessar a plataforma</h4>
      </div>
      {errorMessage&&
        <Notification className="notification-error">{errorMessage}</Notification>
      }
      <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="content">
            <Input
              control={control}
              name="email"
              className='content-item-1'
              label='E-mail'
              icon={RiAtLine} 
              inputType="text" // text, password
              placeholder='Digite seu email'
              autoFocus
              disabled={loading}
            />
            <Input
              control={control}
              name="senha"
              className='content-item-2'
              label='Senha'
              icon={RiLock2Line} 
              inputType="password" // text, password 
              placeholder='Digite sua senha'
              disabled={loading}
            />
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