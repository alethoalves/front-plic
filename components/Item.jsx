import { RiArrowRightSLine, RiDeleteBinLine, RiEditLine } from '@remixicon/react';
import styles from './Item.module.scss';


const Item = ({
    titulo,
    subtitulo,
    labelSubtitulo,
    descricao,
    status, //{label:'',tipo:enum('error','warning','success')}
    handleEdit,
    handleDelete,
    navigateTo
}) => {

return (
<div className={styles.itemList}>
    <div className={styles.headItemList}>
        <div className={styles.info}>
            <div className={styles.head}>
                {status&&(
                <div className={`${styles.status} ${styles[status.tipo]}`}>
                    <p>{status.label}</p>
                </div>
                )}
                <p className={styles.titulo}>{titulo} </p>
            </div>
            
            {subtitulo&&
            <p className={styles.subtitulo}>{labelSubtitulo&&<span>{labelSubtitulo}</span>}{`: ${subtitulo}`}</p>
            }
            {descricao&&
            <p className={styles.descricao}>{descricao}</p>
            }
        </div>
        <div className={styles.actions}>
            
            {handleEdit&&(
            <div className={styles.edit}
                //() => openModalAndSetData(atividade)
                onClick={handleEdit}>
                <RiEditLine/>
            </div>
            )}
            {handleDelete&&(
            <div className={`${styles.delete} ${navigateTo&&'mr-1'}`}
                //() => {setDeleteModalOpen(true);setItemToDelete(atividade)}
                onClick={handleDelete}>
                <RiDeleteBinLine/>
            </div>
            )}
            {navigateTo&&(
            <div className={styles.navigate}
                onClick={() => {router.push(navigateTo)}}
            >
                <RiArrowRightSLine/>
            </div>
            )}
        </div>
    </div>
</div>
  );
}
export default Item;
