// src/components/damm-v2/damm-v2-token-card.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface TokenData {
  mint: string;
  delta_other: number;
  delta_jup: number;
  total: number;
  total_jupiter: number;
  jupiter_pct: number;
  is_new_entry: boolean;
  timestamp: number;
}

interface TokenCardProps {
  token: TokenData;
}

export function TokenCard({ token }: TokenCardProps) {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  return (
    <Card className="bg-[#2a2a3e] border-0 text-white">
      <CardHeader className="flex flex-row items-center">
        <div className="w-12 h-12 bg-gray-500 rounded-full mr-4" />
        <div className="flex-1">
          <CardTitle className="text-lg font-bold truncate">{token.mint}</CardTitle>
          <div className="flex items-center text-xs text-gray-400">
            <span>-</span>
            <span className="mx-2">|</span>
            <span>CA</span>
            <span className="mx-2">|</span>
            <span>-</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-green-400">-</div>
          <div className="text-sm">-</div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Market Cap</div>
          <div>-</div>
        </div>
        <div>
          <div className="text-gray-400">Liquidity</div>
          <div>-</div>
        </div>
        <div>
          <div className="text-gray-400">5m Vol</div>
          <div>-</div>
        </div>
        <div>
          <div className="text-gray-400">Net Buy/Sell</div>
          <div className="text-green-400">-</div>
        </div>
        <div>
          <div className="text-gray-400">Total Jupiter Txs</div>
          <div>{token.total_jupiter}</div>
        </div>
        <div>
          <div className="text-gray-400">Total Other Txs</div>
          <div>{token.total}</div>
        </div>
        <div>
          <div className="text-gray-400">Delta Jupiter Txs</div>
          <div>{token.delta_jup}</div>
        </div>
        <div>
          <div className="text-gray-400">Delta Other Txs</div>
          <div>{token.delta_other}</div>
        </div>
        <div>
          <div className="text-gray-400">Jupiter Pct</div>
          <div>{token.jupiter_pct.toFixed(2)}%</div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button className="flex-1 bg-[#4a4a6e] hover:bg-[#5a5a7e]">GMGN</Button>
          <Button className="flex-1 bg-[#4a4a6e] hover:bg-[#5a5a7e]">Axiom</Button>
          <Button className="flex-1 bg-[#4a4a6e] hover:bg-[#5a5a7e]">Cleopatra</Button>
        </div>
        <Button className="w-full bg-[#4a4a6e] hover:bg-[#5a5a7e]">Check DAMM V2 Pools</Button>
      </CardFooter>
    </Card>
  );
}
