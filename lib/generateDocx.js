import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

const sanitizeText = (text) => {
  return text ? String(text).replace(/<[^>]*>?/gm, '') : '';
};

export const gerarDocxDosResumos = async (submissaoData, eventoTitulo) => {
  const doc = new Document({
    sections: submissaoData.map((sub, index) => {
      const resumo = sub.Resumo || {};
      const participacoes = resumo.participacoes || [];
      const conteudo = resumo.conteudo || [];

      const autores = participacoes
        .filter((p) => p.cargo === 'AUTOR')
        .map((p) => sanitizeText(p.user?.nome || 'Nome não disponível'))
        .join(', ');

      const orientadores = participacoes
        .filter((p) => p.cargo === 'ORIENTADOR' || p.cargo === 'COORIENTADOR')
        .map(
          (p) =>
            `${sanitizeText(p.user?.nome || 'Nome não disponível')} (${
              p.cargo
            })`,
        )
        .join(', ');

      const area = resumo.area?.area || 'Área não disponível';
      const grandeArea = resumo.area?.grandeArea?.grandeArea || 'Grande Área não disponível';
      const tenantSigla = sub.tenant?.sigla || 'Tenant não disponível';

      const contentParagraphs = conteudo.flatMap((item) => [
        new Paragraph({
          children: [
            new TextRun({
              text: sanitizeText(item.nome),
              bold: true,
              size: 24, // H3 equivalent
            }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: sanitizeText(item.conteudo),
              size: 20, // P equivalent
            }),
          ],
          spacing: { after: 200 },
        }),
      ]);

      return {
        children: [
          new Paragraph({
            text: eventoTitulo,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: sanitizeText(resumo.titulo || 'Título não disponível'),
            heading: HeadingLevel.HEADING1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Autores: ', bold: true }),
              new TextRun({ text: autores }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Orientadores/Coorientadores: ', bold: true }),
              new TextRun({ text: orientadores || 'Nenhum' }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Área: ', bold: true }),
              new TextRun({ text: area }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Grande Área: ', bold: true }),
              new TextRun({ text: grandeArea }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Instituição: ', bold: true }),
              new TextRun({ text: tenantSigla }),
            ],
            spacing: { after: 300 },
          }),
          ...contentParagraphs,
          // Add a page break if it's not the last submission
          ...(index < submissaoData.length - 1 ? [new Paragraph({ pageBreakBefore: true })] : []),
        ],
      };
    }),
  });

  const buffer = await Packer.toBuffer(doc);
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'submissoes_evento.docx');
};