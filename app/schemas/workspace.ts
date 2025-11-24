//zod schema file for workspace. path-> (dashboard)/workspace/_components/create workspace

import { z } from 'zod';

export const workspaceSchema = z.object({
    name: z.string().min(2).max(50),
})