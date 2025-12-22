// Standard arcjet security, like shield, bot protection.

import arcjet, { detectBot, sensitiveInfo, shield } from "@/lib/arcjet"
import { base } from "../base";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";



const buildStandardAj = () =>
    arcjet.withRule(
        shield({
            mode: "LIVE",
        })
    ).withRule(
        detectBot({
            mode: "LIVE",
            allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW', 'CATEGORY:MONITOR'],
        })
    ).withRule(
            sensitiveInfo({
                mode: "LIVE",
                deny: ["PHONE_NUMBER", "CREDIT_CARD_NUMBER", "EMAIL", "IP_ADDRESS"]
            })
    );

export const standardSecurityMiddleware = base.$context<{
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
        if (decision.reason.isBot()) {
            throw errors.FORBIDDEN({
                message: 'Automated/Bot traffic blocked.'
            });
        }
        if (decision.reason.isShield()) {
            throw errors.FORBIDDEN({
                message: 'Request blocked due to security policy (WAF) violation.'
            });
        }

        //else Default error
        throw errors.FORBIDDEN({
            message: 'Request Blocked!'
            });
    }
    return next();
});

