import { req } from "@/app/api/axios";

export const getEventoBySlug = async (slugEvento) => {
    try {
        const response = await req.get(`/evento/${slugEvento}`);
        return response.data.evento;
    } catch (error) {
        // Para outros erros, relança o erro para que o chamador possa tratá-lo
        console.error('Erro ao obter o tenant:', error);
        throw error;
    }
  };

 