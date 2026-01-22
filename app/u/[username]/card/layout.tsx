import type { Metadata } from "next";

type Props = {
    params: Promise<{ username: string }>;
    children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params;

    const ogImageUrl = `/api/og/card?username=${encodeURIComponent(username)}`;

    return {
        title: `@${username}'s Developer Card - gh.world`,
        description: `View and share @${username}'s GitHub developer profile card on gh.world - track commits, languages, and global ranking.`,
        openGraph: {
            title: `@${username}'s Developer Card`,
            description: `View @${username}'s GitHub commit activity and global ranking on gh.world`,
            type: "profile",
            locale: "en_US",
            siteName: "gh.world",
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `@${username}'s gh.world developer card`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `@${username}'s Developer Card`,
            description: `View @${username}'s GitHub commit activity and global ranking on gh.world`,
            images: [ogImageUrl],
        },
    };
}

export default function CardLayout({ children }: Props) {
    return children;
}
