import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const Table = ({ data, pageInfo, setPageInfo, onRowClick,  }) => {
  console.log(data)
  const handleNext = () => {
    setPageInfo(prev => ({ ...prev, page: prev.page + 1 }));
  };

  const handlePrevious = () => {
    setPageInfo(prev => prev.page > 1 ? { ...prev, page: prev.page - 1 } : prev);
  };
  
  if (!data.length) {
    return <p>Nenhuma inscrição encontrada</p>;
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>
                <p>{column.charAt(0).toUpperCase() + column.slice(1)}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
        {data.map((row, rowIndex) => (
            <tr key={rowIndex} onClick={() => onRowClick(row.id)}>
              {columns.map((column, colIndex) => (
                <td key={colIndex}>
                  {column === 'createdAt' ? (
                    <p>{format(new Date(row[column]), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  ) : column === 'status' ? (
                    <p className={`status ${row[column].color}`}>{row[column].value}</p>
                  ) : (
                    typeof row[column] === 'object' ? (
                      <>
                        <h6>{Object.values(row[column])[0]}</h6>
                        <p>{Object.values(row[column])[1]}</p>
                      </>
                    ) : (
                      <p>{row[column]}</p>
                    )
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={handlePrevious} disabled={pageInfo.page === 1}>Anterior</button>
        <button onClick={handleNext} disabled={pageInfo.page * pageInfo.limit >= pageInfo.total}>Próximo</button>
      </div>
    </div>
  );
};

export default Table;
