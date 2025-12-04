import z from "zod";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { writeSecurityMiddleware } from "../middlewares/arcjet/write";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorkspaceMiddleware } from "../middlewares/workspace";
import prisma from "@/lib/db";
import { createMessageSchema } from "../schemas/message";
import { getAvatar } from "@/lib/get-avatar";
import { Message } from "@/lib/generated/prisma/client";
import { readSecurityMiddleware } from "../middlewares/arcjet/read";


export const createMessage = base
    .use(requiredAuthMiddleware)
    .use(requiredWorkspaceMiddleware)
    .use(standardSecurityMiddleware)
    .use(writeSecurityMiddleware)
    .route({
        method: "POST",
        path: "/messages",
        summary: "Create/store a message",
        tags: ["Messages"],
    })
    .input(createMessageSchema)
    .output(z.custom<Message>())
    .handler(async ({ input, context, errors }) => {
        // Secqurity-CHECK{IMPORTANT} verift the channel belongs to the user's organization.
        const channel = await prisma.channel.findFirst({
            where: {
                id: input.channeId,
                workspaceId: context.workspace.orgCode,
            }
        });
        if (!channel) {
            throw errors.FORBIDDEN();
        }

        const created = await prisma.message.create({
            data: {
                content: input.content,
                imageUrl: input.imageUrl,
                channelId: input.channeId,
                authorId: context.user.id,
                authorEmail: context.user.email!,
                authorName: context.user.given_name ?? "Guest User",
                authorAvatar: getAvatar(context.user.picture, context.user.email!
                ),
            }
        });
        return {
            ...created,
        }
    });


// Procedure for geting all messages from database


export const listMessages = base
    .use(requiredAuthMiddleware)
    .use(requiredWorkspaceMiddleware)
    .use(standardSecurityMiddleware)
    .use(readSecurityMiddleware)
    .route({
        method: "GET",
        path: "/messages",
        summary: "List all messages",
        tags: ["Messages"],
    })
    .input(z.object({
        channelId: z.string(),
    }))
    .output(z.array(z.custom<Message>()))
    .handler(async ({input, errors, context}) => {
        // 1.Security checkpoint: check if channel belongs to user organizayion/workspace.
        const channel = await prisma.channel.findFirst({
            where: {
                id: input.channelId,
                workspaceId: context.workspace.orgCode,
            },
        });
        if (!channel) {  //defense 
            throw errors.FORBIDDEN();
        }

        // 2.get messages
        const data = await prisma.message.findMany({
            where: {
                channelId: input.channelId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return data;
    })
