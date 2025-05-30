import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have OAuth parameters (Twitter callback)
        const urlParams = new URLSearchParams(window.location.search);
        const oauthToken = urlParams.get('oauth_token');
        const oauthVerifier = urlParams.get('oauth_verifier');
        
        if (oauthToken && oauthVerifier) {
          // This is a Twitter OAuth callback - the server should handle it
          // and redirect to /dashboard automatically
          console.log('Twitter OAuth callback detected');
          return;
        }
        
        // For other auth callbacks, check if user is authenticated
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.user) {
            console.log('User authenticated:', userData.user);
            setLocation('/dashboard');
            return;
          }
        }
        
        // No authentication found, redirect to login
        console.log('No authentication found, redirecting to login');
        setLocation('/login');
      } catch (error) {
        console.error('Auth callback error:', error);
        setLocation('/login?error=auth_callback_failed');
      }
    };

    // Small delay to ensure URL is fully loaded
    const timer = setTimeout(handleAuthCallback, 100);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}