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
        //implementing cursor-pagination
        limit: z.number().min(1).max(100).optional(),
        cursor: z.string().optional(),
    }))
    .output(z.object({
        items: z.array(z.custom<Message>()),
        nextCursor: z.string().optional(),
    }))
    .handler(async ({ input, errors, context }) => {
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

        // 2.get messages its simple no pagination.
        // const data = await prisma.message.findMany({
        //     where: {
        //         channelId: input.channelId,
        //     },
        //     orderBy: {
        //         createdAt: "desc",
        //     },
        // });
        // return data;

        // 2.get data with pagination.

        const limit = input.limit ?? 30;
        const messages = await prisma.message.findMany({
            where: {
                channelId: input.channelId,
            },
            ...(input.cursor ? {
                cursor: { id: input.cursor },
                skip: 1,
            } : {}),
            take: limit,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });
        const nextCursor = messages.length === limit ? messages[messages.length - 1].id : undefined;
        return {
            items: messages,
            nextCursor,
        };
    });
