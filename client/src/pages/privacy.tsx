import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Lock, Database, UserCheck, AlertTriangle } from 'lucide-react';

export default function Privacy() {
  const sections = [
    {
      icon: <Database className="h-6 w-6 text-neonGreen" />,
      title: "Information We Collect",
      content: [
        "Account information (email, username, profile data)",
        "Social media account connections and authentication tokens",
        "Usage data and analytics (posts created, engagement metrics)",
        "Device information (IP address, browser type, operating system)",
        "Cryptocurrency trading preferences and portfolio data (if enabled)"
      ]
    },
    {
      icon: <Eye className="h-6 w-6 text-cyberBlue" />,
      title: "How We Use Your Information",
      content: [
        "Provide and improve our AI-powered social media management services",
        "Generate personalized content recommendations and automated posts",
        "Analyze cryptocurrency markets and provide trading insights",
        "Send important service updates and security notifications",
        "Comply with legal obligations and prevent fraudulent activities"
      ]
    },
    {
      icon: <Lock className="h-6 w-6 text-neonGreen" />,
      title: "Data Security",
      content: [
        "End-to-end encryption for all sensitive data transmissions",
        "Secure OAuth 1.0a authentication for social media connections",
        "Regular security audits and penetration testing",
        "SOC 2 Type II compliant data centers with 24/7 monitoring",
        "Multi-factor authentication and session management"
      ]
    },
    {
      icon: <UserCheck className="h-6 w-6 text-cyberBlue" />,
      title: "Your Rights",
      content: [
        "Access and download your personal data at any time",
        "Request correction of inaccurate or incomplete information",
        "Delete your account and associated data permanently",
        "Opt-out of non-essential communications and marketing",
        "Data portability to transfer your information to other services"
      ]
    }
  ];

  return (
    <div className="container mx-auto p-4 pt-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="border-neonGreen text-neonGreen">
          Legal & Compliance
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-neonGreen to-cyberBlue bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-xl text-techWhite/80 max-w-3xl mx-auto leading-relaxed">
          Your privacy is our priority. This policy explains how we collect, use, and protect your personal information 
          when you use NeuraX's AI-powered social media management platform.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-techWhite/60">
          <Shield className="h-4 w-4" />
          <span>Last updated: December 25, 2024</span>
        </div>
      </div>

      {/* Quick Overview */}
      <Card className="bg-gradient-to-r from-neonGreen/10 to-cyberBlue/10 border-neonGreen/30 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-neonGreen flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Privacy at a Glance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <Lock className="h-8 w-8 text-neonGreen mx-auto mb-2" />
              <h4 className="font-semibold text-techWhite mb-1">Secure by Design</h4>
              <p className="text-sm text-techWhite/70">Enterprise-grade encryption and security measures</p>
            </div>
            <div className="text-center p-4">
              <UserCheck className="h-8 w-8 text-cyberBlue mx-auto mb-2" />
              <h4 className="font-semibold text-techWhite mb-1">Your Control</h4>
              <p className="text-sm text-techWhite/70">Full control over your data and privacy settings</p>
            </div>
            <div className="text-center p-4">
              <Shield className="h-8 w-8 text-neonGreen mx-auto mb-2" />
              <h4 className="font-semibold text-techWhite mb-1">GDPR Compliant</h4>
              <p className="text-sm text-techWhite/70">Fully compliant with international privacy laws</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Sections */}
      <div className="space-y-6">
        {sections.map((section, index) => (
          <Card key={index} className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-xl text-techWhite flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyberDark/50">
                  {section.icon}
                </div>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-neonGreen mt-2 flex-shrink-0"></div>
                    <span className="text-techWhite/80 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Sharing */}
      <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-neonGreen">Data Sharing and Third Parties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-techWhite/80 leading-relaxed">
            We do not sell, rent, or trade your personal information to third parties. We may share limited data only in these specific circumstances:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-cyberDark/30">
              <h4 className="font-semibold text-cyberBlue mb-2">Service Providers</h4>
              <p className="text-sm text-techWhite/70">
                Trusted partners who help us operate our platform (hosting, analytics, payment processing) under strict confidentiality agreements.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-cyberDark/30">
              <h4 className="font-semibold text-cyberBlue mb-2">Legal Requirements</h4>
              <p className="text-sm text-techWhite/70">
                When required by law, court order, or to protect our rights and the safety of our users and the public.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cookies and Tracking */}
      <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-neonGreen">Cookies and Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-techWhite/80 leading-relaxed">
            We use cookies and similar technologies to enhance your experience and analyze platform usage:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-neonGreen mt-2"></div>
              <div>
                <span className="font-medium text-techWhite">Essential Cookies:</span>
                <span className="text-techWhite/70 ml-2">Required for basic platform functionality and security</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-cyberBlue mt-2"></div>
              <div>
                <span className="font-medium text-techWhite">Analytics Cookies:</span>
                <span className="text-techWhite/70 ml-2">Help us understand how you use our platform to improve performance</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-neonGreen mt-2"></div>
              <div>
                <span className="font-medium text-techWhite">Preference Cookies:</span>
                <span className="text-techWhite/70 ml-2">Remember your settings and personalization choices</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-neonGreen">Data Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-techWhite/80 leading-relaxed mb-4">
            We retain your personal information only as long as necessary to provide our services and comply with legal obligations:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-cyberDark/30">
              <h4 className="font-semibold text-cyberBlue mb-2">Active Accounts</h4>
              <p className="text-sm text-techWhite/70">
                Data is retained while your account is active and for up to 90 days after account deletion to allow for recovery.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-cyberDark/30">
              <h4 className="font-semibold text-cyberBlue mb-2">Legal Requirements</h4>
              <p className="text-sm text-techWhite/70">
                Some data may be retained longer to comply with legal, regulatory, or security requirements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-gradient-to-r from-neonGreen/10 to-cyberBlue/10 border-neonGreen/30 backdrop-blur-lg">
        <CardContent className="p-6 text-center space-y-4">
          <h3 className="text-xl font-semibold text-neonGreen">Questions About Privacy?</h3>
          <p className="text-techWhite/80 max-w-2xl mx-auto">
            If you have any questions about this Privacy Policy or how we handle your personal information, 
            please don't hesitate to contact our Data Protection Officer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:privacy@neurax.ai" 
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-neonGreen to-cyberBlue hover:from-neonGreen/80 hover:to-cyberBlue/80 text-cyberDark font-semibold rounded-lg transition-all duration-200"
            >
              privacy@neurax.ai
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}