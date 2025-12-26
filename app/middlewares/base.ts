import { ArcjetNextRequest } from "@arcjet/next";
import { os } from "@orpc/server";

//Base middleware here setting like errors what we are going to show, they are coming from orpc and are typesafe
export const base = os.$context<{ request: Request | ArcjetNextRequest}>().errors({
    RATE_LIMITED: {
       message: "Rate limit exceeded, "
    },
    BAD_REQUEST: {
        message: "Bad request.",
    },
    NOT_FOUND: {
        message: "Not found.",
    },
    FORBIDDEN: {
        message: "This is forbidden.",
    },
    UNAUTHORIZED: {
        message: "You are unauthorized."
    },
    INTERNAL_SERVER_ERROR: {
        message: "Internal server error."
    }
})