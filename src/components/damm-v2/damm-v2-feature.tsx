// src/components/damm-v2/damm-v2-feature.tsx
'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AppHero } from '@/components/app-hero';
import { TokenCard, TokenData } from './damm-v2-token-card';
import { NewTokenPopup } from './damm-v2-new-token-popup';

export default function DammV2Feature() {
  const [tokens, setTokens] = useState<Record<string, TokenData>>({});
  const [newToken, setNewToken] = useState<TokenData | null>(null);
  const [isPopupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const socket = io('wss://comet.lyt.wtf/ws');

    socket.on('connect', () => {
      console.log('connected to websocket');
    });

    socket.on('message', (data: TokenData) => {
      setTokens((prevTokens) => ({
        ...prevTokens,
        [data.mint]: data,
      }));

      if (data.is_new_entry) {
        setNewToken(data);
        setPopupOpen(true);
      }
    });

    socket.on('disconnect', () => {
      console.log('disconnected from websocket');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen">
      <AppHero
        title="Alpha call Damm v2"
        subtitle="Next-generation Dynamic Automated Market Making strategies"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {Object.values(tokens).map((token) => (
          <TokenCard key={token.mint} token={token} />
        ))}
      </div>
      <NewTokenPopup
        token={newToken}
        open={isPopupOpen}
        onOpenChange={setPopupOpen}
      />
    </div>
  );
}