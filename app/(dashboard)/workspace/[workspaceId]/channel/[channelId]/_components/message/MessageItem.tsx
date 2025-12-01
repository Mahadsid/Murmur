import Image from "next/image";


interface iAppProps {
    id: number;
    message: string;
    date: Date;
    avatar: string;
    userName: string;
}

export function MessageItem({avatar, date, id, message, userName} : iAppProps) {

    return ( 
        <div className="flex space-x-3 relative p-3 rounded-lg group hover:bg-muted/50">
            <Image src={avatar} alt="User Avatar" width={32} height={32} className="size-8 rounded-lg" />
            <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-x-2">
                    <p className="font-medium leading-none"> {userName}</p>
                    <p className="text-xs text-muted-foreground leading-none">
                        {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        }).format(date)
                        }
                        {" "}
                        {new Intl.DateTimeFormat("en-GB", {
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                        }).format(date)
                        }
                    </p>
                </div>
                <p className="text-sm break-word max-w-none marker:text-primary">{ message }</p>
            </div>
        </div>

    )
}