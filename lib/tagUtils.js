import { Tag } from "primereact/tag";

/**
 * Determina o severity do Tag baseado no status de classificação
 * @param {string} status - Status da classificação (EM_ANALISE, APROVADA, RECUSADA, SUBSTITUIDA)
 * @returns {string} - Valor do severity para o componente Tag
 */
export const getSeverityByStatus = (status) => {
    if (!status) return ''; // Fallback para status vazio
    
    switch (status.toUpperCase()) {
      case 'APROVADA':
      case 'APROVADO':
      case 'ATIVO':
      case 'CLASSIFICADO': // Adicionei para manter compatibilidade com seu exemplo anterior
        return 'success';
      case 'RECUSADA':
      case 'RECUSADO':
      case 'DESCLASSIFICADO': // Adicionei para manter compatibilidade
        return 'danger';
      case 'SUSPENSO':
      case 'SUBSTITUIDA':
      
        return 'warning';
    case 'pendente':
    case 'PENDENTE':
        return 'warning';
      case 'EM_ANALISE':
        return '';
      default:
        return 'info';
    }
  };
  
  /**
   * Formata o texto do status para exibição
   * @param {string} status - Status original
   * @returns {string} - Texto formatado
   */
  export const formatStatusText = (status) => {
    if (!status) return 'em análise';
    
    return status.toLowerCase().replace(/_/g, ' ');
  };

  export const renderStatusTagWithJustificativa = (
    status,
    justificativa,
    {
      statusText = formatStatusText(status),
      icon = "pi pi-info-circle",
      tooltip = "Clique para ver a justificativa",
      tagStyle = {},
      showIcon = true,
      onShowJustificativa, // <--- nova prop
    } = {}
  ) => {
    const hasJustificativa = !!justificativa;
    const severity = getSeverityByStatus(status);
  
    return (
      <Tag
        rounded
        severity={severity}
        onClick={(e) => {
          if (hasJustificativa && onShowJustificativa) {
            e.preventDefault();
            onShowJustificativa(justificativa);
          }
        }}
        style={{
          cursor: hasJustificativa ? "pointer" : "default",
          textDecoration: hasJustificativa ? "underline dotted" : "none",
          ...tagStyle,
        }}
        title={hasJustificativa ? tooltip : ""}
      >
        <div style={{ display: "flex" }}>
          {statusText}
          {hasJustificativa && showIcon && <i className={`${icon} ml-2`} />}
        </div>
      </Tag>
    );
  };
  