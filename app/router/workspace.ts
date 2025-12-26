import { KindeOrganization, KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
//import { os } from "@orpc/server";
import { z } from 'zod'
import { base } from "../middlewares/base";
import { requiredAuthMiddleware } from "../middlewares/auth";
import { requiredWorkspaceMiddleware } from "../middlewares/workspace";
import { workspaceSchema } from "../schemas/workspace";
import { Organizations, init } from "@kinde/management-api-js";
import { standardSecurityMiddleware } from "../middlewares/arcjet/standard";
import { heavyWriteSecurityMiddleware } from "../middlewares/arcjet/heavy-write";

//++++++++++++++++++++++++++++++++++++ LIST/GET WORKSPACE ROUTE ++++++++++++++++++++++++++++++++++++ 
// to make the route we can attach our middleware here and it can work, like we attack base middleware here. previously we just building route with os from orpc but we can define middlewares and attach them here.
export const listWorkspaces = base
    .use(requiredAuthMiddleware)
    .use(requiredWorkspaceMiddleware)
    .route({
        method: "GET",
        path: "/workspace",
        summary: "list all workspaces",
        tags: ["workspace"],
        //input is what user will pass, but this is GET req and we want to fetch data so we dont user to pass anything so we void it.
    }).input(z.void())
    // output is what handler will return. so in handler we write query logic. and what shape we rturn is passed in output,
    .output(z.object({
        workspaces: z.array(
            z.object({
                id: z.string(),
                name: z.string(),
                avatar: z.string(),
            })
        ),
        user: z.custom<KindeUser<Record<string, unknown>>>(),
        currentWorkspace: z.custom<KindeOrganization<unknown>>(),
    })
    )
    .handler(async ({ context, errors }) => {
        const { getUserOrganizations } = getKindeServerSession();

        const organizations = await getUserOrganizations();

        if (!organizations) {
            throw errors.FORBIDDEN();
        }

        return {
            workspaces: organizations?.orgs.map((org) => ({
                id: org.code,
                name: org.name ?? "My Workspace",
                avatar: org.name?.charAt(0) ?? "M",
            })),
            user: context.user,
            currentWorkspace: context.workspace
        };
    });

//++++++++++++++++++++++++++++++++++++ CREATE/POST WORKSPACE ROUTE ++++++++++++++++++++++++++++++++++++

export const createWorkspace = base
    .use(requiredAuthMiddleware)
    .use(requiredWorkspaceMiddleware)
    .use(standardSecurityMiddleware)
    .use(heavyWriteSecurityMiddleware)
    .route({
        method: "POST",
        path: "/workspace",
        summary: "Create a new workspace",
        tags: ["workspace"],
        //input is what user will pass, this is a POST req and we want to create a workspace from data we getfrom user. so we give our input schema we created.
    }).input(workspaceSchema)
    // output is what handler will return. so in handler we write query logic. and what shape we rturn is passed in output,
    .output(
        z.object({
            orgCode: z.string(),
            workspaceName: z.string(),
        })
    )
    .handler(async ({ context, errors, input }) => {
        // USING KINDE API FOR CREATION of workspace, https://docs.kinde.com/kinde-apis/management/#tag/api-keys , this url is original apis, but easy way to do this using abstraction here checkout, install it and use it, here: https://github.com/kinde-oss/management-api-js
        // **NOTE TO SELF** WITH above also need to make m2m machine application in kinde give is API scope and authorize it. so checkout Youtube if not understanding

        // Step 1: use init so it can interact with .env variables and make API work
        init();

        // Step 2: make the required data in format you need to send and handle errors
        let data;
        // User making an Organization.
        try {
            data = await Organizations.createOrganization({
                requestBody: {
                    name: input.name
                },
            })
        } catch {
            throw errors.FORBIDDEN();
        }


        // Defence code so below code dont give error.
        if (!data.organization?.code) {
            throw errors.FORBIDDEN({
                message: "Organization code is not defined or wrong."
            })
        }
        // Step 3: Add the user to he organization which he just created above.
        try {
            await Organizations.addOrganizationUsers({
                orgCode: data.organization.code,
                // in which organisation which we put the user, & what user we want to put in this organization.
                requestBody: {
                    users: [
                        {
                            // context bcz we put context from middleware of auth and get its context here.
                            id: context.user.id,
                            roles: ["admin"],
                        }
                    ]
                }
            })
        } catch {
            throw errors.FORBIDDEN();
        }

        // Step 5 : ya step 5 in logic, Refresh your tokens, Kinde store  our data in access token, and this token is generated when we log in but now since  we create a new workspace, we want to update the token, and tell KINDE specifically User has now access to a new organization, please update the token with new data. sooooo the token get updated and we will know there is new organization is created and it will show up on sidebar.
        const { refreshTokens } = getKindeServerSession()
        await refreshTokens();

        // Step 4: return the call exactly like the output declaration.
        return {
            orgCode: data.organization.code,
            workspaceName: input.name,
        }

    });