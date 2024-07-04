
import Button from "@/components/Button";

const data = [
  {
    proponente: { nome: "Aletho Alves de Sá Oliveira", email: "alethoalves@gmail.com" },
    numeroInscricao: "1234",
    data: "23/04/2025",
    status: { value: "Pendente", color: "warning" },
    outrColuna:"alethoalves@gmail.com",
    outrColuna2:"alethoalves@gmail.com",
    outrColuna3:"alethoalves@gmail.com"
  },
  {
    proponente: { nome: "Lúcia Helena Alves de Sá", email: "luciahelana@gmail.com"},
    numeroInscricao: "1235",
    data: "23/04/2025",
    status: { value: "Concluído", color: "green" }
  },
  {
    proponente: { nome: "Lúcia Helena Alves de Sá", email: "luciahelana@gmail.com"},
    numeroInscricao: "1235",
    data: "23/04/2025",
    status: { value: "Concluído", color: "green" }
  },
  {
    proponente: { nome: "Lúcia Helena Alves de Sá", email: "luciahelana@gmail.com"},
    numeroInscricao: "1235",
    data: "23/04/2025",
    status: { value: "Concluído", color: "green" }
  },
  {
    proponente: { nome: "Lúcia Helena Alves de Sá", email: "luciahelana@gmail.com"},
    numeroInscricao: "1235",
    data: "23/04/2025",
    status: { value: "Concluído", color: "green" }
  },
  {
    proponente: { nome: "Lúcia Helena Alves de Sá", email: "luciahelana@gmail.com"},
    numeroInscricao: "1235",
    data: "23/04/2025",
    status: { value: "Concluído", color: "green" }
  },
  {
    proponente: { nome: "Lúcia Helena Alves de Sá", email: "luciahelana@gmail.com"},
    numeroInscricao: "1235",
    data: "23/04/2025",
    status: { value: "Concluído", color: "green" }
  },
  {
    proponente: { nome: "Lúcia Helena Alves de Sá", email: "luciahelana@gmail.com"},
    numeroInscricao: "1235",
    data: "23/04/2025",
    status: { value: "Concluído", color: "green" }
  },
  {
    proponente: { nome: "Lúcia Helena Alves de Sá", email: "luciahelana@gmail.com"},
    numeroInscricao: "1235",
    data: "23/04/2025",
    status: { value: "Concluído", color: "green" }
  },
  {
    proponente: { nome: "Lúcia Helena Alves de Sá", email: "luciahelana@gmail.com"},
    numeroInscricao: "1235",
    data: "23/04/2025",
    status: { value: "Concluído", color: "green" }
  },
  {
    proponente: { nome: "Lúcia Helena Alves de Sá", email: "luciahelana@gmail.com"},
    numeroInscricao: "1235",
    data: "23/04/2025",
    status: { value: "Concluído", color: "green" }
  }
];
const Table = () => {
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
          <tr key={rowIndex}>
            {columns.map((column, colIndex) => (
              <td key={colIndex}>
                {column === 'status' ? (
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
    </div>

  );
};



export default Table;
