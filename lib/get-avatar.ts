// https://github.com/vercel/avatar Vervel avatar making api
export function getAvatar(userPicture: string | null, userEmail: string) {
    return userPicture ?? `https://avatar.vercel.sh/${userEmail}`
}