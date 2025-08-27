// src/components/account/account-ui.tsx - Mobile-optimized version
'use client'

// import { useWallet } from '@solana/wallet-adapter-react'
// import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'
// import { RefreshCw, Info, Eye, Copy, ExternalLink, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'
// import { useQueryClient } from '@tanstack/react-query'
// import { useMemo, useState } from 'react'

// import { useCluster } from '../cluster/cluster-data-access'
// import { ExplorerLink } from '../cluster/cluster-ui'
// import {
//   useGetBalance,
//   useGetSignatures,
//   useGetTokenAccounts,
//   useRequestAirdrop,
//   useTransferSol,
// } from './account-data-access'
// import { ellipsify } from '@/lib/utils'
// import { Button } from '@/components/ui/button'
// import { AppAlert } from '@/components/app-alert'
// import { AppModal } from '@/components/app-modal'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// Import the new LP Positions component
import { LPPositions } from './lp-positions-ui'

// export function AccountBalance({ address }: { address: PublicKey }) {
//   const query = useGetBalance({ address })
//   const [showDetails, setShowDetails] = useState(false)

//   return (
//     <div className="text-center space-y-4">
//       <div className="glass-effect rounded-2xl p-6 border border-border/20">
//         <div className="flex items-center justify-center gap-3 mb-2">
//           <h1 className="text-3xl md:text-4xl font-bold text-gradient cursor-pointer" onClick={() => query.refetch()}>
//             {query.data ? <BalanceSol balance={query.data} /> : '...'} SOL
//           </h1>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() => setShowDetails(!showDetails)}
//             className="text-muted-foreground hover:text-primary"
//           >
//             <Info className="w-4 h-4" />
//           </Button>
//         </div>
//         <p className="text-sm text-muted-foreground">Available Balance</p>

//         {showDetails && (
//           <div className="mt-4 pt-4 border-t border-border/30 text-left space-y-2">
//             <div className="flex justify-between text-sm">
//               <span className="text-muted-foreground">Address:</span>
//               <div className="flex items-center gap-2">
//                 <span className="font-mono text-xs">{ellipsify(address.toString())}</span>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => navigator.clipboard.writeText(address.toString())}
//                   className="h-6 w-6 p-0"
//                 >
//                   <Copy className="w-3 h-3" />
//                 </Button>
//               </div>
//             </div>
//             <div className="flex justify-between text-sm">
//               <span className="text-muted-foreground">Raw Balance:</span>
//               <span className="font-mono text-xs">{query.data || 0} lamports</span>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export function AccountChecker() {
//   const { publicKey } = useWallet()
//   if (!publicKey) {
//     return null
//   }
//   return <AccountBalanceCheck address={publicKey} />
// }

// export function AccountBalanceCheck({ address }: { address: PublicKey }) {
//   const { cluster } = useCluster()
//   const mutation = useRequestAirdrop({ address })
//   const query = useGetBalance({ address })

//   if (query.isLoading) {
//     return null
//   }
//   if (query.isError || !query.data) {
//     return (
//       <AppAlert
//         action={
//           <Button variant="outline" onClick={() => mutation.mutateAsync(1).catch((err) => console.log(err))}>
//             Request Airdrop
//           </Button>
//         }
//       >
//         You are connected to <strong>{cluster.name}</strong> but your account is not found on this cluster.
//       </AppAlert>
//     )
//   }
//   return null
// }

// export function AccountButtons({ address }: { address: PublicKey }) {
//   const { cluster } = useCluster()
//   return (
//     <div className="flex flex-wrap gap-3 justify-center">
//       {cluster.network?.includes('mainnet') ? null : <ModalAirdrop address={address} />}
//       <ModalSend address={address} /> 
//       <ModalReceive address={address} /> 
//     </div>
//   )
// }


