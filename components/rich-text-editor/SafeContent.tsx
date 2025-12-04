import { convertJsonToHtml } from "@/lib/json-to-html";
import { type JSONContent } from "@tiptap/react";
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';

{/* Since we store messages in database by stringyfy the JSON so when retreiving the message it shows like "tye:json""content: hiais" withis code But we want to deisplay message only, so we make a new component and inside that we covert string -> JSON -> HTML and take our content and render it. CHECKOUT MessageItem.tsx & lib/json-to-html.ts */ }


interface iAppProps{
    content: JSONContent;
    classname?: string;
}

export function SafeContent({content, classname}: iAppProps) {
    const html = convertJsonToHtml(content);
    // we get HTML but html is not safe, is unsecure. so XXS attack can happen, so we need to sanatize the HTML we get.Its not good to render images, scripts bcz they are prone to XXS attacks. so we use DOMPurify checkout here (https://github.com/cure53/DOMPurify) to fight against it.
    const clean = DOMPurify.sanitize(html);

    return (
        //using html-react-parser (https://www.npmjs.com/package/html-react-parser) it used to convert an HTML string to one or more React elemnts. it wonks on both server and client side.
        <div className={classname}>
            {parse(clean)}
        </div>
    )
}