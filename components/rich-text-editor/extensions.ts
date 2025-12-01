import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import CodeBlock from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import { Placeholder } from '@tiptap/extensions'

const lowlight = createLowlight(all);

export const baseExtensions = [
    StarterKit.configure({
        codeBlock: false,
    }),
    TextAlign.configure({
        types: ["heading", "paragraph"],
    }),
    CodeBlock.configure({
        lowlight,
    }),

];

export const editorExtensions = [...baseExtensions, Placeholder.configure({
    placeholder: 'Type your message'
})];