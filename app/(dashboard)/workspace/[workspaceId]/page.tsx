import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { client } from "@/lib/orpc"
import { Cloud } from "lucide-react";
import { redirect } from "next/navigation";
import { CreateNewChannel } from "./_components/CreateNewChannel";


interface iAppProps {
  params:  Promise<{workspaceId: string}>
}

const  WorkspacePage = async ({params}: iAppProps) => {
  const { channels } = await client.channel.list();
  const { workspaceId } = await params;
  if (channels.length > 0) {
    return (redirect(`/workspace/${workspaceId}/channel/${channels[0].id}`));
  }
  return (
    <div className="p-16 flex flex-1">
      <Empty className="border border-dashed from-muted/50 to-background h-full bg-gradient-to-b from-30%">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Cloud />
        </EmptyMedia>
        <EmptyTitle>No Channels Found</EmptyTitle>
        <EmptyDescription>
          Get started and create a new channel!
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-xs mx-auto">
        <CreateNewChannel />
      </EmptyContent>
    </Empty>
    </div>
  );
}

export default WorkspacePage