import { baseExtensions } from "@/components/rich-text-editor/extensions";
import { generateHTML, JSONContent } from "@tiptap/react";

 

export function convertJsonToHtml(jsonContent: JSONContent): string {
    try {
        //  if content is string we parse it so it become json else if it is already json we return/store it as it is.
        const content = typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;
        // GenerateHTML is a predeifend fuction provide by tiptap to get html from json
         return generateHTML(content, baseExtensions);
     } catch  {
        console.log("Error converting json to html");
        return "";
     }
}