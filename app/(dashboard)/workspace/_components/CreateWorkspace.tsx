"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { Plus } from "lucide-react";
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { workspaceSchema, WorkspaceSchemaType } from "@/app/schemas/workspace";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { isDefinedError } from "@orpc/client";


export function CreateworkSpace() {
    // Since Dialog state can be managed by shadcnUI or by ourself, here we manage it ouself so we create a state, plus to work it on Dialog pass open, and onopenChange Tag
    const [open, setOpen] = useState(false);

    // TO revalidate the data after mutuation/ creation or after calling a method (POST, PUT).
    const queryClient = useQueryClient();

// 1. Define your form,,,, form from shadcnUI: https://ui.shadcn.com/docs/components/form
    const form = useForm({
        resolver: zodResolver(workspaceSchema),
        defaultValues: {
            name: ""
        }
    })
    
    //Setting up mutation(calling kinde, or POST-ing) for creatring an organization-logic we writt on router/workspace.ts
    const createworkSpaceMutation = useMutation(
        orpc.workspace.create.mutationOptions({
            // Here we can listen to events of mutation
            onSuccess: (newWorkspace) => {
                toast.success(`Workspace ${newWorkspace.workspaceName} created successfully.`);

                // After toast we want to revalidate the data meaning when new workspace is created we want to fetch again and show it in sidebar.
                queryClient.invalidateQueries({
                    queryKey: orpc.workspace.list.queryKey(),
                });
                // step 2: rest the form, close dialog
                form.reset();
                setOpen(false);
            },
            onError: (error) => {
                if (isDefinedError(error)) {
                    if (error.code === "RATE_LIMITED") {
                        toast.error(error.message);
                        return;
                    }
                    toast.error(error.message);
                    return;
                }
               toast.error("Failed to create workspace, try again!") 
            }
        })
    )

  // 2. Define a submit handler.
  function onSubmit(values: WorkspaceSchemaType) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
      // console.log("values")
      createworkSpaceMutation.mutate(values);
  }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-12 rounded-xl border-2 border-solid border-muted-foreground/50 text-muted-foreground hover:border-muted-foreground hover:text-foreground hover:rounded-lg transition-all duration-200">
                            <Plus className="size-5"/>
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>
                        Create Workspace
                    </p>
                </TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        Create Workspace
                    </DialogTitle>
                    <DialogDescription>
                        Create a new workspace to get started
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                    
                        <FormField control={form.control} name="name" render={({field}) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Add name for workspace" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button disabled={createworkSpaceMutation.isPending} type="submit">
                            {createworkSpaceMutation.isPending ? 'Creating...' : 'Create Workspace'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}