"use-client";

import { createMessageSchema, CreateMessageSchemaType } from "@/app/schemas/message"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { MessageComposer } from "./MessageComposer"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import {  useState } from "react";
import { useAttachmentUpload } from "@/hooks/use-attachment-upload";


interface iAppProps {
    channelId: string
}

export function MessageInputForm({ channelId }: iAppProps) {
    
    // TO revalidate again and render new message after creation we need to revalidate query
    const queryClient = useQueryClient();
    //for resetting form
    const [editorKey, setEditorKey] = useState(0);
    // attach file modal closing and opening state.
    const upload = useAttachmentUpload();

    const form = useForm({
        resolver: zodResolver(createMessageSchema),
        defaultValues: {
            channelId: channelId,
            content: "",
        },
    });

    const createMessageMutation = useMutation(
        orpc.message.create.mutationOptions({
            onSuccess: () => {
                // TO revalidate again and render new message after creation we need to revalidate query
                queryClient.invalidateQueries({
                    queryKey: orpc.message.list.key()
                })

                //resetting form ->just form.reset() cannot reset form bcz tiptap form have its internal state and form has also its internal state so we use useState and reset form
                form.reset({ channelId, content: "" });
                upload.clear(); //if user attach some image attachment then after sending that message attachmentchip preview should get cleared
                setEditorKey((k) => k + 1);
                return toast.success("message created successfully")
            },
            onError: () => {
                return toast.error("something went wrong");
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