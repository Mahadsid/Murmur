// MIDDLEWARE FOR AUTH, FOR GETTING USER LOGGED IN SESSION OR USER SESSIONS.

import { KindeOrganization} from "@kinde-oss/kinde-auth-nextjs";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { base } from "./base";

// in this middleware we can use other middleware, like we are using base middleware bcz it defines our error messages so -> we can return our error message here easily.
export const requiredWorkspaceMiddleware = base.$context<{
    workspace?: KindeOrganization<unknown | null>;
}>().middleware(async ({ context, next, errors }) => {
    //Q: why this? A: we use "context.session" bcz if we already have session in our context then no need to unnesessary call to kinde, if not then only call and get session, 
    const workspace = context.workspace ?? (await getWorkspace());

    if (!workspace) {
        throw errors.FORBIDDEN();
    }

    return next({
        context: { workspace }
    })
});

const getWorkspace = async () => {
    const { getOrganization } = getKindeServerSession();
    const organization = await getOrganization();

    return organization;
};