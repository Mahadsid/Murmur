import z from "zod";

export const createMessageSchema = z.object({
    channeId: z.string(),
    content: z.string(),
    imageUrl: z.url().optional(),
 
});

export type CreateMessageSchemaType = z.infer<typeof createMessageSchema>;