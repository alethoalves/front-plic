//HOOKS 
import { useState } from 'react';
import { useForm } from 'react-hook-form';

//ESTILOS E ÍCONES
import styles from './Form.module.scss'

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from './Select';
import { formNewParticipacao } from '@/lib/zodSchemas/formNewParticipacao';
import { zodResolver } from '@hookform/resolvers/zod';
import { createParticipacao } from '@/app/api/clientReq';

const DataSubmissionForm = ({tenantSlug, initialData, inscricaoId, onSuccess,onClose }) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, setValue } = useForm({
    resolver: zodResolver(formNewParticipacao),
    defaultValues: {
      userId: '',
      nome: '',
      cpf: '',
      status: '',
      tipo: '',
      cvLattesId: '',
      ...initialData
    },
  });
  const handleFormSubmit = async (data) => {
    const {tipo} = data
    const status = 'incompleto'
    const cvLattesId = ""
    const newData = {...initialData,tipo,inscricaoId,status,cvLattesId}
    //inscricaoId, cpf, nome, status, tipo, planoDeTrabalhoId
    setLoading(true);
    setError('');
    try {
      await createParticipacao(tenantSlug, newData);
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
    <form className={styles.formulario} onSubmit={handleSubmit(handleFormSubmit)}>
      <p className={styles.infoLabel}>Nome </p>
      <div className={styles.info}>
        <p>{initialData.nome}</p>
      </div>
      <Select
          className="mb-2"
          control={control}
          name="tipo"
          label='Tipo de orientador'
          options={[
            { label: "Selecione uma opção", value: "" },
            { label: "Orientador", value: "orientador" },
            { label: "Coorientador", value: "coorientador" },
          ]}
          disabled={loading}
        />
      <Button
        className="btn-primary"
        type="submit"
      >
        Enviar
      </Button>
      {error && <div className={`notification notification-error`}><p className='p5'>{error}</p></div> }
    </form>
  );
};

export default DataSubmissionForm;
