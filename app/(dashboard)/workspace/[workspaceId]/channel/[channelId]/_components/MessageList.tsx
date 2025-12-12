"use client"
import { useInfiniteQuery } from "@tanstack/react-query"
import { MessageItem } from "./message/MessageItem"
import { orpc } from "@/lib/orpc"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"

// const messageDemo = [
//     {
//         id: 1,
//         message: "hellow",
//         date: new Date(),
//         avatar: "https://avatars.githubusercontent.com/u/65539715?v=4",
//         userName: "Mahad sid"
//     },
// ]

export function MessageList() {

    const { channelId } = useParams<{ channelId: string }>();
    // State to take care reverse scroll on page load to check if user already scrolled or not.
    const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const [newMessages, setNewMessages] = useState(false);
    const lastItemIdRef = useRef<string | undefined>(undefined);
    
    // getting data on client side (UPDATE : SEE NEW CODE FOR INFINTE SCROLL/PAGINATION)
    // const { data } = useQuery(orpc.message.list.queryOptions({
    //     input: {
    //         channelId: channelId,
    //     }
    // }));

    // Infinite Scroll using Tanstack infinite scroll docs, also see router/messages for setting up the DB calls for pagination.
    //HELPER FUNCTION
    const infinteOptions = orpc.message.list.infiniteOptions({
        input: (pageParam: string | undefined) => ({
            channelId: channelId,
            cursor: pageParam,
            limit: 10,
        }),
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        // select is used for showing in reverse order,
        select: (data) => ({
            pages: [...data.pages].map((p) => ({...p, items: [...p.items].reverse()})).reverse(),
            pageParams: [...data.pageParams].reverse(),
        }),
    });

    // Actual Query function
    const {data, fetchNextPage, isFetchingNextPage, isLoading, error, hasNextPage, isFetching} = useInfiniteQuery({
        ...infinteOptions,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });

    // To implement when page load start at bottom, then scroll up, so to alter the standard behaviour of web browser.
    useEffect(() => {
        if (!hasInitialScrolled && data?.pages.length) {
            const el = scrollRef.current;
            if (el) {
                el.scrollTop = el.scrollHeight;
                setHasInitialScrolled(true);
                setIsAtBottom(true);
            }
        }
    }, [hasInitialScrolled, data?.pages.length]);

    const isNearBottom = (el: HTMLDivElement) => el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
    
    const handleScroll = () => {
        const el = scrollRef.current
        if (!el) return;

        if (el.scrollTop <= 80 && hasNextPage && !isFetching) {
            const prevScrollHeight = el.scrollHeight;
            const prevScrollTop = el.scrollTop;
            fetchNextPage().then(() => {
                const newScrollHeight = el.scrollHeight;
                el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
            });
        }
        setIsAtBottom(isNearBottom(el));
    };

    const items = useMemo(() => {
        return data?.pages.flatMap((p) => p.items) ?? []
    }, [data]);

    useEffect(() => {
        if (!items.length) return;
        const lastId = items[items.length - 1].id;
        const prevLastId = lastItemIdRef.current;
        const el = scrollRef.current;

        if (prevLastId && lastId !== prevLastId) {
            if (el && isNearBottom(el)) {
                requestAnimationFrame(() => {
                    el.scrollTop = el.scrollHeight;
                });
                setNewMessages(false);
                setIsAtBottom(true);
            } else {
                setNewMessages(true);
            }
        }
        lastItemIdRef.current = lastId;
    }, [items]);

    const scrollToBottom = () => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
        setNewMessages(false);
        setIsAtBottom(true);
    }

    return (
        <div className="relative h-full">
            <div className="h-full overflow-y-auto px-4 flex flex-col space-y-1" ref={scrollRef} onScroll={handleScroll}>
                {items?.map((message) => (
                    <MessageItem key={message.id} message={message} />
                ))}
                <div ref={bottomRef}></div>
            </div>
            {newMessages && !isAtBottom ? <Button type="button" className="absolute bottom-4 right-8 rounded-full" onClick={scrollToBottom}>New Messages <ArrowDown className="size-4 mr-1"/></Button> : null}
        </div>
    )
}