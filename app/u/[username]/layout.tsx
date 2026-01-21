import type { Metadata } from "next";

type Props = {
    params: Promise<{ username: string }>;
    children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params;

    return {
        title: `@${username} on gh.world`,
        description: `View @${username}'s GitHub commit activity on gh.world - the real-time global commit visualization.`,
        openGraph: {
            title: `@${username} on gh.world`,
            description: `View @${username}'s GitHub commit activity on gh.world`,
            type: "profile",
            locale: "en_US",
            siteName: "gh.world",
        },
        twitter: {
            card: "summary_large_image",
            title: `@${username} on gh.world`,
            description: `View @${username}'s GitHub commit activity on gh.world`,
        },
    };
}

export default function ProfileLayout({ children }: Props) {
    return children;
}
