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
import { createAtividade, createPlanoDeTrabalho,createRegistroAtividade,getEdital, updateAtividade } from '@/app/api/clientReq';
import { atividadeSchema } from '@/lib/zodSchemas/atividadeSchema';

const FormNewAtividade = ({ tenantSlug,editalId, initialData, formularios, onClose, onSuccess }) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { control, handleSubmit, setValue, reset } = useForm({
    resolver: zodResolver(atividadeSchema),
    defaultValues: {
      titulo: '',
      descricao:'',
      obrigatoria:true,
      aberta: true,
      formularioId:''
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue('titulo', initialData.titulo);
      setValue('descricao', initialData.descricao);
      setValue('obrigatoria', initialData.obrigatoria);
      setValue('aberta', initialData.aberta);
      setValue('formularioId', initialData.formularioId);
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);
  const incluirAtividadeNosPlanosDeTrabalho = async (tenantSlug, atividadeId, planosDeTrabalho) => {
    
    try {
      const promises = planosDeTrabalho.map(async (item) => {
        const registroAtividadeData = {
          status: "naoEntregue", // Ajustar conforme necessário
          planoDeTrabalhoId: item.id // ID do plano de trabalho do item
        };
  
        return await createRegistroAtividade(tenantSlug, atividadeId, registroAtividadeData);
      });
  
      const resultados = await Promise.all(promises);
      return resultados;
    } catch (error) {
      console.error('Erro ao incluir atividades nos planos de trabalho:', error);
      throw error;
    }
  };
  
  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError('');
    console.log(data)
    let atividade;
    try {
      
      if (initialData) {
        atividade = await updateAtividade(tenantSlug, editalId,initialData.id, data);
      } else {
        atividade = await createAtividade(tenantSlug,editalId, data);
        const edital = await getEdital(tenantSlug, editalId);
        if (edital.inscricoes[0].planosDeTrabalho[0]) {
          const result = await incluirAtividadeNosPlanosDeTrabalho(tenantSlug,atividade.atividade.id,edital.inscricoes[0].planosDeTrabalho)
          
        }
      }
      
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.error?.message ?? "Erro na conexão com o servidor.")
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
          label='Título da atividade'
          inputType="text"
          placeholder='Digite aqui o título da atividade'
          disabled={loading}
        />
        <Input
          className="mb-2"
          control={control}
          name="descricao"
          label='Descrição da atividade'
          inputType="text"
          placeholder='Digite aqui a descrição da atividade'
          disabled={loading}
        />
        <Select
          className="mb-2"
          control={control}
          name="obrigatoria"
          label='Atividade é obrigatória?'
          options={[
            { label: "Selecione uma opção", value: "" },
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ]}
          disabled={loading}
        />
        <Select
          control={control}
          className="mb-2"
          name="aberta"
          label='Permitir envio da atividade?'
          options={[
            { label: "Selecione uma opção", value: "" },
            { label: "Sim", value: true },
            { label: "Não", value: false }
          ]}
          disabled={loading}
        />
        <Select
          className="mb-2"
          control={control}
          name="formularioId"
          label='Escolha o formulário de submissão da atividade'
          options={[
            { label: `${initialData?'Excluir formulário':'Escolha uma opção'}`, value: "" },
            ...(formularios ? formularios.map(item => ({ label: item.titulo, value: item.id })) : [])
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
      {error && <div className={`notification notification-error`}><p className='p5'>{error}</p></div> }
    </form>
  );
};

export default FormNewAtividade;
