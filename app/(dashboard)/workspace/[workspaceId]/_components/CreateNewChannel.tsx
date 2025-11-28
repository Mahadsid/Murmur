"use client";

import { ChannelNameSchema, ChannelSchemaNameType, transformChannelName } from "@/app/schemas/channel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { error } from "console";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function CreateNewChannel() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    // FORM : STEP.1 (after creating zod schema)
    const form = useForm({
        resolver: zodResolver(ChannelNameSchema),
        defaultValues: {
            name: "",
        }
    });

    // Conneting Backend (route/channe.ts creating channel API) here to our frontend
    const createChannelMutation = useMutation(
        orpc.channel.create.mutationOptions({
            onSuccess: (newChannel) => {
                toast.success(`Channel ${newChannel.name} created Successfully`);
                // Invalidates or revalidates the query and fetch again so it helps when we create a new channel but it dont renders immediately, so this revalidates the query when mutaion happen then again calls the DB and get fresh data and show all the channels which are creted.
                queryClient.invalidateQueries({
                    queryKey: orpc.channel.list.queryKey(),
                });

                form.reset();
                setOpen(false);
            },
            onError: (error) => {
                if (isDefinedError(error)) {
                    toast.error(error.message);
                    return;
                }
                toast.error('Failed to create channel, please try again later.')
            }
        })
    );
    function onSubmit(values: ChannelSchemaNameType) {
        createChannelMutation.mutate(values);
    }

    const watchedName = form.watch("name");
    const transformedName = watchedName ? transformChannelName(watchedName) : "";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild >
                <Button variant="outline" className="w-full">
                    <Plus className="size-4" />
                    New Channel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        Create Channel
                    </DialogTitle>
                    <DialogDescription>
                        Create new channel for you workspace.
                    </DialogDescription>
                </DialogHeader>
                {/* FORM with zod (schema called schemas/channel.ts ) and react hook form by shacdcn*/}
                <Form {...form}>
                    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder=" Enter Channel Name" {...field} />
                                    </FormControl>
                                    {transformedName && transformedName !== watchedName && (
                                        <p className="
                                        text-sm text-muted-foreground">Channel will be created as: <code className="bg-muted px-1 py-0.5 rounded text-xs">{transformedName}</code></p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button disabled={createChannelMutation.isPending} type="submit">
                            {createChannelMutation.isPending ? "Creating..." : "Create New Channel"}
                        </Button>
                    </form>
                </Form>

            </DialogContent>
        </Dialog>
    )
}