"use-client";

import { createMessageSchema, CreateMessageSchemaType } from "@/app/schemas/message"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { MessageComposer } from "./MessageComposer"
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { useState } from "react";
import { useAttachmentUpload } from "@/hooks/use-attachment-upload";
import { Message } from "@/lib/generated/prisma/client";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { getAvatar } from "@/lib/get-avatar";
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider";


interface iAppProps {
    channelId: string;
    user: KindeUser<Record<string, unknown>>;
}

type MessagePage = { items: Message[]; nextCursor?: string; }
type InfiniteMessages = InfiniteData<MessagePage>;

export function MessageInputForm({ channelId, user }: iAppProps) {

    // TO revalidate again and render new message after creation we need to revalidate query
    const queryClient = useQueryClient();
    //for resetting form
    const [editorKey, setEditorKey] = useState(0);
    // attach file modal closing and opening state.
    const upload = useAttachmentUpload();
    const { send } = useChannelRealtime();

    const form = useForm({
        resolver: zodResolver(createMessageSchema),
        defaultValues: {
            channelId: channelId,
            content: "",
        },
    });

    const createMessageMutation = useMutation(
        orpc.message.create.mutationOptions({
            //https://tanstack.com/query/v4/docs/framework/react/guides/optimistic-updates FOR otimistic updates to make system faster, bcz optimistic updates say we are otimist that everything work, so this make experience fast chek more on link.
            onMutate: async (data) => {
                await queryClient.cancelQueries({
                    queryKey: ["message.list", channelId],
                });
                const previousData = queryClient.getQueryData<InfiniteMessages>(
                    ["message.list", channelId],
                );

                const tempId = `optimistic-${crypto.randomUUID()}`;
                const optimisticMessage: Message = {
                    id: tempId,
                    content: data.content,
                    imageUrl: data.imageUrl ?? null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    authorId: user.id,
                    authorEmail: user.email!,
                    authorName: user.given_name ?? "Anonymous User",
                    authorAvatar: getAvatar(user.picture, user.email!),
                    channelId: channelId,
                    threadId: null,
                };
                queryClient.setQueryData<InfiniteMessages>(
                    ["message.list", channelId], (oldExistingData) => {
                        if (!oldExistingData) {
                            return {
                                pages: [
                                    {
                                        items: [optimisticMessage],
                                        nextCursor: undefined,
                                    },
                                ],
                                pageParams: [undefined],
                            } satisfies InfiniteMessages
                        }
                        const firstPage = oldExistingData.pages[0] ?? {
                            items: [],
                            nextCursor: undefined,
                        };

                        const updatedFirstPage: MessagePage = {
                            ...firstPage,
                            items: [optimisticMessage, ...firstPage.items],
                        };
                        return {
                            ...oldExistingData,
                            pages: [updatedFirstPage, ...oldExistingData.pages.slice(1)],
                        }
                    }
                );

                return {
                    previousData,
                    tempId,
                }
            },

            onSuccess: (data, _varibalies, context) => {
                //UPDATED CHECK BELOW CODE
                // TO revalidate again and render new message after creation we need to revalidate query
                // queryClient.invalidateQueries({
                //     queryKey: orpc.message.list.key()
                // })

                // //resetting form ->just form.reset() cannot reset form bcz tiptap form have its internal state and form has also its internal state so we use useState and reset form
                // form.reset({ channelId, content: "" });
                // upload.clear(); //if user attach some image attachment then after sending that message attachmentchip preview should get cleared
                // setEditorKey((k) => k + 1);

                //UPDATED: SINCE UPTIMISTIC UPDATE IS USED FOR IMPROVING PERFORMANCE,
                queryClient.setQueryData<InfiniteMessages>(["message.list", channelId], (oldExistingData) => {
                    if (!oldExistingData) {
                        return oldExistingData;
                    }
                    const updatedPages = oldExistingData.pages.map((page) => ({
                        ...page,
                        items: page.items.map((m) => m.id === context.tempId ? {
                            ...data,
                        } : m),
                    }));
                    return {
                        ...oldExistingData, pages: updatedPages
                    }
                });

                //AGAIN ATTACHING THSESE BCZ OF THEIR FUNCTIONALITY
                //resetting form ->just form.reset() cannot reset form bcz tiptap form have its internal state and form has also its internal state so we use useState and reset form
                form.reset({ channelId, content: "" });
                upload.clear(); //if user attach some image attachment then after sending that message attachmentchip preview should get cleared
                setEditorKey((k) => k + 1);

                send({ type: "message:created", payload: { message: data } });

                return toast.success("Message created successfully")
            },

            onError: (_err, _varibalies, context) => {
                //return toast.error("something went wrong");
                //UPDATED CODE WITH OPTMISTIC UPDATE, SO IF ERROR HAPPENS WE ROLLBACK
                if (context?.previousData) {
                    queryClient.setQueryData(
                        ["message.list", channelId],
                        context.previousData
                    );
                };

                return toast.error("Something went wrong");
            }
        })
    )

    function onSubmit(data: CreateMessageSchemaType) {
        createMessageMutation.mutate({
            ...data,
            imageUrl: upload.stagedUrl ?? undefined,
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <MessageComposer key={editorKey} value={field.value} onChange={field.onChange} onSubmit={() => onSubmit(form.getValues())} isSubmitting={createMessageMutation.isPending}
                                    upload={upload}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}