
import { PresenceMessage, PresenceMessageSchema, User } from "@/app/schemas/realtime";
import usePartySocket from "partysocket/react";
import { useState } from "react";

interface usePresenceProps {
    //room is basically our workspaceID.
    room: string;
    currentUser: User | null;
}

export function usePresence({room, currentUser}: usePresenceProps) {
    const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

    const socket = usePartySocket({
        host: "https://murmur-realtime.muhammadmahad6.workers.dev",
        room: room,
        party: "chat",
        onOpen() {
            console.log("Connected to precense room:", room);

            // Register current user when connection opens
            if (currentUser) {
                const message: PresenceMessage = {
                    type: 'add-user',
                    payload: currentUser,
                };

                socket.send(JSON.stringify(message));
            }
        },
        onMessage(event) {
            try {
                const message = JSON.parse(event.data);
                const result = PresenceMessageSchema.safeParse(message);
                if (result.success && result.data.type === 'presence') {
                    setOnlineUsers(result.data.payload.users);
                }
            } catch (error) {
                console.log("Failed to parse message", error)
            }
        },
        onClose() {
            console.log("Disconnected from presence room", room);
        },
        onError(error) {
            console.log('Websocker Error', error)
        },
    });
    return {
        onlineUsers,
        socket,
    }
}