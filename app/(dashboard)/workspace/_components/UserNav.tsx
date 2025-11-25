"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // https://ui.shadcn.com/docs/components/avatar
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // more on dropdown menu https://ui.shadcn.com/docs/components/dropdown-menu
import { getAvatar } from "@/lib/get-avatar";
import { orpc } from "@/lib/orpc";
import { LogoutLink, PortalLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CreditCard, LogOut, User } from "lucide-react";

// const Demouser = {
//     pictureUrl: "https://avatars.githubusercontent.com/u/65539715?v=4",
//     name: "Mahad Sid",
//     email: "muhammadmahad6@gmail.com"
// };

export function UserNav() {
    const { data: {user} } = useSuspenseQuery(orpc.workspace.list.queryOptions());
    return (
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="size-12 rounded-2xl hover:rounded-lg transition-all duration-200 bg-background/50 border-border/50 hover:bg-accent hover:text-accent-foreground" >
                <Avatar>
                    <AvatarImage src={getAvatar(user.picture, user.email!)} alt="User Image" className="object-cover" />
                    <AvatarFallback>
                        {user.given_name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" sideOffset={12} className="w-[220px]">
                <DropdownMenuLabel className="font-normal flex items-center gap-2 px-1 py-1.5 text-sm">
                    <Avatar className="relative size-8 rounded-sm">
                    <AvatarImage src={getAvatar(user.picture, user.email!)} alt="User Image" className="object-cover" />
                    <AvatarFallback>
                        {user.given_name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <p className="truncate font-medium">
                            {user.given_name}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">{ user.email }</p>
                    </div> 
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <PortalLink>
                            <User />
                            Profile
                        </PortalLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <PortalLink>
                            <CreditCard />
                            Subscription
                        </PortalLink>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <LogoutLink>
                            <LogOut />
                            Logout
                        </LogoutLink>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
        </DropdownMenuContent>
    </DropdownMenu>
    )
}