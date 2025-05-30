import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, login, register, loginWithTwitter, isLoginLoading, isRegisterLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'register') {
        await register({
          email: formData.email,
          password: formData.password,
          username: formData.username || formData.email.split('@')[0]
        });

        toast({
          title: 'Registration completed',
          description: 'Account created successfully!',
        });
        
        // Redirect to dashboard after successful registration
        setLocation('/dashboard');
      } else {
        await login({
          email: formData.email,
          password: formData.password,
        });

        toast({
          title: 'Login effettuato',
          description: 'Benvenuto!',
        });
        
        // Redirect to dashboard after successful login
        setLocation('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message || 'Si è verificato un errore',
        variant: 'destructive',
      });
    }
  };

  const handleTwitterLogin = async () => {
    try {
      await loginWithTwitter();
    } catch (error: any) {
      console.error('Twitter login error:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Errore durante il login con Twitter',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyberDark via-gray-900 to-black p-4">


      <Card className="w-full max-w-md bg-cyberDark/90 backdrop-blur-lg border-neonGreen/30 shadow-glow-lg relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-neonGreen to-cyberBlue rounded-full flex items-center justify-center">
            <i className="fas fa-robot text-2xl text-cyberDark"></i>
          </div>
          <CardTitle className="text-2xl font-future text-neonGreen">
            NeuraX
          </CardTitle>
          <CardDescription className="text-techWhite/70">
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Twitter Login Button */}
          <Button
            onClick={handleTwitterLogin}
            disabled={isLoginLoading || isRegisterLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-glow-sm"
          >
            <i className="fab fa-twitter mr-2"></i>
            {(isLoginLoading || isRegisterLoading) ? 'Connecting...' : 'Continue with Twitter'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neonGreen/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-cyberDark px-2 text-techWhite/50">or</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-techWhite mb-2">
                  Username
                </label>
                <Input
                  name="username"
                  type="text"
                  placeholder="Your username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="!bg-gray-900 !border-green-500/30 !text-white placeholder:!text-gray-400 focus:!border-green-500 focus:!ring-green-500/20"
                  required={mode === 'register'}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-techWhite mb-2">
                Email
              </label>
              <Input
                name="email"
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={handleInputChange}
                className="!bg-gray-900 !border-green-500/30 !text-white placeholder:!text-gray-400 focus:!border-green-500 focus:!ring-green-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-techWhite mb-2">
                Password
              </label>
              <Input
                name="password"
                type="password"
                placeholder="Your password"
                value={formData.password}
                onChange={handleInputChange}
                className="!bg-gray-900 !border-green-500/30 !text-white placeholder:!text-gray-400 focus:!border-green-500 focus:!ring-green-500/20"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={mode === 'login' ? isLoginLoading : isRegisterLoading}
              className="w-full bg-gradient-to-r from-neonGreen to-cyberBlue hover:from-neonGreen/80 hover:to-cyberBlue/80 text-cyberDark font-semibold shadow-glow-sm"
            >
              {(mode === 'login' ? isLoginLoading : isRegisterLoading) ? 'Loading...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-sm text-neonGreen hover:text-neonGreen/80 transition-colors"
            >
              {mode === 'login' 
                ? 'Don\'t have an account? Sign up' 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
