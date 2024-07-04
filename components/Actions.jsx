
import Button from "@/components/Button";

import { RiAddLine, RiFileExcelLine} from "@remixicon/react";
import styles from './Actions.module.scss'


const Actions = ({onClickPlus}) => {
  
    return (
      <div className={styles.actions}>
          <div className="btn">
            <Button
              onClick={onClickPlus}
              icon={RiAddLine}
              className="btn-primary"
              type="submit" // submit, reset, button
            >Nova Inscrição</Button>
          </div>
          <div className="btn">
            <Button
              icon={RiFileExcelLine}
              className="btn-green ml-1"
              type="submit" // submit, reset, button
            >Exportar excel</Button>
          </div>
      </div>
    );
  };
  
  export default Actions;