// Updated AccountTokens component with mobile-optimized design
export function AccountTokens({ address }: { address: PublicKey }) {
  // const [showAll, setShowAll] = useState(false)
  // const [showDetails, setShowDetails] = useState<string | null>(null)
  // const query = useGetTokenAccounts({ address })
  // const client = useQueryClient()
  // const items = useMemo(() => {
  //   if (showAll) return query.data
  //   return query.data?.slice(0, 3)
  // }, [query.data, showAll])

  return (
    <div>
      {/* LP Positions Section - NEW */}
      <LPPositions address={address} />

      {/* Token Accounts Section - Mobile Optimized */}
      {/* <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Token Accounts</h2>
          </div>
          <div className="flex items-center gap-2">
            {query.isLoading ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await query.refetch()
                  await client.invalidateQueries({
                    queryKey: ['getTokenAccountBalance'],
                  })
                }}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {query.isError && (
          <div className="glass-effect rounded-xl p-4 border border-destructive/20 bg-destructive/5">
            <p className="text-sm text-destructive">Error: {query.error?.message.toString()}</p>
          </div>
        )}

        {query.isSuccess && (
          <div className="space-y-3">
            {query.data.length === 0 ? (
              <div className="glass-effect rounded-xl p-8 text-center border border-border/20">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No token accounts found</p>
              </div>
            ) : (
              <>
                {items?.map(({ account, pubkey }) => {
                  const isExpanded = showDetails === pubkey.toString()
                  return (
                    <div key={pubkey.toString()} className="glass-effect rounded-xl border border-border/20 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {account.data.parsed.info.tokenAmount.uiAmount?.toString().slice(0, 2) || '0'}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold">{account.data.parsed.info.tokenAmount.uiAmount || 0}</p>
                              <p className="text-xs text-muted-foreground">Token Balance</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(isExpanded ? null : pubkey.toString())}
                            className="h-8 w-8 p-0"
                          >
                            <Info className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className="pt-3 border-t border-border/30 space-y-3">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Account:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs">{ellipsify(pubkey.toString(), 6)}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigator.clipboard.writeText(pubkey.toString())}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => window.open(`https://explorer.solana.com/account/${pubkey.toString()}`, '_blank')}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Mint:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs">{ellipsify(account.data.parsed.info.mint, 6)}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigator.clipboard.writeText(account.data.parsed.info.mint)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => window.open(`https://explorer.solana.com/account/${account.data.parsed.info.mint.toString()}`, '_blank')}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {(query.data?.length ?? 0) > 3 && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowAll(!showAll)}
                      className="w-full glass-effect border-border/20"
                    >
                      {showAll ? 'Show Less' : `Show All (${query.data?.length || 0} tokens)`}
                      <Eye className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div> */}
    </div>
  )
}

// export function AccountTransactions({ address }: { address: PublicKey }) {
//   const query = useGetSignatures({ address })
//   const [showAll, setShowAll] = useState(false)
//   const [showDetails, setShowDetails] = useState<string | null>(null)

//   const items = useMemo(() => {
//     if (showAll) return query.data
//     return query.data?.slice(0, 3)
//   }, [query.data, showAll])

//   const formatDate = (timestamp: number) => {
//     const date = new Date(timestamp * 1000)
//     const now = new Date()
//     const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

//     if (diffInHours < 24) {
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//     } else if (diffInHours < 24 * 7) {
//       return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
//     } else {
//       return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
//     }
//   }

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <Clock className="w-5 h-5 text-primary" />
//           <h2 className="text-xl font-bold">Transaction History</h2>
//         </div>
//         <div className="flex items-center gap-2">
//           {query.isLoading ? (
//             <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
//           ) : (
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => query.refetch()}
//               className="h-8 w-8 p-0"
//             >
//               <RefreshCw className="w-4 h-4" />
//             </Button>
//           )}
//         </div>
//       </div>

//       {query.isError && (
//         <div className="glass-effect rounded-xl p-4 border border-destructive/20 bg-destructive/5">
//           <p className="text-sm text-destructive">Error: {query.error?.message.toString()}</p>
//         </div>
//       )}

