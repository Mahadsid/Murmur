import { GroupedReactionSchemaType } from "@/app/schemas/message";
import { Message } from "./generated/prisma/client";

//to render reply count we extend Message  BCZ THIS IS USED IN MESSAGELIST.TSX ALSO SO WE MAKE TYPES.TS FILE IN LIB FOLDER AND EXPORT IT FROM THERE.
export type MessageListItem = Message & {
    replyCount: number;
    reactions: GroupedReactionSchemaType[];
};