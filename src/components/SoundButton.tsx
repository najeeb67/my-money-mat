import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface SoundButtonProps extends ButtonProps {
  soundType?: 'click' | 'success' | 'pop';
}

const SoundButton = React.forwardRef<HTMLButtonElement, SoundButtonProps>(
  ({ onClick, soundType = 'click', ...props }, ref) => {
    const { playClick, playSuccess, playPop } = useSoundEffects();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      switch (soundType) {
        case 'success':
          playSuccess();
          break;
        case 'pop':
          playPop();
          break;
        default:
          playClick();
      }
      onClick?.(e);
    };

    return <Button ref={ref} onClick={handleClick} {...props} />;
  }
);

SoundButton.displayName = "SoundButton";

export { SoundButton };
