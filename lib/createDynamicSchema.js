import { z } from "zod";

export const createDynamicSchema = (campos) => {
  const schemaFields = {};

  campos.forEach((campo) => {
    // Converte o id para string com um prefixo para evitar que seja interpretado como array
    const key = `campo_${campo.id}`;

    switch (campo.tipo) {
      case "textLong":
      case "text":
        // Para campos de texto, considere se o campo é obrigatório e qual o máximo de caracteres
        schemaFields[key] = z
          .string({
            required_error: campo.obrigatorio
              ? "Campo obrigatório!"
              : undefined,
          })
          .min(campo.obrigatorio ? 1 : 0, "Campo obrigatório!")
          .max(
            campo.maxChar || 255,
            `Máximo de ${campo.maxChar || 255} caracteres.`
          );
        break;

      case "number":
        // Para números, você pode ajustar conforme a regra de negócio (ex: mínimo, máximo, etc.)
        schemaFields[key] = z
          .number({
            required_error: campo.obrigatorio
              ? "Campo obrigatório!"
              : undefined,
          })
          .min(1, "Campo obrigatório!");
        break;

      case "date":
        // Para datas, ainda que sejam strings, você pode adicionar refinamentos se necessário
        schemaFields[key] = z
          .string({
            required_error: campo.obrigatorio
              ? "Campo obrigatório!"
              : undefined,
          })
          .min(1, "Campo obrigatório!");
        break;

      case "arquivo":
        // Para arquivos, valide tanto a obrigatoriedade quanto o tipo do arquivo
        schemaFields[key] = z.any().refine(

          (file) => {
            // Se o valor for uma string (no modo de edição), considera válido
            if (typeof file === "string") return true;
            // Se o campo é obrigatório, verifica se um arquivo foi enviado
            if (campo.obrigatorio) {
              if (!file) return false;
              if (file instanceof FileList && file.length === 0) return false;
            }
            // Se houver um arquivo e se houver restrição de tipo, verifica se o arquivo possui o tipo esperado
            if (file && campo.tipoFile) {
              // Se for FileList, verifica o primeiro arquivo
              const fileObj = file instanceof FileList ? file[0] : file;
              if (!campo.obrigatorio &&!fileObj) {
                return true
              }else{
                return fileObj.type
                .toLowerCase()
                .includes(campo.tipoFile.toLowerCase());
              }
              
            }
            return true;
          },
          {
            message: campo.obrigatorio
              ? `Arquivo obrigatório ou formato inválido! Por favor, envie um arquivo do tipo ${campo.tipoFile}.`
              : `Formato de arquivo inválido! Por favor, envie um arquivo do tipo ${campo.tipoFile}.`,
          }
        );
        break;

      default:
        break;
    }
  });

  return z.object(schemaFields);
};