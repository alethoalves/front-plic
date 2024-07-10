import { RiSearchLine } from '@remixicon/react';
import { useState } from 'react';
import Button from "@/components/Button";
import styles from './BuscadorFront.module.scss'

const BuscadorFront = ({ setSearchTerm }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setSearchTerm(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(inputValue);
  };

  return (
    <form className={`${styles.buscador}`} onSubmit={handleSubmit}>
      <div className={`${styles.input}`}>
        <div className="input-container">
          <input
            className='p-2'
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder='Pesquise aqui'
          />
        </div>
      </div>
      <div className={`${styles.btnBuscador}`}>
        <Button
          icon={RiSearchLine}
          className="btn-primary"
          type="submit"
        >
          Pesquisar
        </Button>
      </div>
    </form>
  );
};

export default BuscadorFront;
