"use-client";

import { createMessageSchema, CreateMessageSchemaType } from "@/app/schemas/message"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { MessageComposer } from "./MessageComposer"
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";


interface iAppProps {
    channelId: string
}

export function MessageInputForm({channelId}:iAppProps) {

    const form = useForm({
        resolver: zodResolver(createMessageSchema),
        defaultValues: {
            channeId: channelId,
            content: "",
        },
    });

    const createMessageMutation = useMutation(
        orpc.message.create.mutationOptions({
            onSuccess: () => {
                return toast.success("message created successfully")
            },
            onError: () => {
                return toast.error("something went wrong");
            }
        })
    )

    function onSubmit(data: CreateMessageSchemaType) {
        createMessageMutation.mutate(data);
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
                                <MessageComposer value={field.value} onChange={field.onChange} onSubmit={() => onSubmit(form.getValues())} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}