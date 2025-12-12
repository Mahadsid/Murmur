"use client";

import { useCallback, useMemo, useState } from "react";
import { string } from "zod";

// STATE for handling opening and closing of modal for attach file from rich-text-editor, doing it in seperate file rather in MessageComposer.tsx  keeps code clean and maintainable!
//checkout this in action in MessageInputForm.tsx
export function useAttachmentUpload() {
    const [isOpen, setOpen] = useState(false);
    const [stagedUrl, setstagedUrl] = useState<null | string>(null);
    const [isUploading, setUploading] = useState(false);


    //what to do after file is uploaded and we get url, check ImageModalUpload.ts 
    const onUploaded = useCallback((url : string) => {
        setstagedUrl(url);
        setUploading(false); // bcz everything uploaded successfully/
        setOpen(false); // so clise the modal;
    }, []);

    //for deleting the uploaded file from attachementchip view.
    const clear = useCallback(() => {
        setstagedUrl(null); //bcz we delete and have no url
        setUploading(false);
    }, []);

    //return using useMemo bcz it hepls with performance bcz it caches and dont renders every time so performance inc.
    return useMemo(() => ({
        isOpen,
        setOpen,
        onUploaded,
        stagedUrl,
        isUploading,
        clear,
    }), [isOpen, setOpen, onUploaded, stagedUrl, isUploading, clear]);
}
export type useAttachmentUploadType = ReturnType<typeof useAttachmentUpload>;