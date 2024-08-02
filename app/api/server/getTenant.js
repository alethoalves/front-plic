import { req } from "@/app/api/axios";

export const getTenant = async (tenant) => {
    try {
        const response = await req.get(`/tenant/${tenant}`);
        return response.data.tenant;
    } catch (error) {
        // Para outros erros, relança o erro para que o chamador possa tratá-lo
        console.error('Erro ao obter o tenant:', error);
        throw error;
    }
  };