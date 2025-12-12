//Component for when the image is uploaded using attach button in rich-text-editor to display a little preview in place of attach button.
//user can upload one file at a time so we can previe that little chip in place of button.

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";


interface AttachmentChipProps{
    url: string;
    onRemove: () => void;
}
export function AttachmentChip({url, onRemove}: AttachmentChipProps) { 
    return (
        <div className="group relative overflow-hidden rounded-md bg-muted size-12">
            <Image className="object-cover" src={url} alt="Attachment" fill />
            <div className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                <Button onClick={onRemove} type="button" variant="destructive" className="size-6 p-0 rounded-full">
                    <X className="size-3"/>
                </Button>
            </div>
         </div>
     )
}