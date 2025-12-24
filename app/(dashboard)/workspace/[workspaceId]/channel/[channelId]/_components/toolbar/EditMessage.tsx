import { updateMessageSchema, UpdateMessageSchemaType } from "@/app/schemas/message";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Message } from "@/lib/generated/prisma/client";
import { orpc } from "@/lib/orpc";
import { useChannelRealtime } from "@/providers/ChannelRealtimeProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

// Interface so that what message we are edting should display in Rich Text Editor.
interface EditMessageProps {
    message: Message;
    onCancel: () => void;
    onSave: () => void;
}


export function EditMessage({ message, onCancel, onSave }: EditMessageProps) {

    const queryClient = useQueryClient();

    const { send } = useChannelRealtime()

    const form = useForm({
        resolver: zodResolver(updateMessageSchema),
        defaultValues: {
            messageId: message.id,
            content: message.content,
        }
    })

    //connecting to backend route procedure in message.ts
    const updateMutation = useMutation(
        orpc.message.update.mutationOptions({
            onSuccess: (updated) => {
                type MessagePage = { items: Message[]; nextCursor?: string }
                type InfiniteMessages = InfiniteData<MessagePage>
                queryClient.setQueryData<InfiniteMessages>(
                    ["message.list", message.channelId],
                    (oldExsistingMsgs) => {
                        if (!oldExsistingMsgs) return oldExsistingMsgs;

                        const updatedMessage = updated.message;

                        const pages = oldExsistingMsgs.pages.map((page) => ({
                            ...page,
                            items: page.items.map((m) => m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m),
                        }));
                        return {
                            ...oldExsistingMsgs,
                            pages,
                        }
                    }
                );
                toast.success('Message updated successfully');

                send({
                    type: "message:updated",
                    payload: { message: updated.message }
                });
                onSave();
            },
            onError: (error) => {
                toast.error(error.message);
            }
        })
    )

    //connecting to backend route procedure in message.ts
    function onSubmit(data: UpdateMessageSchemaType) {
        updateMutation.mutate(data);
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
                                <RichTextEditor
                                    field={field}
                                    sendButton={
                                        <div className="flex items-center gap-4">
                                            <Button onClick={onCancel}
                                                disabled={updateMutation.isPending} type="button" size="sm" variant="outline"  >Cancel</Button>
                                            <Button disabled={updateMutation.isPending} type="submit" size="sm">{updateMutation.isPending ? "Saving..." : "Save"}</Button>
                                        </div>
                                    }
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