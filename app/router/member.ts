// route for inviting member, check InvitingMember.tsx

import z from "zod";
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/base";
import { requiredWorkspaceMiddleware } from "../middlewares/workspace";
import { inviteMemberSchema } from "../schemas/member";
import { init, organization_user, Organizations, Users } from "@kinde/management-api-js";
import { getAvatar } from "@/lib/get-avatar";
import { readSecurityMiddleware } from "../middlewares/arcjet/read";

export const inviteMember = base
    .use(requiredAuthMiddleware)
    .use(requiredWorkspaceMiddleware)
    .use(standardSecurityMiddleware)
    .use(heavyWriteSecurityMiddleware)
    .route({
        method: "POST",
        path: "/workspace/members/invite",
        summary: "Invite Member",
        tags: ["Members"],
    })
    .input(inviteMemberSchema)
    .output(z.void())
    .handler(async ({ input, context, errors }) => {
        try {
            init() // kinde api wrapper

            //1. check if user already exists globally
            // 1. Check if user exists globally
            const existing = await Users.getUsers({ email: input.email });
            const user = existing.users?.find(u => u.email === input.email);
            //if user exists add to org else create new user and add it to org.
            if (user?.id) {
                //2 Check if user already exists in this org
                const orgUsers = await Organizations.getOrganizationUsers({
                    orgCode: context.workspace.orgCode,
                });
                const alreadyMember = orgUsers.organization_users?.some(
                    (ou) => ou.id === user.id
                );
                if (alreadyMember) {
                    // USER ALREADY IN ORG
                    throw errors.BAD_REQUEST({ message: "Member already exists in this organization!" });
                }
                await Organizations.addOrganizationUsers({
                    orgCode: context.workspace.orgCode,
                    requestBody: {
                        users: [{ id: user.id }]
                    }
                })
            } else {
                //create new user and put into kinde in the workspace
                await Users.createUser({
                    requestBody: {
                        organization_code: context.workspace.orgCode,
                        profile: {
                            given_name: input.name,
                            picture: getAvatar(null, input.email),
                        },
                        identities: [
                            {
                                type: "email",
                                details: {
                                    email: input.email,
                                }
                            }
                        ]
                    }
                })
            }

        } catch (err) {
            //  ORPC-safe rethrow
            if (err instanceof Error && "status" in err) {
                throw err;
            }
            throw errors.INTERNAL_SERVER_ERROR();
        }
    })


// route to get all members inside a workspace
export const listMembers = base
    .use(requiredAuthMiddleware)
    .use(requiredWorkspaceMiddleware)
    .use(standardSecurityMiddleware)
    .use(readSecurityMiddleware)
    .route({
        method: "GET",
        path: "/workspace/members",
        summary: "List all members",
        tags: ["Members"],
    })
    .input(z.void())
    .output(z.array(z.custom<organization_user>())) // hover over below return statement to see which type it is, it is an array so z.array, custom bcz it is not from us, copy paste it and then import it from kinde-api-js
    .handler(async ({ context, errors }) => {
        try {
            init() // kinde api wrapper

            //get users from workspace and display in MembersOverview.tsx
            const data = await Organizations.getOrganizationUsers({
                orgCode: context.workspace.orgCode,
                sort: "name_asc",
            });

            //defence code otherwise error
            if (!data.organization_users) {
                throw errors.NOT_FOUND();
            }

            return data.organization_users;

        } catch {
            throw errors.INTERNAL_SERVER_ERROR();
        }
    })