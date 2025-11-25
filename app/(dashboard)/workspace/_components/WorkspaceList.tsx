"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useSuspenseQuery } from "@tanstack/react-query";


// Dummy Data
// const workspaces = [
//     {
//         id: "1",
//         name: "Engineering",
//         avatar: "Er",
//     },
//     {
//         id: "2",
//         name: "Human Resource",
//         avatar: "Hr",
//     },
//     {
//         id: "3",
//         name: "Sales",
//         avatar: "Sa",
//     },
// ];

const colorCombination = [
    "bg-blue-500 hover:bg-blue-600 text-white",
    "bg-emerald-500 hover:bg-emerald-600 text-white",
    "bg-purple-500 hover:bg-purple-600 text-white",
    "bg-amber-500 hover:bg-amber-600 text-white",
    "bg-rose-500 hover:bg-rose-600 text-white",
    "bg-indigo-500 hover:bg-indigo-600 text-white",
    "bg-cyan-500 hover:bg-cyan-600 text-white",
    "bg-pink-500 hover:bg-pink-600 text-white",
];

// Function to get same color everyTime for same organisation Id we pass as params, no randoms.
const getWorkspaceColor = (id: String) => {
    // splitting the id ex id=123 so plit give ["1", "2", "3"]
    const charSum = id.split("")
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    // reduce give sum of all elemets in that array, sum=callback, char = initial value which is 0, .charCodeAT give numerical value so this functions return addition of all.
    
    // charSum % colorsLength so we stay in that array, it baciscally give the index of color based on sum of the ID we got.
    const colorIndex = charSum % colorCombination.length

    // returning that color.
    return colorCombination[colorIndex]
}

export function WorkspaceList() {

    const { data : {workspaces, currentWorkspace }} = useSuspenseQuery(orpc.workspace.list.queryOptions());

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-2">
                {workspaces.map((ws) => {
                    const isActive = currentWorkspace.orgCode === ws.id;
                    return (
                        <Tooltip key={ws.id}>
                        <TooltipTrigger asChild>
                                <LoginLink orgCode={ws.id}>
                                    <Button size="icon" className={cn("size-12 transition-all duration-200", getWorkspaceColor(ws.id), isActive ? 'rounded-lg' : 'rounded-xl hover:rounded-lg'
                                )}>
                                <span className="text-sm font-semibold">{ws.avatar}</span>
                            </Button>
                                </LoginLink>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                                <p>{ws.name} {isActive && "(Current)" }</p>
                        </TooltipContent>
                    </Tooltip>
                    )
                })}
            </div>
        </TooltipProvider>
    )
}