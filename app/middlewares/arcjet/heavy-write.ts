// Heavy Write operation which is creating a workspace so to protect that we use rate limiting 2 req per min.

import arcjet, { sensitiveInfo, slidingWindow } from "@/lib/arcjet"
import { base } from "../base";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";



const buildStandardAj = () =>
    arcjet.withRule(
        slidingWindow({
            mode: "LIVE",
            interval: "1m",
            max: 2,
        })
    )
        .withRule(
            sensitiveInfo({
                mode: "LIVE",
                deny: ["PHONE_NUMBER", "CREDIT_CARD_NUMBER", "EMAIL", "IP_ADDRESS"]
            })
    )

export const heavyWriteSecurityMiddleware = base.$context<{
    request: Request;
    user: KindeUser<Record<string, unknown>>;
}>().middleware(async ({ context, next, errors }) => {
    const decision = await buildStandardAj().protect(context.request, {
        userId: context.user.id,
    });

    if (decision.isDenied()) {
        if (decision.reason.isSensitiveInfo()) {
            throw errors.BAD_REQUEST({
                message: 'Sensitive information detected. Please remove PII (eg. credit card, phone number, email, IP address.'
            });
        }
        if (decision.reason.isRateLimit()) {
            throw errors.RATE_LIMITED({
                message: 'Too many requests. Please keep waiting time in each request.'
            });
        }
        //else Default error
        throw errors.FORBIDDEN({
            message: 'Request Blocked!'
            });
    }
    return next();
});

