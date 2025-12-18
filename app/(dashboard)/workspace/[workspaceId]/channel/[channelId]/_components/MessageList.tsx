"use client"
import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query"
import { MessageItem } from "./message/MessageItem"
import { orpc } from "@/lib/orpc"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDown, Loader } from "lucide-react"
import { EmptyState } from "@/components/general/EmptyState"

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
        queryKey: ["message.list", channelId],
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        // select is used for showing in reverse order,
        select: (data) => ({
            pages: [...data.pages].map((p) => ({ ...p, items: [...p.items].reverse() })).reverse(),
            pageParams: [...data.pageParams].reverse(),
        }),
    });

    // Actual Query function
    const { data, fetchNextPage, isFetchingNextPage, isLoading, error, hasNextPage, isFetching } = useInfiniteQuery({
        ...infinteOptions,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });

    //to get user but more specific reason to get user is to fetch user id so we can sent it forward so that we can use it to match current-user-id in MessageItem.tsx (specifically for EditMessage.tsx) so that user can edit only its own messsages and not sombody else.
    const { data: { user } } = useSuspenseQuery(orpc.workspace.list.queryOptions());

    // To implement when page load start at bottom, then scroll up, so to alter the standard behaviour of web browser.
    useEffect(() => {
        if (!hasInitialScrolled && data?.pages.length) {
            const el = scrollRef.current;
            if (el) {
                //el.scrollTop = el.scrollHeight;
                bottomRef.current?.scrollIntoView({ block: "end" });
                setHasInitialScrolled(true);
                setIsAtBottom(true);
            }
        }
    }, [hasInitialScrolled, data?.pages.length]);

    //keep view pinned to bottom on late content growth ex new messages with images.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        const scrollToBottomIfNeeded = () => {
            if (isAtBottom || !hasInitialScrolled) {
                requestAnimationFrame(() => {
                    bottomRef.current?.scrollIntoView({ block: "end" });
                });
            }
        }
        const onImageLoad = (e: Event) => {
            if (e.target instanceof HTMLImageElement) {
                scrollToBottomIfNeeded();
            }
        };
        el.addEventListener("load", onImageLoad, true);

        // ResizeObserver watches for size changes in the container
        const resizeObserver = new ResizeObserver(() => {
            scrollToBottomIfNeeded();
        });
        resizeObserver.observe(el);

        //MutationObserver watches for DOM changes e.g images,loading, content, updates.
        const mutationObserver = new MutationObserver(() => {
            scrollToBottomIfNeeded();
        });
        mutationObserver.observe(el, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
        });

        //cleanup function to prevent memory leaks and prevent stale events
        return () => {
            resizeObserver.disconnect();
            el.removeEventListener('load', onImageLoad, true);
            mutationObserver.disconnect();
        };
    }, [isAtBottom, hasInitialScrolled]);

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

    //For checking if some channel dont have messages then we can use this and display empty state.
    const isEmpty = !isLoading && !error && items.length === 0;

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

                setIsAtBottom(true);
            }
        }
        lastItemIdRef.current = lastId;
    }, [items]);

    const scrollToBottom = () => {
        const el = scrollRef.current;
        if (!el) return;
        bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
        setIsAtBottom(true);
    }

    return (
        <div className="relative h-full">
            <div className="h-full overflow-y-auto px-4 flex flex-col space-y-1" ref={scrollRef} onScroll={handleScroll}>
                {
                    isEmpty ?
                        (<div className="flex h-full pt-4">
                            <EmptyState title="No messages yet🙄" description="Don't wait, send the first message and start the convo📟" buttonText="Send a message" href="#" />
                        </div>)
                        :
                        (items?.map((message) => (
                            <MessageItem key={message.id} message={message} currentUserId={user.id} />
                        )))
                }
                <div ref={bottomRef}></div>
            </div>

            {/* FOR DISPLAYING LIKE LOADER FOR FETCHING DATA WHEN SCROLL TOP */}
            {isFetchingNextPage && (
                <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 rounded-md bg-gradient-to-b from-white/80 to-transparent dark:from-neutral-900/80 backdrop-blur px-3 py-1">
                        <Loader className="size-4 animate-spin text-muted-foreground" />
                        <span>Loading...</span>
                    </div>
                </div>
            )}

            {!isAtBottom && (
                <Button type="button" size="sm" className="absolute bottom-4 right-5 z-20 size-10 rounded-full hover:shadow-xl transition-all duration-200" onClick={scrollToBottom}>
                    <ArrowDown className="size-4" />
                </Button>
            )}

            {/* {newMessages && !isAtBottom ? <Button type="button" className="absolute bottom-4 right-8 rounded-full" onClick={scrollToBottom}>New Messages <ArrowDown className="size-4 mr-1"/></Button> : null} */}
        </div>
    )
}