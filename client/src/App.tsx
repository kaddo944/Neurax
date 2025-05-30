import React, { useEffect, useState } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/index";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import AIAutonomous from "@/pages/ai-autonomous";
import ManualPost from "@/pages/manual-post";
import CryptoTrading from "@/pages/crypto-trading";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import AuthCallback from "@/pages/AuthCallback";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import FAQ from "@/pages/faq";

// Components
import Sidebar from "@/components/layout/Sidebar";
import MatrixBackground from "@/components/layout/MatrixBackground";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";

function App() {
  const { user, isLoading, logout } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lastMessage } = useWebSocket();

  // Handle WebSocket messages for notifications
  useEffect(() => {
    if (lastMessage && user) {
      // Only process messages if user is logged in
      try {
        // lastMessage is already an object, no need to parse
        switch (lastMessage.type) {
          case 'content_update':
            toast({
              title: 'New Content',
              description: 'A new post has been created by the AI',
            });
            break;
            
          case 'trading_update':
            toast({
              title: 'Trading Call Update',
              description: lastMessage.tradingCall?.status === 'CLOSED' 
                ? `Trading call for ${lastMessage.tradingCall?.asset} has been closed`
                : `New trading call generated for ${lastMessage.tradingCall?.asset}`,
            });
            break;
            
          case 'metrics_update':
            toast({
              title: 'Performance Update',
              description: 'Your account metrics have been updated',
            });
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    }
  }, [lastMessage, toast, user]);

  // Determine if we should show the sidebar (not on login page)
  const showSidebar = location !== '/login' && user;

  return (
    <div className="matrix-bg">
      <MatrixBackground />
      
      {/* Scanline effects */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-10 bg-repeat scanning-effect" 
        style={{backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi+vDhQxMDAwMzEIMARKICBBgADegCeilX7IEAAAAASUVORK5CYII=')"}} />
      
      {showSidebar && (
        <Sidebar 
          open={sidebarOpen} 
          setOpen={setSidebarOpen} 
          onLogout={logout}
          username={user ? user.username : ''}
        />
      )}
      
      {/* Mobile Header */}
      {showSidebar && (
        <div className="fixed top-0 left-0 right-0 bg-cyberDark/90 backdrop-blur-sm border-b border-neonGreen/30 p-4 z-20 lg:hidden flex justify-between items-center">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="text-techWhite hover:text-neonGreen"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          <h1 className="font-future text-xl font-bold text-neonGreen">NeuraX</h1>
          <div className="rounded-full w-8 h-8 bg-gradient-to-r from-neonGreen/20 to-cyberBlue/20 flex items-center justify-center border border-neonGreen/40">
            <i className="fas fa-user-astronaut text-sm text-neonGreen"></i>
          </div>
        </div>
      )}
      
      <main className={`${showSidebar ? 'lg:ml-64' : ''} min-h-screen ${showSidebar ? 'pt-16 lg:pt-0' : ''} pb-16 transition-all duration-300`}>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/auth/callback" component={AuthCallback} />
          
          {/* Root redirect to dashboard */}
          <Route path="/">
            {() => {
              if (isLoading) {
                return (
                  <div className="container mx-auto p-4 pt-8">
                    <div className="border border-neonGreen/20 rounded-lg bg-cyberDark/30 backdrop-blur-lg p-6 shadow-glow-sm">
                      <div className="h-8 w-64 bg-cyberDark/50 mb-6 animate-pulse rounded" />
                    </div>
                  </div>
                );
              }
              if (!user) {
                return <Redirect to="/login" />;
              }
              return <Redirect to="/dashboard" />;
            }}
          </Route>
          
          <Route path="/dashboard">
            {() => (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/ai-autonomous">
            {() => (
              <ProtectedRoute>
                <AIAutonomous />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/manual-post">
            {() => (
              <ProtectedRoute>
                <ManualPost />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/crypto-trading">
            {() => (
              <ProtectedRoute>
                <CryptoTrading />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/analytics">
            {() => (
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/settings">
            {() => (
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            )}
          </Route>
          
          {/* Public pages - no authentication required */}
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/faq" component={FAQ} />
          
          <Route>
            {() => (
              <ProtectedRoute>
                <NotFound />
              </ProtectedRoute>
            )}
          </Route>
        </Switch>
      </main>
      
      <Toaster />
    </div>
  );
}

export default App;
