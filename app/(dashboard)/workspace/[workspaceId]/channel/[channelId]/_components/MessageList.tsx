import { MessageItem } from "./message/MessageItem"

const messageDemo = [
    {
        id: 1,
        message: "hellow",
        date: new Date(),
        avatar: "https://avatars.githubusercontent.com/u/65539715?v=4",
        userName: "Mahad sid"
    },
]

export function MessageList() {
    return (
        <div className="relative h-full">
            <div className="h-full overflow-y-auto px-4">
                {messageDemo.map((message) => (
                    <MessageItem key={message.id} {...message} />
                ))}
            </div>
        </div>
    )
}