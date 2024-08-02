import { z } from 'zod';

export const cargoSchema = z.object({
    cargo: z.enum(['gestor']),
});


