"use client"
import { inviteMemberSchema, InviteMemberSchemaType } from "@/app/schemas/member";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";


export default function InviteMember() {
    const [open, setOpen] = useState(false);

    //for the form below 
    const form = useForm({
        resolver: zodResolver(inviteMemberSchema),
        defaultValues: {
            email: "",
            name: "",
        },
    });

    //for creating user calling backend route create in member.ts using useMutation
    const inviteMutation = useMutation(
        orpc.workspace.member.invite.mutationOptions({
            onSuccess: () => {
                toast.success("Member added successfully");
                form.reset();
                setOpen(false);
            },
            onError: (error) => {
                toast.error(error.message);
            },
        })
    );

    function onSubmit(values: InviteMemberSchemaType) {
        //console.log(values);
        inviteMutation.mutate(values);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen} >
            <DialogTrigger asChild>
                <Button variant="outline">
                    <UserPlus />
                    Add Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Member</DialogTitle>
                    <DialogDescription>
                        Add your members to  your awesome workspace
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Onboard Member</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}