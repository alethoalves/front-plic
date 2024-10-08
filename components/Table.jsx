import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
const Table = ({ children, data, pageInfo, setPageInfo }) => {
  const handleNext = () => {
    setPageInfo((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  const handlePrevious = () => {
    setPageInfo((prev) =>
      prev.page > 1 ? { ...prev, page: prev.page - 1 } : prev
    );
  };

  // const columns = Object.keys(data[0]);

  return (
    <div className="table-container">
      {pageInfo && (
        <div className="actions-table">
          <button
            className="button btn-secondary"
            onClick={handlePrevious}
            disabled={pageInfo?.page === 1}
          >
            Anterior
          </button>
          <button
            className="button btn-secondary"
            onClick={handleNext}
            disabled={pageInfo?.page * pageInfo?.limit >= pageInfo?.total}
          >
            Próximo
          </button>
        </div>
      )}

      <table className={`${!pageInfo && "withoutPage"}`}>{children}</table>
    </div>
  );
};

export default Table;
