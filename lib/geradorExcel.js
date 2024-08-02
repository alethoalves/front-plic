import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const flattenObject = (obj, parentKey = '', result = {}) => {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            let newKey = parentKey ? `${parentKey}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenObject(obj[key], newKey, result);
            } else if (Array.isArray(obj[key])) {
                obj[key].forEach((item, index) => {
                    flattenObject(item, `${newKey}[${index}]`, result);
                });
            } else {
                result[newKey] = obj[key];
            }
        }
    }
    return result;
};

export const flattenedData = (apiData)=>apiData.flatMap(item =>
    item.planosDeTrabalho.flatMap(plano =>
        plano.registroAtividades.map(registro => {
            const respostasPlanificadas = registro.respostas.map(resposta => ({
                ...resposta,
                campoLabel: resposta.campo.label
            }));

            const planificado = {
                ...flattenObject(registro),
                atividadeTitulo: registro.atividade.titulo,
                atividadeDescricao: registro.atividade.descricao,
                formularioId: registro.atividade.formulario.id,
                formularioOnSubmitStatus: registro.atividade.formulario.onSubmitStatus,
                respostas: respostasPlanificadas
            };

            planificado['edital.id'] = item.edital.id;
            planificado['edital.titulo'] = item.edital.titulo;
            planificado['edital.ano'] = item.edital.ano;
            planificado['proponente.nome'] = item.proponente.nome;
            planificado['proponente.email'] = item.proponente.email;
            planificado['createdAt'] = item.createdAt;
            planificado['status'] = item.status;
            planificado['planoDeTrabalho.id'] = plano.id;
            planificado['planoDeTrabalho.titulo'] = plano.titulo;

            return planificado;
        })
    )
);
// Função para criar e baixar o Excel
export const downloadExcel = data => {
    console.log('DADOS RECEBIDOS PARA GERAR O EXCEL')
    console.log(data)
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
  
    // Encontrar todos os rótulos de campo (campo.label)
    const allLabels = new Set();
    data.forEach(item => {
      item.respostas.forEach(resposta => {
        allLabels.add(resposta.campo.label);
      });
    });
  
    // Colunas desejadas e na ordem correta, incluindo rótulos dinâmicos
    const headers = [
    'edital.titulo',
      'createdAt',
      'status',
      'atividade.titulo',
      'atividade.descricao',
      'atividade.formulario.onSubmitStatus',
      'planoDeTrabalho.id',
      'planoDeTrabalho.titulo',
      ...Array.from(allLabels)
    ];
  
    // Adicionar cabeçalhos
    worksheet.addRow(headers);
  
    // Adicionar dados
    data.forEach(item => {
      const row = headers.map(header => {
        if (header in item) {
          return item[header];
        }
        if (header.startsWith('atividade')) {
          const parts = header.split('.');
          return item.atividade[parts[1]];
        }
        if (header.startsWith('planoDeTrabalho')) {
          const parts = header.split('.');
          return item.planoDeTrabalho[parts[1]];
        }
        const resposta = item.respostas.find(resposta => resposta.campo.label === header);
        return resposta ? resposta.value : '';
      });
      worksheet.addRow(row);
    });
  
    // Gerar buffer
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'inscricoes.xlsx');
    });
  };