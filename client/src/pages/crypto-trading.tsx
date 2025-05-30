import React, { useState } from "react";
import { useTrading } from "@/hooks/use-trading";
import { useCoinMarketCap } from "@/hooks/use-coinmarketcap";
import Footer from "@/components/layout/Footer";
import TradingTable from "@/components/trading/TradingTable";
import TradingCall from "@/components/trading/TradingCall";
import { CyberButton } from "@/components/ui/cyber-button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TradingCall as TradingCallType } from "@/types";

const CryptoTrading = () => {
  const { 
    tradingCalls, 
    activeCalls, 
    closedCalls, 
    generateCall, 
    isGeneratingCall, 
    closeCall, 
    isClosingCall,
    successRate,
    overallROI
  } = useTrading();
  const {
    dashboardData,
    globalData,
    isLoading: isCryptoLoading,
    hasError: cryptoError,
    formatCurrency,
    formatPercentage,
    getPercentageColor,
    getPercentageIcon,
    refreshAllData
  } = useCoinMarketCap();
  const { toast } = useToast();
  
  const [selectedTab, setSelectedTab] = useState<"active" | "closed">("active");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedCall, setSelectedCall] = useState<TradingCallType | null>(null);

  // Handle generating a new trading call
  const handleGenerateCall = () => {
    generateCall();
    setShowGenerateDialog(false);
    
    toast({
      title: "Trading Call Generated",
      description: "AI has created a new trading recommendation",
    });
  };

  // Handle closing a trading call
  const handleCloseCall = (callId: number, currentPrice: string) => {
    closeCall({ id: callId, currentPrice });
  };

  // Handle sharing a trading call
  const handleShareCall = (call: TradingCallType) => {
    setSelectedCall(call);
    setShowShareDialog(true);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-future font-bold text-neonGreen mb-2">Crypto Trading</h2>
        <p className="text-matrixGreen/70">AI-powered trading signals and performance tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <DashboardCard title="Trading Stats" titleColor="neonGreen">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gradient-to-br from-neonGreen/10 to-transparent border border-neonGreen/30 rounded">
              <p className="text-xs text-matrixGreen/70 mb-1">Total Calls</p>
              <p className="text-xl font-bold text-neonGreen">{tradingCalls.length}</p>
              <p className="text-xs text-matrixGreen/60">
                <i className="fas fa-chart-line text-neonGreen mr-1"></i> Lifetime
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-cyberBlue/10 to-transparent border border-cyberBlue/30 rounded">
              <p className="text-xs text-matrixGreen/70 mb-1">Success Rate</p>
              <p className="text-xl font-bold text-cyberBlue">{successRate.toFixed(1)}%</p>
              <p className="text-xs text-matrixGreen/60">
                <i className="fas fa-check-circle text-cyberBlue mr-1"></i> Win ratio
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-electricPurple/10 to-transparent border border-electricPurple/30 rounded">
              <p className="text-xs text-matrixGreen/70 mb-1">Active Calls</p>
              <p className="text-xl font-bold text-electricPurple">{activeCalls.length}</p>
              <p className="text-xs text-matrixGreen/60">
                <i className="fas fa-bolt text-electricPurple mr-1"></i> Open positions
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-neonGreen/10 to-transparent border border-neonGreen/30 rounded">
              <p className="text-xs text-matrixGreen/70 mb-1">Avg. ROI</p>
              <p className="text-xl font-bold text-neonGreen">
                {overallROI > 0 ? "+" : ""}{overallROI.toFixed(2)}%
              </p>
              <p className="text-xs text-matrixGreen/60">
                <i className="fas fa-percentage text-neonGreen mr-1"></i> Per trade
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <CyberButton
              className="w-full"
              onClick={() => setShowGenerateDialog(true)}
              iconLeft={<i className="fas fa-robot"></i>}
            >
              GENERATE NEW TRADE
            </CyberButton>
          </div>
        </DashboardCard>
        
        <DashboardCard 
          title="Market Overview" 
          titleColor="cyberBlue"
          className="md:col-span-2"
        >
          {isCryptoLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neonGreen"></div>
              <span className="ml-2 text-matrixGreen">Loading market data...</span>
            </div>
          ) : cryptoError ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">Error loading market data</p>
              <CyberButton onClick={refreshAllData} size="sm">
                <i className="fas fa-refresh mr-2"></i>Retry
              </CyberButton>
            </div>
          ) : (
            <>
              {/* Global Market Stats */}
              {globalData?.data && (
                <div className="mb-4 p-3 bg-gradient-to-r from-neonGreen/5 to-cyberBlue/5 border border-neonGreen/20 rounded">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-matrixGreen/70">Total Market Cap</p>
                      <p className="text-sm font-mono text-neonGreen">
                        {formatCurrency(globalData.data.quote.USD.total_market_cap)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-matrixGreen/70">24h Volume</p>
                      <p className="text-sm font-mono text-cyberBlue">
                        {formatCurrency(globalData.data.quote.USD.total_volume_24h)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-matrixGreen/70">BTC Dominance</p>
                      <p className="text-sm font-mono text-electricPurple">
                        {globalData.data.btc_dominance?.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-matrixGreen/70">Active Cryptos</p>
                      <p className="text-sm font-mono text-matrixGreen">
                        {globalData.data.active_cryptocurrencies?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Top Cryptocurrencies */}
              <div className="space-y-3">
                {dashboardData?.topCoins?.slice(0, 5).map((coin: any, index: number) => {
                  const iconMap: { [key: string]: { icon: string; color: string } } = {
                    'BTC': { icon: 'fab fa-bitcoin', color: 'neonGreen' },
                    'ETH': { icon: 'fab fa-ethereum', color: 'electricPurple' },
                    'BNB': { icon: 'fas fa-coins', color: 'yellow-400' },
                    'SOL': { icon: 'fas fa-sun', color: 'cyberBlue' },
                    'ADA': { icon: 'fas fa-heart', color: 'blue-400' },
                    'AVAX': { icon: 'fas fa-mountain', color: 'red-400' },
                    'DOT': { icon: 'fas fa-circle', color: 'pink-400' },
                    'MATIC': { icon: 'fas fa-polygon', color: 'purple-400' }
                  };
                  
                  const coinIcon = iconMap[coin.symbol] || { icon: 'fas fa-coins', color: 'matrixGreen' };
                  const priceChange24h = coin.quote.USD.percent_change_24h;
                  
                  return (
                    <div key={coin.id} className="p-3 bg-spaceBlack border border-neonGreen/20 rounded flex items-center justify-between hover:border-neonGreen/40 transition-colors">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full bg-${coinIcon.color}/10 border border-${coinIcon.color}/30 flex items-center justify-center mr-3`}>
                          <i className={`${coinIcon.icon} text-${coinIcon.color}`}></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-matrixGreen">{coin.name} ({coin.symbol})</p>
                          <p className="text-xs text-techWhite/50">
                            Rank #{coin.cmc_rank} • Vol: {formatCurrency(coin.quote.USD.volume_24h)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-matrixGreen font-mono">
                          {formatCurrency(coin.quote.USD.price)}
                        </p>
                        <p className={`text-xs ${getPercentageColor(priceChange24h)}`}>
                          {formatPercentage(priceChange24h)} <i className={getPercentageIcon(priceChange24h)}></i>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-matrixGreen/50">
                  <i className="fas fa-info-circle mr-1"></i> Data from CoinMarketCap • Updates every 5 min
                </p>
                <CyberButton onClick={refreshAllData} size="sm" variant="outline">
                  <i className="fas fa-refresh mr-1"></i>Refresh
                </CyberButton>
              </div>
            </>
          )}
        </DashboardCard>
      </div>

      <div className="cyber-card rounded-lg p-5 mb-6">
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "active" | "closed")}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-mono text-lg text-cyberBlue">Trading Calls</h3>
            <TabsList className="bg-spaceBlack">
              <TabsTrigger 
                value="active" 
                className="data-[state=active]:bg-neonGreen/20 data-[state=active]:text-neonGreen"
              >
                Active ({activeCalls.length})
              </TabsTrigger>
              <TabsTrigger 
                value="closed" 
                className="data-[state=active]:bg-cyberBlue/20 data-[state=active]:text-cyberBlue"
              >
                Closed ({closedCalls.length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="active">
            {activeCalls.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-matrixGreen/70 mb-4">No active trading calls</p>
                <CyberButton
                  onClick={() => setShowGenerateDialog(true)}
                  iconLeft={<i className="fas fa-plus"></i>}
                >
                  GENERATE FIRST CALL
                </CyberButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCalls.map((call) => (
                  <TradingCall
                    key={call.id}
                    tradingCall={call}
                    onClose={(currentPrice) => handleCloseCall(call.id, currentPrice)}
                    onShare={() => handleShareCall(call)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="closed">
            {closedCalls.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-matrixGreen/70">No closed trading calls yet</p>
              </div>
            ) : (
              <TradingTable
                tradingCalls={closedCalls}
                onViewHistory={() => {
                  toast({
                    title: "Trading History",
                    description: "Trading history view is not implemented in this demo",
                  });
                }}
                onGenerateNew={() => setShowGenerateDialog(true)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Generate Call Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="bg-cyberDark border border-neonGreen/30 text-techWhite">
          <DialogHeader>
            <DialogTitle className="text-neonGreen font-future text-xl">Generate Trading Call</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-matrixGreen mb-4">
              The AI will analyze market conditions, technical patterns, and sentiment to generate a high-probability trading recommendation.
            </p>
            <div className="space-y-2 font-mono text-xs text-techWhite/60 p-3 bg-spaceBlack rounded border border-neonGreen/20">
              <div className="flex">
                <span className="text-neonGreen mr-2">&gt;</span>
                <span>Analyzing price action across major exchanges...</span>
              </div>
              <div className="flex">
                <span className="text-neonGreen mr-2">&gt;</span>
                <span>Evaluating technical indicators: RSI, MACD, Bollinger Bands...</span>
              </div>
              <div className="flex">
                <span className="text-neonGreen mr-2">&gt;</span>
                <span>Processing sentiment data from social media and news...</span>
              </div>
              <div className="flex">
                <span className="text-neonGreen mr-2">&gt;</span>
                <span>Ready to generate high-conviction trading call...</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <CyberButton
              onClick={() => setShowGenerateDialog(false)}
              variant="outline"
            >
              CANCEL
            </CyberButton>
            <CyberButton
              onClick={handleGenerateCall}
              disabled={isGeneratingCall}
              iconLeft={isGeneratingCall ? null : <i className="fas fa-robot"></i>}
            >
              {isGeneratingCall ? (
                <>
                  <span className="animate-spin mr-2">
                    <i className="fas fa-circle-notch"></i>
                  </span>
                  ANALYZING...
                </>
              ) : (
                "GENERATE CALL"
              )}
            </CyberButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Call Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-cyberDark border border-neonGreen/30 text-techWhite">
          <DialogHeader>
            <DialogTitle className="text-cyberBlue font-future text-xl">Share Trading Call</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedCall && (
              <>
                <div className="bg-spaceBlack border border-neonGreen/20 rounded p-3 mb-4">
                  <p className="text-matrixGreen font-mono">
                    🚨 TRADING SIGNAL 🚨<br/>
                    {selectedCall.position} {selectedCall.asset}/USD<br/>
                    Entry: ${selectedCall.entryPrice}<br/>
                    Target: ${selectedCall.targetPrice}<br/>
                    #Crypto #Trading #{selectedCall.asset}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-matrixGreen text-sm block mb-1">Share Link</label>
                    <div className="flex">
                      <Input
                        readOnly
                        value={`https://neurax.ai/share/trade/${selectedCall.id}`}
                        className="bg-spaceBlack border-neonGreen/30 text-matrixGreen"
                      />
                      <CyberButton
                        className="ml-2"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://neurax.ai/share/trade/${selectedCall.id}`);
                          toast({
                            title: "Copied",
                            description: "Link copied to clipboard",
                          });
                        }}
                      >
                        <i className="fas fa-copy"></i>
                      </CyberButton>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <CyberButton
                      className="flex-1"
                      onClick={() => {
                        toast({
                          title: "Twitter Share",
                          description: "Twitter sharing is not implemented in this demo",
                        });
                      }}
                      iconLeft={<i className="fab fa-twitter"></i>}
                    >
                      TWITTER
                    </CyberButton>
                    <CyberButton
                      className="flex-1"
                      onClick={() => {
                        toast({
                          title: "Telegram Share",
                          description: "Telegram sharing is not implemented in this demo",
                        });
                      }}
                      iconLeft={<i className="fab fa-telegram"></i>}
                    >
                      TELEGRAM
                    </CyberButton>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <CyberButton
              onClick={() => setShowShareDialog(false)}
            >
              CLOSE
            </CyberButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CryptoTrading;
