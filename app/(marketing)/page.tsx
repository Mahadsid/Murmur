import { HeroHeader } from "@/app/(marketing)/_components/header";
import HeroSection from "@/app/(marketing)/_components/hero-section";
import FooterSection from "@/components/footer";

export default function Home() {
    return (
        <>
            <div>
                <HeroHeader />
                <HeroSection />
                <FooterSection />
            </div>
        </>
    )
}