import z from "zod";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { writeSecurityMiddleware } from "../middlewares/arcjet/write";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorkspaceMiddleware } from "../middlewares/workspace";
import prisma from "@/lib/db";
import { createMessageSchema, GroupedReactionSchema, GroupedReactionSchemaType, toggleReactionSchema, updateMessageSchema } from "../schemas/message";
import { getAvatar } from "@/lib/get-avatar";
import { Message } from "@/lib/generated/prisma/client";
import { readSecurityMiddleware } from "../middlewares/arcjet/read";
import { MessageListItem } from "@/lib/types";

function groupReactions(
    reactions: { emoji: string; userId: string }[],
    userId: string
): GroupedReactionSchemaType[] {
    const reactionMap = new Map<string, { count: number; reactedByMe: boolean }>()

    for (const reaction of reactions) {
        const existing = reactionMap.get(reaction.emoji)
        if (existing) {
            existing.count++
            if (reaction.userId === userId) {
                existing.reactedByMe = true
            }
        } else {
            reactionMap.set(reaction.emoji, {
                count: 1,
                reactedByMe: reaction.userId === userId
            })
        }
    }
    return Array.from(reactionMap.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        reactedByMe: data.reactedByMe,
    }))
}

//to render reply count we extend Message  BCZ THIS IS USED IN MESSAGELIST.TSX ALSO SO WE MAKE TYPES.TS FILE IN LIB FOLDER AND EXPORT IT FROM THERE.
// type MessageListItem = Message & {
//     repliesCount: number;
// };

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
                id: input.channelId,
                workspaceId: context.workspace.orgCode,
            }
        });
        if (!channel) {
            throw errors.FORBIDDEN();
        }

        // If this is a thread reply, validate the parent message
        if (input.threadId) {
            const parentMessage = await prisma.message.findFirst({
                where: {
                    id: input.threadId,
                    channel: {
                        workspaceId: context.workspace.orgCode,
                    },
                },
            });
            if (!parentMessage || parentMessage.channelId !== input.channelId || parentMessage.threadId !== null) {
                throw errors.BAD_REQUEST();
            }
        }


        const created = await prisma.message.create({
            data: {
                content: input.content,
                imageUrl: input.imageUrl,
                channelId: input.channelId,
                authorId: context.user.id,
                authorEmail: context.user.email!,
                authorName: context.user.given_name ?? "Guest User",
                authorAvatar: getAvatar(context.user.picture, context.user.email!
                ),
                threadId: input.threadId,
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
        items: z.array(z.custom<MessageListItem>()), //To get replies count we change the ouput type
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
                threadId: null,
            },
            ...(input.cursor ? {
                cursor: { id: input.cursor },
                skip: 1,
            } : {}),
            take: limit,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            //To get replies count
            include: {
                _count: { select: { replies: true } },
                MessageReaction: {
                    select: {
                        emoji: true,
                        userId: true,
                    }
                }
            }
        });

        //now to reply we make an array including all objects
        const items: MessageListItem[] = messages.map((m) => ({
            id: m.id,
            content: m.content,
            imageUrl: m.imageUrl,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            authorAvatar: m.authorAvatar,
            authorEmail: m.authorEmail,
            authorId: m.authorId,
            authorName: m.authorName,
            channelId: m.channelId,
            threadId: m.threadId,
            replyCount: m._count.replies,
            reactions: groupReactions(
                m.MessageReaction.map((r) => ({
                    emoji: r.emoji,
                    userId: r.userId,
                })),
                context.user.id
            )
        }))

        const nextCursor = messages.length === limit ? messages[messages.length - 1].id : undefined;
        return {
            items: items,
            nextCursor,
        };
    });


// FOR UPDATING MESSAGES
export const updateMessage = base
    .use(requiredAuthMiddleware)
    .use(requiredWorkspaceMiddleware)
    .use(standardSecurityMiddleware)
    .use(writeSecurityMiddleware)
    .route({
        method: "PUT",
        path: "/messages/:messageId",
        summary: "Update a messages",
        tags: ["Messages"],
    })
    .input(updateMessageSchema)
    .output(z.object({
        message: z.custom<Message>(),
        canEdit: z.boolean(),
    }))
    .handler(async ({ input, errors, context }) => {
        const message = await prisma.message.findFirst({
            where: {
                id: input.messageId,
                channel: {
                    workspaceId: context.workspace.orgCode,
                },
            },
            select: {
                id: true,
                authorId: true,
            }
        });
        if (!message) {
            throw errors.NOT_FOUND();
        }
        if (message.authorId !== context.user.id) {
            throw errors.FORBIDDEN();
        }
        const updated = await prisma.message.update({
            where: {
                id: input.messageId,
            },
            data: {
                content: input.content,
            },
        });
        return {
            message: updated,
            canEdit: updated.authorId === context.user.id, //so only user can edit their own messages and cannot change other user messages.
        }

    });

