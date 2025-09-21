import dynamic from 'next/dynamic'

// Dynamically import MeteoraFeature to prevent SSR issues
const MeteoraFeature = dynamic(
  () => import('@/components/meteora/meteora-feature'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen">
        <div className="lg:px-[70px] px-4 lg:mt-[80px] mt-[40px] mb-16 flex flex-col items-start justify-start">
          <div className="w-full">
            <div className="relative">
              <div className="h-12 bg-gray-600 rounded mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-600 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="lg:px-[70px] px-4 mx-auto space-y-12">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading DLMM opportunities...</p>
          </div>
        </div>
      </div>
    )
  }
)

export default function Home() {
  return <MeteoraFeature />
}