//       {query.isSuccess && (
//         <div className="space-y-3">
//           {query.data.length === 0 ? (
//             <div className="glass-effect rounded-xl p-8 text-center border border-border/20">
//               <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
//                 <Clock className="w-6 h-6 text-muted-foreground" />
//               </div>
//               <p className="text-muted-foreground">No transactions found</p>
//             </div>
//           ) : (
//             <>
//               {items?.map((item) => {
//                 const isExpanded = showDetails === item.signature
//                 const isSuccess = !item.err
//                 return (
//                   <div key={item.signature} className="glass-effect rounded-xl border border-border/20 overflow-hidden">
//                     <div className="p-4">
//                       <div className="flex items-center justify-between mb-2">
//                         <div className="flex items-center gap-3">
//                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'
//                             }`}>
//                             {isSuccess ? (
//                               <CheckCircle className="w-5 h-5 text-green-500" />
//                             ) : (
//                               <XCircle className="w-5 h-5 text-red-500" />
//                             )}
//                           </div>
//                           <div>
//                             <p className="font-semibold text-sm">{isSuccess ? 'Success' : 'Failed'}</p>
//                             <p className="text-xs text-muted-foreground">
//                               {item.blockTime ? formatDate(item.blockTime) : 'Unknown time'}
//                             </p>
//                           </div>
//                         </div>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => setShowDetails(isExpanded ? null : item.signature)}
//                           className="h-8 w-8 p-0"
//                         >
//                           <Info className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
//                         </Button>
//                       </div>

//                       {isExpanded && (
//                         <div className="pt-3 border-t border-border/30 space-y-3">
//                           <div className="space-y-2">
//                             <div className="flex justify-between items-center">
//                               <span className="text-xs text-muted-foreground">Signature:</span>
//                               <div className="flex items-center gap-2">
//                                 <span className="font-mono text-xs">{ellipsify(item.signature, 6)}</span>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => navigator.clipboard.writeText(item.signature)}
//                                   className="h-6 w-6 p-0"
//                                 >
//                                   <Copy className="w-3 h-3" />
//                                 </Button>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="h-6 w-6 p-0"
//                                   onClick={() => window.open(`https://explorer.solana.com/tx/${item.signature}`, '_blank')}
//                                 >
//                                   <ExternalLink className="w-3 h-3" />
//                                 </Button>
//                               </div>
//                             </div>
//                             <div className="flex justify-between items-center">
//                               <span className="text-xs text-muted-foreground">Slot:</span>
//                               <div className="flex items-center gap-2">
//                                 <span className="font-mono text-xs">{item.slot}</span>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="h-6 w-6 p-0"
//                                   onClick={() => window.open(`https://explorer.solana.com/block/${item.slot}`, '_blank')}
//                                 >
//                                   <ExternalLink className="w-3 h-3" />
//                                 </Button>
//                               </div>
//                             </div>
//                             {item.blockTime && (
//                               <div className="flex justify-between items-center">
//                                 <span className="text-xs text-muted-foreground">Full Date:</span>
//                                 <span className="text-xs font-mono">
//                                   {new Date(item.blockTime * 1000).toLocaleString()}
//                                 </span>
//                               </div>
//                             )}
//                             {item.err && (
//                               <div className="mt-2 p-2 bg-destructive/10 rounded-lg">
//                                 <p className="text-xs text-destructive font-mono break-all">
//                                   {item.err.toString()}
//                                 </p>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )
//               })}

//               {(query.data?.length ?? 0) > 3 && (
//                 <div className="text-center">
//                   <Button
//                     variant="outline"
//                     onClick={() => setShowAll(!showAll)}
//                     className="w-full glass-effect border-border/20"
//                   >
//                     {showAll ? 'Show Less' : `Show All (${query.data?.length || 0} transactions)`}
//                     <Clock className="w-4 h-4 ml-2" />
//                   </Button>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

// function BalanceSol({ balance }: { balance: number }) {
//   return <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>
// }