//procedure for getting thread/reply messages
export const listThreadReplies = base
    .use(requiredAuthMiddleware)
    .use(requiredWorkspaceMiddleware)
    .use(standardSecurityMiddleware)
    .use(readSecurityMiddleware)
    .route({
        method: "GET",
        path: "/messages/:messageId/thread",
        summary: "List replies in a thread",
        tags: ["Messages"],
    })
    .input(z.object({
        messageId: z.string(),
    }))
    .output(z.object({
        parent: z.custom<MessageListItem>(),
        messages: z.array(z.custom<MessageListItem>()),
    }))
    .handler(async ({ input, errors, context }) => {
        // 1.Find the current message or message on which click is done to see its replies.
        const parentRow = await prisma.message.findFirst({
            where: {
                id: input.messageId,
                channel: {
                    workspaceId: context.workspace.orgCode,
                }
            },
            include: {
                _count: {
                    select: {
                        replies: true,
                    }
                },
                MessageReaction: {
                    select: {
                        emoji: true,
                        userId: true,
                    }
                }
            }
        });
        //defense
        if (!parentRow) {
            throw errors.NOT_FOUND();
        }

        //fetch all thread replies & messages
        const messagesQuery = await prisma.message.findMany({
            where: {
                threadId: input.messageId,
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            include: {
                _count: {
                    select: {
                        replies: true
                    }
                },
                MessageReaction: {
                    select: {
                        emoji: true,
                        userId: true,
                    }
                }
            }
        });

        const parent: MessageListItem = {
            id: parentRow.id,
            content: parentRow.content,
            imageUrl: parentRow.imageUrl,
            authorAvatar: parentRow.authorAvatar,
            authorEmail: parentRow.authorEmail,
            authorId: parentRow.authorId,
            authorName: parentRow.authorName,
            channelId: parentRow.channelId,
            createdAt: parentRow.createdAt,
            updatedAt: parentRow.updatedAt,
            threadId: parentRow.threadId,
            replyCount: parentRow._count.replies,
            reactions: groupReactions(
                parentRow.MessageReaction.map((r) => ({
                    emoji: r.emoji,
                    userId: r.userId,
                })),
                context.user.id
            ),
        }

        const messages: MessageListItem[] = messagesQuery.map((m) => (
            {
                id: m.id,
                content: m.content,
                imageUrl: m.imageUrl,
                authorAvatar: m.authorAvatar,
                authorEmail: m.authorEmail,
                authorId: m.authorId,
                authorName: m.authorName,
                channelId: m.channelId,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt,
                threadId: m.threadId,
                replyCount: m._count.replies,
                reactions: groupReactions(
                    m.MessageReaction.map((r) => ({
                        emoji: r.emoji,
                        userId: r.userId,
                    })),
                    context.user.id
                )
            }
        ));
        return {
            parent,
            messages,
        }

    });


//procedure to store emojis reaction with related to msg
export const toggleReaction = base
    .use(requiredAuthMiddleware)
    .use(requiredWorkspaceMiddleware)
    .use(standardSecurityMiddleware)
    .use(writeSecurityMiddleware)
    .route({
        method: "POST",
        path: "/messages/:messageId/reactions",
        summary: "Toggle a reaction",
        tags: ["Messages"],
    })
    .input(toggleReactionSchema)
    .output(z.object({
        messageId: z.string(),
        reactions: z.array(GroupedReactionSchema),
    }))
    .handler(async ({ input, errors, context }) => {
        const message = await prisma.message.findFirst({
            where: {
                id: input.messageId,
                channel: {
                    workspaceId: context.workspace.orgCode,
                }
            },
            select: {
                id: true,
            }
        });
        //defece
        if (!message) {
            throw errors.NOT_FOUND();
        }

        //mutation logic
        const inserted = await prisma.messageReaction.createMany({
            data: [
                {
                    emoji: input.emoji,
                    messageId: input.messageId,
                    userId: context.user.id,
                    userName: context.user.given_name ?? "Anonymous User",
                    userAvatar: getAvatar(context.user.picture, context.user.email!),
                    userEmail: context.user.email!,
                }
            ],
            skipDuplicates: true,
        })
        //if not inserted emoji, we write deleteMany or deleting code also bcz it is a toggle functionality
        if (inserted.count === 0) {
            await prisma.messageReaction.deleteMany({
                where: {
                    messageId: input.messageId,
                    userId: context.user.id,
                    emoji: input.emoji,
                }
            })
        }

        const updated = await prisma.message.findUnique({
            where: {
                id: input.messageId,
            },
            include: {
                MessageReaction: {
                    select: {
                        emoji: true,
                        userId: true,
                    },
                },
                _count: {
                    select: {
                        replies: true,
                    },
                },
            },
        });

        if (!updated) {
            throw errors.NOT_FOUND();
        }

        return {
            messageId: updated.id,
            reactions: groupReactions(
                (updated.MessageReaction ?? []).map((r) => ({
                    emoji: r.emoji,
                    userId: r.userId,
                })),
                context.user.id,
            )
        }
    });