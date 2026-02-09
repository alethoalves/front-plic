import { z } from "zod";

/**
 * Verifica se um campo é alvo de alguma regra (é condicionalmente obrigatório)
 */
const isCampoAlvo = (campoId, campos) => {
  return campos.some(
    (campo) =>
      campo.regras &&
      campo.regras.some((regra) => regra.camposAlvo.includes(campoId))
  );
};

export const createDynamicSchema = (campos) => {
  const schemaFields = {};

  campos.forEach((campo) => {
    // Converte o id para string com um prefixo para evitar que seja interpretado como array
    const key = `campo_${campo.id}`;

    // Verifica se este campo é alvo de alguma regra
    const ehCampoAlvo = isCampoAlvo(campo.id, campos);

    switch (campo.tipo) {
      case "textLong":
      case "text":
        // Para campos de texto, considere se o campo é obrigatório e qual o máximo de caracteres
        let textSchema = z
          .string({
            required_error: campo.obrigatorio && !ehCampoAlvo
              ? "Campo obrigatório!"
              : undefined,
          })
          .max(
            campo.maxChar || 255,
            `Máximo de ${campo.maxChar || 255} caracteres.`
          );
        
        // Se é campo alvo de regra, sempre é opcional no schema
        // A obrigatoriedade será validada apenas quando a condição for atendida
        if (ehCampoAlvo) {
          textSchema = textSchema.optional();
        } else if (campo.obrigatorio) {
          textSchema = textSchema
            .min(1, "Campo obrigatório!")
            .refine(val => val?.trim().length > 0, "Campo obrigatório!");
        } else {
          textSchema = textSchema.min(0).optional();
        }

        schemaFields[key] = textSchema;
        break;

      case "number":
        // Para números, você pode ajustar conforme a regra de negócio (ex: mínimo, máximo, etc.)
        let numberSchema = z.number({
          required_error: campo.obrigatorio && !ehCampoAlvo
            ? "Campo obrigatório!"
            : undefined,
        });
        
        if (ehCampoAlvo) {
          numberSchema = numberSchema.optional();
        } else if (campo.obrigatorio) {
          numberSchema = numberSchema.refine(
            val => val !== undefined && val !== null && val !== "",
            "Campo obrigatório!"
          );
        } else {
          numberSchema = numberSchema.optional();
        }
        
        schemaFields[key] = numberSchema;
        break;

      case "date":
        // Para datas, ainda que sejam strings, você pode adicionar refinamentos se necessário
        let dateSchema = z.string({
          required_error: campo.obrigatorio && !ehCampoAlvo
            ? "Campo obrigatório!"
            : undefined,
        });
        
        if (ehCampoAlvo) {
          dateSchema = dateSchema.optional();
        } else if (campo.obrigatorio) {
          dateSchema = dateSchema.min(1, "Campo obrigatório!");
        } else {
          dateSchema = dateSchema.min(0).optional();
        }
        
        schemaFields[key] = dateSchema;
        break;

      case "select":
        // Para selects, valide a obrigatoriedade
        let selectSchema = z.string({
          required_error: campo.obrigatorio && !ehCampoAlvo
            ? "Campo obrigatório!"
            : undefined,
        });
        
        if (ehCampoAlvo) {
          selectSchema = selectSchema.optional().nullable();
        } else if (campo.obrigatorio) {
          selectSchema = selectSchema.min(1, "Campo obrigatório!");
        } else {
          selectSchema = selectSchema.min(0).optional().nullable();
        }
        
        schemaFields[key] = selectSchema;
        break;

      case "multiselect":
        // Para multisselect, valide array e obrigatoriedade
        let multiSelectSchema = z
          .union([
            z.array(z.string()),
            z.string().transform(val => val ? [val] : [])
          ])
          .transform(val => Array.isArray(val) ? val : [val]);
        
        if (ehCampoAlvo) {
          // Se é campo alvo, sempre é opcional no schema
          multiSelectSchema = multiSelectSchema.optional();
        } else if (campo.obrigatorio) {
          multiSelectSchema = multiSelectSchema.refine(
            (value) => Array.isArray(value) && value.length > 0,
            "Selecione pelo menos uma opção!"
          );
        } else {
          multiSelectSchema = multiSelectSchema.optional();
        }
        
        schemaFields[key] = multiSelectSchema;
        break;

      case "arquivo":
        // Para arquivos, valide tanto a obrigatoriedade quanto o tipo do arquivo
        let fileSchema = z.any().refine(
          (file) => {
            // Se o valor for uma string (no modo de edição), considera válido
            if (typeof file === "string") return true;
            
            // Se é campo alvo, permite vazio
            if (ehCampoAlvo) {
              if (!file) return true;
              if (file instanceof FileList && file.length === 0) return true;
            }
            
            // Se o campo é obrigatório (e não é alvo de regra), verifica se um arquivo foi enviado
            if (campo.obrigatorio && !ehCampoAlvo) {
              if (!file) return false;
              if (file instanceof FileList && file.length === 0) return false;
            }
            
            // Se houver um arquivo e se houver restrição de tipo, verifica se o arquivo possui o tipo esperado
            if (file && campo.tipoFile) {
              const fileObj = file instanceof FileList ? file[0] : file;
              if (!fileObj) {
                return true;
              } else if (fileObj) {
                return fileObj.type
                  .toLowerCase()
                  .includes(campo.tipoFile.toLowerCase());
              }
            }
            
            return true;
          },
          {
            message: campo.obrigatorio && !ehCampoAlvo
              ? `Arquivo obrigatório! ${campo.tipoFile ? `Por favor, envie um arquivo do tipo ${campo.tipoFile}.` : ""}`
              : `Formato de arquivo inválido! Por favor, envie um arquivo do tipo ${campo.tipoFile}.`,
          }
        );
        
        schemaFields[key] = fileSchema;
        break;

      default:
        break;
    }
  });

  const baseSchema = z.object(schemaFields);

  // Função auxiliar para verificar condições (mesma lógica usada em applyConditionalRules)
  const verificaCondicao = (valor, condicao, valores) => {
    const valorArray = Array.isArray(valor) ? valor : [valor];

    switch (condicao) { 
      case "IGUAL":
        return valorArray.some((v) => valores.includes(v));
      case "DIFERENTE":
        return !valorArray.some((v) => valores.includes(v));
      case "CONTÉM":
        return valorArray.some((v) =>
          v && typeof v === "string"
            ? valores.some((val) => v.toLowerCase().includes(val.toLowerCase()))
            : false
        );
      case "NÃO_CONTÉM":
        return !valorArray.some((v) =>
          v && typeof v === "string"
            ? valores.some((val) => v.toLowerCase().includes(val.toLowerCase()))
            : false
        );
      case "VAZIO":
        return (
          !valor || (Array.isArray(valor) && valor.length === 0) || valor === ""
        );
      case "NÃO_VAZIO":
        return (
          valor && (Array.isArray(valor) ? valor.length > 0 : valor !== "")
        );
      case "MAIOR_QUE":
        return Number(valor) > Number(valores[0]);
      case "MENOR_QUE":
        return Number(valor) < Number(valores[0]);
      default:
        return true;
    }
  };

  // Função auxiliar para verificar se um valor está vazio de acordo com o tipo do campo
  const isEmptyForCampo = (campo, value) => {
    if (campo.tipo === "multiselect") {
      if (!value) return true;
      if (Array.isArray(value)) return value.length === 0;
      return String(value).trim() === "";
    }

    if (campo.tipo === "text" || campo.tipo === "textLong" || campo.tipo === "select" || campo.tipo === "date") {
      return !value || (typeof value === "string" && value.trim() === "");
    }

    if (campo.tipo === "number") {
      return value === undefined || value === null || value === "";
    }

    if (campo.tipo === "arquivo") {
      if (!value) return true;
      if (typeof value === "string") return value.trim() === "";
      if (value instanceof FileList) return value.length === 0;
      return false; // assume File object is present
    }

    // default fallback
    return !value;
  };

  // Adiciona validação condicional: quando uma regra do tipo MOSTRAR é atendida,
  // os campos alvo devem ser considerados obrigatórios
  const conditionalSchema = baseSchema.superRefine((data, ctx) => {
    // 'data' é o objeto com chaves como 'campo_129'
    campos.forEach((campo) => {
      if (!campo.regras || campo.regras.length === 0) return;

      campo.regras.forEach((regra) => {
        // Apenas tratamos regras do tipo MOSTRAR aqui (camposAlvo obrigatórios quando condição verdadeira)
        if (regra.acao !== "MOSTRAR") return;

        const triggerKey = `campo_${regra.campoId}`;
        const triggerValue = data[triggerKey];
        const condicaoAtingida = verificaCondicao(triggerValue, regra.condicao, regra.valores);

        if (condicaoAtingida) {
          // valida cada campo alvo
          regra.camposAlvo.forEach((campoAlvoId) => {
            const alvoKey = `campo_${campoAlvoId}`;
            const campoDef = campos.find((c) => c.id === campoAlvoId);
            const valorAlvo = data[alvoKey];

            if (!campoDef) return;

            if (isEmptyForCampo(campoDef, valorAlvo)) {
              ctx.addIssue({
                path: [alvoKey],
                code: z.ZodIssueCode.custom,
                message: campoDef.tipo === "multiselect" ? "Selecione pelo menos uma opção!" : "Campo obrigatório!",
              });
            }
          });
        }
      });
    });
  });

  return conditionalSchema;
};
