import { Button } from "@/components/ui/button";
import { ChevronDown, MessageSquare, X } from "lucide-react";
import Image from "next/image";
import { ThreadReply } from "./ThreadReply";
import { ThreadReplyForm } from "./ThreadReplyForm";
import { useThread } from "@/providers/ThreadProvider";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { SafeContent } from "@/components/rich-text-editor/SafeContent";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { ThreadSidebarSkeleton } from "./ThreadSidebarSkeleton";
import { useEffect, useRef, useState } from "react";

// const messagesDEMO = [
//     {
//         id: 1,
//         authorName: "Mahad",
//         authorImage: "https://avatars.githubusercontent.com/u/65539715?v=4",
//         content: "HIIII!",
//         createdAt: new Date(),
//     },
//     {
//         id: 2,
//         authorName: "sid",
//         authorImage: "https://avatars.githubusercontent.com/u/65539715?v=4",
//         content: "HOW ARE YA!",
//         createdAt: new Date(),
//     },
//     {
//         id: 3,
//         authorName: "John",
//         authorImage: "https://avatars.githubusercontent.com/u/65539715?v=4",
//         content: "I am fine.",
//         createdAt: new Date(),
//     },
//     {
//         id: 4,
//         authorName: "Doe",
//         authorImage: "https://avatars.githubusercontent.com/u/65539715?v=4",
//         content: "OKH",
//         createdAt: new Date(),
//     },
// ]

interface ThreadSidebarProps {
    user: KindeUser<Record<string, unknown>>;
}

export function ThreadSidebar({ user }: ThreadSidebarProps) {
    const { selectedThreadId, closeThread } = useThread();

    //To implement scroll down when new reply is posted in thread
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const lastMessageCountRef = useRef(0);


    const { data, isLoading } = useQuery(
        orpc.message.thread.list.queryOptions({
            input: {
                messageId: selectedThreadId!,
            },
            enabled: Boolean(selectedThreadId),
        })
    )

    //helper to use in if statement below
    const messageCount = data?.messages.length ?? 0;

    //To implement scroll down when new reply is posted in thread
    const isNearBottom = (el: HTMLDivElement) => el.scrollHeight - el.scrollTop - el.clientHeight <= 80;
    const handleScroll = () => {
        const el = scrollRef.current
        if (!el) return;

        setIsAtBottom(isNearBottom(el));
    };
    useEffect(() => {
        if (messageCount === 0) {
            return;
        }
        const prevMessageCount = lastMessageCountRef.current;
        const el = scrollRef.current;

        if (prevMessageCount > 0 && messageCount !== prevMessageCount) {
            if (el && isNearBottom(el)) {
                requestAnimationFrame(() => {
                    bottomRef.current?.scrollIntoView({
                        block: "end",
                        behavior: "smooth",
                    });
                });

                setIsAtBottom(true);
            }
        }
        lastMessageCountRef.current = messageCount;
    }, [messageCount])

    //keep view pinned to bottom on late content growth ex new messages with images.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) {
            return;
        }
        const scrollToBottomIfNeeded = () => {
            if (isAtBottom) {
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
    }, [isAtBottom]);

    const scrollToBottom = () => {
        const el = scrollRef.current;
        if (!el) return;
        bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
        setIsAtBottom(true);
    }



    if (isLoading) {
        return <ThreadSidebarSkeleton />
    }

    return (
        <div className="w-[30rem] border-l flex flex-col h-full">
            {/* Header */}
            <div className="border-b h-14 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="size-4" />
                    <span>Thread</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={closeThread}>
                        <X className="size-4" />
                    </Button>
                </div>
            </div>
            {/*  Main content */}
            <div className="flex-1 overflow-y-auto relative">
                <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto">
                    {data && (
                        <>
                            <div className="p-4 border-b bg-muted/20">
                                <div className="flex space-x-3">
                                    <Image src={data.parent.authorAvatar} alt="user Image" width={32} height={32} className="size-8 rounded-full shrink-0" />
                                    {/*  author name & content*/}
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-sm">
                                                {data.parent.authorName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Intl.DateTimeFormat('en-US', {
                                                    hour: "numeric",
                                                    minute: "numeric",
                                                    hour12: true,
                                                    month: "short",
                                                    day: "numeric",
                                                }).format(data.parent.createdAt)}
                                            </span>
                                        </div>
                                        {/* <p className="text-sm break-words prose dark:prose-invert">{messages[0].content}</p> SINCE FOR CONTENT WE STORE IT IN JSON AND NEED TO PARSE IT SO WE USE OUR SAFE-CONTENT FILE. */}
                                        <SafeContent content={JSON.parse(data.parent.content)} classname="text-sm break-words prose dark:prose-invert marker:text-primary" />
                                    </div>
                                </div>
                            </div>

                            {/* Thread Replies */}
                            <div className="p-2">
                                <p className="text-xs text-muted-foreground mb-3 px-2">
                                    {data.messages.length} replies
                                </p>
                                <div className="space-y-1">
                                    {data.messages.map((reply) => (
                                        <ThreadReply key={reply.id} message={reply} selectedThreadId={selectedThreadId!} />
                                    ))}
                                </div>

                            </div>
                            <div ref={bottomRef}></div>
                        </>
                    )}
                </div>
                {/* Arrow Down icon button to scroll at bottom */}
                {!isAtBottom && (
                    <Button type="button" size="sm" className="absolute bottom-4 right-5 z-20 size-10 rounded-full hover:shadow-xl transition-all duration-200" onClick={scrollToBottom}>
                        <ChevronDown className="size-4" />
                    </Button>
                )}
            </div>
            {/* Thread reply form */}
            <div className="border-t p-4">
                <ThreadReplyForm threadId={selectedThreadId!} user={user} />
            </div>
        </div>
    )
}