// function ModalReceive({ address }: { address: PublicKey }) {
//   return (
//     <AppModal title="Receive Assets">
//       <div className="space-y-4">
//         <p className="text-sm text-muted-foreground">
//           Share your wallet address to receive SOL and other tokens:
//         </p>
//         <div className="glass-effect rounded-xl p-4 border border-border/20">
//           <div className="flex items-center justify-between gap-3">
//             <code className="text-sm font-mono break-all flex-1 text-foreground">
//               {address.toString()}
//             </code>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => navigator.clipboard.writeText(address.toString())}
//               className="shrink-0"
//             >
//               <Copy className="w-4 h-4" />
//             </Button>
//           </div>
//         </div>
//         <div className="text-xs text-muted-foreground text-center">
//           ⚠️ Only send Solana-compatible assets to this address
//         </div>
//       </div>
//     </AppModal>
//   )
// }

// function ModalAirdrop({ address }: { address: PublicKey }) {
//   const mutation = useRequestAirdrop({ address })
//   const [amount, setAmount] = useState('2')

//   return (
//     <AppModal
//       title="Request Airdrop"
//       submitDisabled={!amount || mutation.isPending}
//       submitLabel={mutation.isPending ? "Requesting..." : "Request Airdrop"}
//       submit={() => mutation.mutateAsync(parseFloat(amount))}
//     >
//       <div className="space-y-4">
//         <p className="text-sm text-muted-foreground">
//           Request SOL tokens for testing on this network. Only available on devnet/testnet.
//         </p>
//         <div className="space-y-2">
//           <Label htmlFor="amount" className="text-sm font-medium">
//             Amount (SOL)
//           </Label>
//           <Input
//             disabled={mutation.isPending}
//             id="amount"
//             min="1"
//             max="10"
//             onChange={(e) => setAmount(e.target.value)}
//             placeholder="Enter amount"
//             step="any"
//             type="number"
//             value={amount}
//             className="text-foreground"
//           />
//         </div>
//         {mutation.isPending && (
//           <div className="flex items-center gap-2 text-sm text-muted-foreground">
//             <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
//             Processing airdrop request...
//           </div>
//         )}
//       </div>
//     </AppModal>
//   )
// }

// function ModalSend({ address }: { address: PublicKey }) {
//   const wallet = useWallet()
//   const mutation = useTransferSol({ address })
//   const [destination, setDestination] = useState('')
//   const [amount, setAmount] = useState('')

//   if (!address || !wallet.sendTransaction) {
//     return <div>Wallet not connected</div>
//   }

//   return (
//     <AppModal
//       title="Send SOL"
//       submitDisabled={!destination || !amount || mutation.isPending}
//       submitLabel={mutation.isPending ? "Sending..." : "Send SOL"}
//       submit={() => {
//         mutation.mutateAsync({
//           destination: new PublicKey(destination),
//           amount: parseFloat(amount),
//         })
//       }}
//     >
//       <div className="space-y-4">
//         <p className="text-sm text-muted-foreground">
//           Send SOL tokens to another wallet address. Double-check the destination address.
//         </p>

//         <div className="space-y-2">
//           <Label htmlFor="destination" className="text-sm font-medium">
//             Destination Address
//           </Label>
//           <Input
//             disabled={mutation.isPending}
//             id="destination"
//             onChange={(e) => setDestination(e.target.value)}
//             placeholder="Enter recipient's wallet address"
//             type="text"
//             value={destination}
//             className="font-mono text-sm text-foreground"
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="amount" className="text-sm font-medium">
//             Amount (SOL)
//           </Label>
//           <Input
//             disabled={mutation.isPending}
//             id="amount"
//             min="0.001"
//             step="0.001"
//             onChange={(e) => setAmount(e.target.value)}
//             placeholder="Enter amount to send"
//             type="number"
//             value={amount}
//             className="text-foreground"
//           />
//         </div>

//         {mutation.isPending && (
//           <div className="flex items-center gap-2 text-sm text-muted-foreground">
//             <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
//             Processing transaction...
//           </div>
//         )}

//         <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
//           ⚠️ <strong>Warning:</strong> Transactions are irreversible. Please verify the destination address carefully.
//         </div>
//       </div>
//     </AppModal>
//   )
// }