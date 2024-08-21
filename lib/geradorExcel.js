import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';



export const processApiResponse = (response) => {
  // Encontrar o número máximo de orientadores em todos os objetos
  const maxOrientadores = Math.max(...response.map(item => item.orientadores.length));

  const result = [];

  response.forEach((item) => {
    // Iterar sobre cada plano de trabalho
    item.planosDeTrabalho.forEach((planoDeTrabalho) => {
      if (planoDeTrabalho.participacoes.length === 0) {
        // Se não houver alunos vinculados ao plano de trabalho
        const orientadoresObj = {};
        for (let i = 0; i < maxOrientadores; i++) {
          const orientador = item.orientadores[i] || {};
          orientadoresObj[`participacao[${i}]_id_orientador`] = orientador.id || null;
          orientadoresObj[`orientador[${i}]_id_orientador`] = orientador.id_orientador || null;
          orientadoresObj[`orientador[${i}]_cpf_orientador`] = orientador.cpf_orientador || null;
          orientadoresObj[`orientador[${i}]_nome_orientador`] = orientador.nome_orientador || null;
          orientadoresObj[`orientador[${i}]_status`] = orientador.status || null;
          orientadoresObj[`orientador[${i}]_inicio`] = orientador.inicio || null;
          orientadoresObj[`orientador[${i}]_fim`] = orientador.fim || null;
          orientadoresObj[`orientador[${i}]_tipo`] = orientador.tipo || null;
        }

        result.push({
          idInscricao: item.id,
          editalAno: item.editalAno,
          editalNome: item.editalNome,
          id_aluno: null,
          cpf_aluno: null,
          nome_aluno: null,
          id_participacao: null,
          status: null,
          inicio: null,
          fim: null,
          id_planoDeTrabalho: planoDeTrabalho.id,
          titulo: planoDeTrabalho.titulo,
          grandeArea: planoDeTrabalho.grandeArea,
          area: planoDeTrabalho.area,
          ...orientadoresObj,
        });
      } else {
        // Se houver alunos vinculados ao plano de trabalho
        planoDeTrabalho.participacoes.forEach((participacao) => {
          const orientadoresObj = {};
          for (let i = 0; i < maxOrientadores; i++) {
            const orientador = item.orientadores[i] || {};
            orientadoresObj[`participacao[${i}]_id_orientador`] = orientador.id || null;
            orientadoresObj[`orientador[${i}]_id_orientador`] = orientador.id_orientador || null;
            orientadoresObj[`orientador[${i}]_cpf_orientador`] = orientador.cpf_orientador || null;
            orientadoresObj[`orientador[${i}]_nome_orientador`] = orientador.nome_orientador || null;
            orientadoresObj[`orientador[${i}]_status`] = orientador.status || null;
            orientadoresObj[`orientador[${i}]_inicio`] = orientador.inicio || null;
            orientadoresObj[`orientador[${i}]_fim`] = orientador.fim || null;
            orientadoresObj[`orientador[${i}]_tipo`] = orientador.tipo || null;
          }

          result.push({
            idInscricao: item.id,
            editalAno: item.editalAno,
            editalNome: item.editalNome,
            id_aluno: participacao.id_aluno,
            cpf_aluno: participacao.cpf_aluno,
            nome_aluno: participacao.nome_aluno,
            id_participacao: participacao.id,
            status: participacao.status,
            inicio: participacao.inicio,
            fim: participacao.fim,
            id_planoDeTrabalho: planoDeTrabalho.id,
            titulo: planoDeTrabalho.titulo,
            grandeArea: planoDeTrabalho.grandeArea,
            area: planoDeTrabalho.area,
            ...orientadoresObj,
          });
        });
      }
    });

    // Caso não haja planos de trabalho, mas haja alunos
    if (item.planosDeTrabalho.length === 0) {
      item.alunos.forEach((aluno) => {
        const orientadoresObj = {};
        for (let i = 0; i < maxOrientadores; i++) {
          const orientador = item.orientadores[i] || {};
          orientadoresObj[`participacao[${i}]_id_orientador`] = orientador.id || null;
          orientadoresObj[`orientador[${i}]_id_orientador`] = orientador.id_orientador || null;
          orientadoresObj[`orientador[${i}]_cpf_orientador`] = orientador.cpf_orientador || null;
          orientadoresObj[`orientador[${i}]_nome_orientador`] = orientador.nome_orientador || null;
          orientadoresObj[`orientador[${i}]_status`] = orientador.status || null;
          orientadoresObj[`orientador[${i}]_inicio`] = orientador.inicio || null;
          orientadoresObj[`orientador[${i}]_fim`] = orientador.fim || null;
          orientadoresObj[`orientador[${i}]_tipo`] = orientador.tipo || null;
        }

        result.push({
          idInscricao: item.id,
          editalAno: item.editalAno,
          editalNome: item.editalNome,
          id_aluno: aluno.id_aluno,
          cpf_aluno: aluno.cpf_aluno,
          nome_aluno: aluno.nome_aluno,
          id_participacao: aluno.id,
          status: aluno.status,
          inicio: aluno.inicio,
          fim: aluno.fim,
          id_planoDeTrabalho: null,
          titulo: null,
          grandeArea: null,
          area: null,
          ...orientadoresObj,
        });
      });
    }
  });

  return result;
};
// Função para criar e baixar o Excel
export const downloadExcel = data => {
  console.log('DADOS RECEBIDOS PARA GERAR O EXCEL');
  console.log(data);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // Encontrar todos os rótulos de campo dinamicamente, incluindo orientadores
  const headers = [
    'idInscricao',
    'editalAno',
    'editalNome',
    'id_aluno',
    'cpf_aluno',
    'nome_aluno',
    'id_participacao_aluno',
    'status',
    'inicio',
    'fim',
    'id_planoDeTrabalho',
    'titulo',
    'grandeArea',
    'area',
  ];

  // Adicionar dinamicamente os rótulos para os orientadores
  const maxOrientadores = Math.max(...data.map(item => Object.keys(item).filter(key => key.startsWith('orientador[')).length / 8));

  for (let i = 0; i < maxOrientadores; i++) {
    headers.push(`orientador[${i}]_id`);
    headers.push(`orientador[${i}]_id_orientador`);
    headers.push(`orientador[${i}]_cpf_orientador`);
    headers.push(`orientador[${i}]_nome_orientador`);
    headers.push(`orientador[${i}]_status`);
    headers.push(`orientador[${i}]_inicio`);
    headers.push(`orientador[${i}]_fim`);
    headers.push(`orientador[${i}]_tipo`);
  }

  // Adicionar cabeçalhos
  worksheet.addRow(headers);

  // Adicionar dados
  data.forEach(item => {
    const row = headers.map(header => item[header] !== undefined ? item[header] : null);
    worksheet.addRow(row);
  });

  // Criar uma tabela a partir dos dados
  worksheet.addTable({
    name: 'InscricoesTable',
    ref: 'A1', // Começa na célula A1
    headerRow: true,
    columns: headers.map(header => ({ name: header })),
    rows: data.map(item => headers.map(header => item[header] !== undefined ? item[header] : null))
  });

  // Aplicar estilo à tabela
  const table = worksheet.getTable('InscricoesTable');
  table.style = {
    theme: 'TableStyleMedium9', // Um estilo predefinido do Excel
    showRowStripes: true,       // Alterna as cores das linhas
  };

  // Auto ajustar as colunas para caber o conteúdo
  

  // Gerar buffer
  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'inscricoes.xlsx');
  });
};