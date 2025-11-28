import z from "zod";

// Function to convert channel names like SLACK channels name in which channel name convert to like lowercase, channel-name, no space in front and back, multiple spacesin between words converts to single -.
export function transformChannelName(name: string) {
    return name
        .toLowerCase()
        .replace(/\s+/g, "-") //replace space with dash
        .replace(/[^a-z0-9-]/g, "") //remove special char, keep only letters, numberes, dashes
        .replace(/-+/g, "-") //erplace multiple consicutive dashes with single dash
        .replace(/^-|-$/g, ""); //remove leading, trailing dashes.
}

export const ChannelNameSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long.").max(50, "Name must at most be 50 characters long.")
        .transform((name, ctx) => {
            const transformed = transformChannelName(name);
            if (transformed.length < 2) {
                ctx.addIssue({
                    code: "custom",
                    message: "Channel must contain at least 2 characters."
                });
                return z.NEVER;
            }
            return transformed;
    })
 
});

export type ChannelSchemaNameType = z.infer<typeof ChannelNameSchema>;