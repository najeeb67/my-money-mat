import { useState } from 'react';
import { Download, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface InstallPWAProps {
    className?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    showLabel?: boolean;
}

export function InstallPWA({ className, variant = 'default', showLabel = true }: InstallPWAProps) {
    const { isInstallable, isIOS, isStandalone, promptInstall } = useInstallPrompt();
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    // Don't show if already installed
    if (isStandalone) return null;

    // Don't show if neither android installable nor iOS
    if (!isInstallable && !isIOS) return null;

    const handleClick = () => {
        if (isIOS) {
            setShowIOSInstructions(true);
        } else {
            promptInstall();
        }
    };

    return (
        <>
            <Button
                variant={variant}
                onClick={handleClick}
                className={cn("gap-2", className)}
            >
                <Download className="h-4 w-4" />
                {showLabel && <span>Install App</span>}
            </Button>

            <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Install for iOS</DialogTitle>
                        <DialogDescription>
                            To install this app on your iPhone or iPad:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 mt-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary rounded-md">
                                <Share className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Step 1</p>
                                <p className="text-sm text-muted-foreground">Tap the <strong>Share icon</strong> in the Safari navigation bar at the bottom of your screen.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary rounded-md">
                                <PlusSquare className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Step 2</p>
                                <p className="text-sm text-muted-foreground">Scroll down the menu and select <strong>Add to Home Screen</strong>.</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
