import z from "zod";
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorkspaceMiddleware } from "../middlewares/workspace";
import { ChannelNameSchema } from "../schemas/channel";
import prisma from "@/lib/db";
import { Channel } from "@/lib/generated/prisma/client";
import { error } from "console";
import { init, organization_user, Organizations } from "@kinde/management-api-js";
import { channel } from "diagnostics_channel";
import { KindeOrganization } from "@kinde-oss/kinde-auth-nextjs";

export const createChannel = base
    .use(requiredAuthMiddleware)
    .use(requiredWorkspaceMiddleware)
    .use(standardSecurityMiddleware)
    .use(heavyWriteSecurityMiddleware)
    .route({
        method: "POST",
        path: "/channels",
        summary: "Create a new channel",
        tags: ["channels"],
    })
    .input(ChannelNameSchema)
    .output(z.custom<Channel>())
    .handler(async ({ input, context }) => {
        const channel = await prisma.channel.create({
            data: {
                name: input.name,
                workspaceId: context.workspace.orgCode,
                createdById: context.user.id,
            },
        });
        return channel;
    });

// FOR LISTING CHANNELS / GET REQUEST TO DB
export const listChannels = base
    .use(requiredAuthMiddleware)
    .use(requiredWorkspaceMiddleware)
    .route({
        method: "GET",
        path: "/channels",
        summary: "List all channels",
        tags: ["channels"],
    })
    .input(z.void())
    .output(z.object({
        channels: z.array(z.custom<Channel>()),
        currentWorkspace: z.custom<KindeOrganization<unknown>>(),
        members: z.array(z.custom<organization_user>()),
    }))
    .handler(async ({ context }) => {

        const [channels, members] = await Promise.all([
            // Neon DB query
            prisma.channel.findMany({
                where: {
                    workspaceId: context.workspace.orgCode,
                },
                orderBy: {
                    createdAt: "desc",
                }
            }),
            
            // KINDE QUREY
            (async () => {
                init() //required to make request to KINDE, see import.
                // also getting users in that channel by making call to KINDE.
                const userInOrg = await Organizations.getOrganizationUsers({
                    orgCode: context.workspace.orgCode, //like where in above call organization code matches to which workspace orgcode.
                    sort: "name_asc", // sort result based ob names ascending oreder, check out more on which parameters can be sorterd.
                });
                return userInOrg.organization_users ?? [];
            })(),
        ])
        /*
        THESE QUERY ARE CORRECT JUST WRITING THIS WAY THEY RUN SEQUENTIALLY BUT WE WANT THEM TO RUN PARALLELY SO SEE ABOVE CODE HOW TO MAKE THEM PARALLEL/
        const data = await prisma.channel.findMany({
            where: {
                workspaceId: context.workspace.orgCode,
            },
            orderBy: {
                createdAt: "desc",
            }
        });

        init() //required to make request to KINDE, see import.
        // also getting users in that channel by making call to KINDE.
        const userInOrg = await Organizations.getOrganizationUsers({
            orgCode: context.workspace.orgCode, //like where in above call organization code matches to which workspace orgcode.
            sort: "name_asc", // sort result based ob names ascending oreder, check out more on which parameters can be sorterd.
        })

        return data;
        */
        // after that return data
        return {
            channels,
            members,
            currentWorkspace: context.workspace,
        };
    });