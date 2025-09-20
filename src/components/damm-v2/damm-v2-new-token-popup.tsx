// src/components/damm-v2/damm-v2-new-token-popup.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TokenData, TokenCard } from './damm-v2-token-card';

interface NewTokenPopupProps {
  token: TokenData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTokenPopup({ token, open, onOpenChange }: NewTokenPopupProps) {
  if (!token) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2a2a3e] border-0 text-white">
        <DialogHeader>
          <DialogTitle>Top Token Changed! 😈</DialogTitle>
        </DialogHeader>
        <TokenCard token={token} />
      </DialogContent>
    </Dialog>
  );
}
