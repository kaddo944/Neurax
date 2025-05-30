import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Scale, AlertCircle, CheckCircle, XCircle, Shield } from 'lucide-react';

export default function Terms() {
  const sections = [
    {
      icon: <CheckCircle className="h-6 w-6 text-neonGreen" />,
      title: "Acceptable Use",
      content: [
        "Use NeuraX for legitimate social media management and content creation",
        "Comply with all applicable laws and regulations in your jurisdiction",
        "Respect intellectual property rights and third-party content policies",
        "Maintain the security and confidentiality of your account credentials",
        "Use AI-generated content responsibly and in accordance with platform guidelines"
      ]
    },
    {
      icon: <XCircle className="h-6 w-6 text-red-400" />,
      title: "Prohibited Activities",
      content: [
        "Creating spam, misleading, or fraudulent content",
        "Attempting to hack, reverse engineer, or compromise our systems",
        "Using the platform for illegal activities or harassment",
        "Sharing malicious software, viruses, or harmful code",
        "Violating social media platform terms of service through our tools"
      ]
    },
    {
      icon: <Scale className="h-6 w-6 text-cyberBlue" />,
      title: "Intellectual Property",
      content: [
        "NeuraX retains all rights to our platform, software, and proprietary technology",
        "You retain ownership of your original content and data",
        "AI-generated content is provided 'as-is' with no ownership guarantees",
        "You grant us limited rights to process your data to provide our services",
        "Respect third-party trademarks, copyrights, and intellectual property"
      ]
    },
    {
      icon: <Shield className="h-6 w-6 text-neonGreen" />,
      title: "Limitation of Liability",
      content: [
        "NeuraX is provided 'as-is' without warranties of any kind",
        "We are not liable for social media account suspensions or bans",
        "Cryptocurrency trading involves risk; we provide information, not financial advice",
        "Our liability is limited to the amount paid for our services",
        "You are responsible for backing up your data and content"
      ]
    }
  ];

  return (
    <div className="container mx-auto p-4 pt-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="border-neonGreen text-neonGreen">
          Legal Agreement
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-neonGreen to-cyberBlue bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-xl text-techWhite/80 max-w-3xl mx-auto leading-relaxed">
          These terms govern your use of NeuraX's AI-powered social media management platform. 
          By using our services, you agree to be bound by these terms.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-techWhite/60">
          <FileText className="h-4 w-4" />
          <span>Effective Date: December 25, 2024</span>
        </div>
      </div>

      {/* Agreement Notice */}
      <Card className="bg-gradient-to-r from-neonGreen/10 to-cyberBlue/10 border-neonGreen/30 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-neonGreen flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Important Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-techWhite/80 leading-relaxed">
            By accessing or using NeuraX, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service 
            and our Privacy Policy. If you do not agree to these terms, please do not use our platform.
          </p>
        </CardContent>
      </Card>

      {/* Service Description */}
      <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-neonGreen">Service Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-techWhite/80 leading-relaxed">
            NeuraX is an AI-powered social media management platform that provides:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-cyberDark/30">
              <h4 className="font-semibold text-cyberBlue mb-2">Core Features</h4>
              <ul className="text-sm text-techWhite/70 space-y-1">
                <li>• AI content generation and scheduling</li>
                <li>• Social media account management</li>
                <li>• Analytics and performance tracking</li>
                <li>• Automated posting and engagement</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-cyberDark/30">
              <h4 className="font-semibold text-cyberBlue mb-2">Additional Services</h4>
              <ul className="text-sm text-techWhite/70 space-y-1">
                <li>• Cryptocurrency market insights</li>
                <li>• Trading signal notifications</li>
                <li>• Portfolio tracking and analysis</li>
                <li>• Real-time market data integration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Terms Sections */}
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

      {/* Account Terms */}
      <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-neonGreen">Account Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-cyberBlue mb-3">Account Creation</h4>
              <ul className="space-y-2 text-sm text-techWhite/70">
                <li>• You must be at least 18 years old to use NeuraX</li>
                <li>• Provide accurate and complete registration information</li>
                <li>• Maintain the security of your account credentials</li>
                <li>• You are responsible for all activities under your account</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-cyberBlue mb-3">Account Termination</h4>
              <ul className="space-y-2 text-sm text-techWhite/70">
                <li>• You may terminate your account at any time</li>
                <li>• We may suspend accounts for terms violations</li>
                <li>• Data deletion follows our retention policies</li>
                <li>• Paid subscriptions are subject to refund policies</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Terms */}
      <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-neonGreen">Payment and Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-cyberBlue mb-3">Subscription Plans</h4>
              <ul className="space-y-2 text-sm text-techWhite/70">
                <li>• Monthly and annual billing options available</li>
                <li>• Automatic renewal unless cancelled</li>
                <li>• Price changes with 30-day notice</li>
                <li>• Free tier with limited features</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-cyberBlue mb-3">Refunds</h4>
              <ul className="space-y-2 text-sm text-techWhite/70">
                <li>• 30-day money-back guarantee for new subscribers</li>
                <li>• Pro-rated refunds for annual plans</li>
                <li>• No refunds for partial month usage</li>
                <li>• Refund processing within 5-10 business days</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI and Content Disclaimer */}
      <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-neonGreen">AI Content Disclaimer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-techWhite/80 leading-relaxed">
            Our AI-powered content generation is designed to assist with social media management, but users should be aware:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-neonGreen mt-2"></div>
              <span className="text-techWhite/80">AI-generated content should be reviewed before publishing</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-cyberBlue mt-2"></div>
              <span className="text-techWhite/80">Users are responsible for ensuring content accuracy and appropriateness</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-neonGreen mt-2"></div>
              <span className="text-techWhite/80">We do not guarantee the performance or engagement of AI-generated content</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-cyberBlue mt-2"></div>
              <span className="text-techWhite/80">Cryptocurrency insights are for informational purposes only, not financial advice</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changes to Terms */}
      <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-xl text-neonGreen">Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-techWhite/80 leading-relaxed mb-4">
            We may update these Terms of Service from time to time. When we make changes:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-neonGreen mt-2"></div>
              <span className="text-techWhite/80">We will notify users via email and in-app notifications</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-cyberBlue mt-2"></div>
              <span className="text-techWhite/80">Changes become effective 30 days after notification</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-neonGreen mt-2"></div>
              <span className="text-techWhite/80">Continued use constitutes acceptance of updated terms</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-gradient-to-r from-neonGreen/10 to-cyberBlue/10 border-neonGreen/30 backdrop-blur-lg">
        <CardContent className="p-6 text-center space-y-4">
          <h3 className="text-xl font-semibold text-neonGreen">Questions About These Terms?</h3>
          <p className="text-techWhite/80 max-w-2xl mx-auto">
            If you have any questions about these Terms of Service or need clarification on any provisions, 
            please contact our legal team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:legal@neurax.ai" 
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-neonGreen to-cyberBlue hover:from-neonGreen/80 hover:to-cyberBlue/80 text-cyberDark font-semibold rounded-lg transition-all duration-200"
            >
              legal@neurax.ai
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}