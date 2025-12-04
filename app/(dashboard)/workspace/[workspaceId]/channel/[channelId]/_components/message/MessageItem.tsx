import { SafeContent } from "@/components/rich-text-editor/SafeContent";
import { Message } from "@/lib/generated/prisma/client";
import { getAvatar } from "@/lib/get-avatar";
import Image from "next/image";


interface iAppProps {
   message: Message
}

export function MessageItem({message} : iAppProps) {

    return ( 
        <div className="flex space-x-3 relative p-3 rounded-lg group hover:bg-muted/50">
            <Image src={getAvatar(message.authorAvatar, message.authorEmail)} alt="User Avatar" width={32} height={32} className="size-8 rounded-lg" />
            <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-x-2">
                    <p className="font-medium leading-none"> {message.authorName}</p>
                    <p className="text-xs text-muted-foreground leading-none">
                        {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        }).format(message.createdAt)
                        }
                        {" "}
                        {new Intl.DateTimeFormat("en-GB", {
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                        }).format(message.createdAt)
                        }
                    </p>
                </div>
                {/* Since we store messages in database by stringyfy the JSON so when retreiving the message in below code it shows like "tye:json""content: hiais" withis code But we want to deisplay message only, so we make a new component and inside that we covert sting -> JSON and take our content and render it. CHECKOUT SafeContent.tsx & lib/json-to-html.ts*/}
                {/* <p className="text-sm break-word max-w-none marker:text-primary">{ message.content }</p> */}
                <SafeContent content={JSON.parse(message.content)} classname="text-sm break-words prose dark:prose-invert max-w-none marker:text-primary"/>
            </div>
        </div>

    )
}