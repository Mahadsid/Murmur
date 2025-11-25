// MIDDLEWARE FOR AUTH, FOR GETTING USER LOGGED IN SESSION OR USER SESSIONS.

import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { base } from "./base";

// in this middleware we can use other middleware, like we are using base middleware bcz it defines our error messages so -> we can return our error message here easily.
export const requiredAuthMiddleware = base.$context<{
    session?: { user?: KindeUser<Record<string, unknown>> };
}>().middleware(async ({ context, next }) => {
    //Q: why this? A: we use "context.session" bcz if we already have session in our context then no need to unnesessary call to kinde, if not then only call and get session, 
    const session = context.session ?? (await getSession());

    if (!session.user) {
        return redirect("/api/auth/login");
    }

    return next({
        context: { user: session.user }
    })
});

const getSession = async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    return {
        user,
    };
};