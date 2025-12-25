import Logo from "@/public/logo.png";
import Link from 'next/link'
import Image from "next/image";


export default function FooterSection() {
    return (
        <footer className="py-10 md:py-32">
            <div className="mx-auto max-w-5xl px-6">

                <Link
                    href="/"
                    aria-label="go home"
                    className="mx-auto size-fit flex items-center space-x-2">
                    <Image src={Logo} alt="Logo" width={32} height={32} />
                    <h1 className="text-2xl font-bold">
                        <span className="text-primary">Murmur📟</span>
                    </h1>
                </Link>


                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    <div>
                        Forged by ⚒ <span className="font-medium text-muted-foreground">Muhammad Mahad</span>
                    </div>
                </div>

                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    <Link
                        href="mailto:muhammadmahad6@gmail.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Email"
                        className="text-muted-foreground hover:text-primary block">
                        <svg
                            className="size-6"
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4l-8 5l-8-5V6l8 5l8-5z"></path>
                        </svg>
                    </Link>
                    <Link
                        href="https://github.com/Mahadsid"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Github"
                        className="text-muted-foreground hover:text-primary block">
                        <svg
                            className="size-6"
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5c0-.24-.01-.86-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85c0 1.34-.01 2.42-.01 2.75c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"></path>
                        </svg>
                    </Link>

                </div>
                <span className="text-muted-foreground block text-center text-sm"> © {new Date().getFullYear()} Murmur, All rights reserved</span>
            </div>
        </footer>
    )
}
