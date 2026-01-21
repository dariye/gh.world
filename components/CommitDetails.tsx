import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ExternalLink, GitCommit, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Commit {
    _id: string;
    author: string;
    message: string;
    repo: string;
    timestamp: number;
    authorUrl: string;
    language?: string | null;
}

interface CommitDetailsProps {
    commit: Commit | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function CommitDetails({ commit, isOpen, onClose }: CommitDetailsProps) {
    if (!commit) return null;

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="bg-[#000510] border-white/10 text-white max-h-[80vh]">
                <DrawerHeader>
                    <div className="flex items-center gap-2 text-white/60 text-xs font-mono mb-2">
                        <GitCommit className="w-3 h-3" />
                        <span>{commit.repo}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(commit.timestamp, { addSuffix: true })}</span>
                    </div>
                    <DrawerTitle className="text-xl font-bold leading-tight mb-4 text-left">
                        {commit.message}
                    </DrawerTitle>
                    <DrawerDescription className="flex items-center gap-2 text-white/80">
                        <User className="w-4 h-4" />
                        <span className="font-semibold">{commit.author}</span>
                        {commit.language && (
                            <>
                                <span className="w-1 h-1 bg-white/40 rounded-full" />
                                <span className="text-blue-400">{commit.language}</span>
                            </>
                        )}
                    </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.open(commit.authorUrl, "_blank")}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on GitHub
                    </Button>
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10">
                            Close
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
