import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Bot, TrendingUp, Shield, Zap, Users, BarChart3 } from 'lucide-react';

export default function About() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <Bot className="h-8 w-8 text-neonGreen" />,
      title: "AI-Powered Content Generation",
      description: "Advanced AI algorithms create engaging, personalized content that resonates with your audience and drives engagement."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-cyberBlue" />,
      title: "Crypto Trading Integration",
      description: "Real-time cryptocurrency market analysis and automated trading signals to maximize your investment opportunities."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-neonGreen" />,
      title: "Advanced Analytics",
      description: "Comprehensive performance metrics and insights to track your social media growth and optimize your strategy."
    },
    {
      icon: <Shield className="h-8 w-8 text-cyberBlue" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with OAuth authentication and encrypted data storage to protect your accounts."
    },
    {
      icon: <Zap className="h-8 w-8 text-neonGreen" />,
      title: "Automated Scheduling",
      description: "Smart scheduling algorithms post your content at optimal times for maximum reach and engagement."
    },
    {
      icon: <Users className="h-8 w-8 text-cyberBlue" />,
      title: "Multi-Platform Support",
      description: "Manage multiple social media accounts from a single, unified dashboard with seamless integration."
    }
  ];

  const stats = [
    { label: "Active Users", value: "10K+" },
    { label: "Posts Generated", value: "1M+" },
    { label: "Engagement Rate", value: "85%" },
    { label: "Time Saved", value: "20hrs/week" }
  ];

  return (
    <div className="container mx-auto p-4 pt-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <Badge variant="outline" className="border-neonGreen text-neonGreen">
            Next-Generation Social Media Management
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-neonGreen to-cyberBlue bg-clip-text text-transparent">
            About NeuraX
          </h1>
          <p className="text-xl text-techWhite/80 max-w-3xl mx-auto leading-relaxed">
            NeuraX is an advanced AI-powered social media management platform that combines artificial intelligence, 
            cryptocurrency trading insights, and comprehensive analytics to revolutionize your digital presence.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
            <CardContent className="p-6 text-center">
              <div className="text-2xl md:text-3xl font-bold text-neonGreen mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-techWhite/70">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mission Section */}
      <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-neonGreen">Our Mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-techWhite/80 leading-relaxed">
            At NeuraX, we believe that social media management should be intelligent, efficient, and profitable. 
            Our mission is to empower content creators, businesses, and crypto enthusiasts with cutting-edge AI technology 
            that not only manages their social presence but also provides valuable market insights.
          </p>
          <p className="text-techWhite/80 leading-relaxed">
            We're building the future of digital marketing where artificial intelligence handles the complexity, 
            allowing you to focus on what matters most - growing your brand and connecting with your audience.
          </p>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-center text-neonGreen">Platform Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg hover:border-neonGreen/40 transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-cyberDark/50 group-hover:bg-cyberDark/70 transition-colors">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg text-techWhite">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-techWhite/70 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-neonGreen">Technology Stack</CardTitle>
          <CardDescription className="text-techWhite/70">
            Built with modern technologies for maximum performance and reliability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-cyberBlue mb-3">Frontend</h4>
              <div className="flex flex-wrap gap-2">
                {['React', 'TypeScript', 'Tailwind CSS', 'Vite'].map((tech) => (
                  <Badge key={tech} variant="outline" className="border-cyberBlue/50 text-cyberBlue">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-cyberBlue mb-3">Backend</h4>
              <div className="flex flex-wrap gap-2">
                {['Node.js', 'Express', 'SQLite', 'OAuth 1.0a'].map((tech) => (
                  <Badge key={tech} variant="outline" className="border-cyberBlue/50 text-cyberBlue">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-cyberBlue mb-3">AI & APIs</h4>
              <div className="flex flex-wrap gap-2">
                {['Hugging Face', 'Twitter API', 'CoinMarketCap', 'WebSocket'].map((tech) => (
                  <Badge key={tech} variant="outline" className="border-cyberBlue/50 text-cyberBlue">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-cyberBlue mb-3">Security</h4>
              <div className="flex flex-wrap gap-2">
                {['HTTPS', 'CSRF Protection', 'Rate Limiting', 'Session Management'].map((tech) => (
                  <Badge key={tech} variant="outline" className="border-cyberBlue/50 text-cyberBlue">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-neonGreen/10 to-cyberBlue/10 border-neonGreen/30 backdrop-blur-lg">
        <CardContent className="p-8 text-center space-y-4">
          <h3 className="text-2xl font-bold text-neonGreen">Ready to Transform Your Social Media?</h3>
          <p className="text-techWhite/80 max-w-2xl mx-auto">
            Join thousands of users who are already leveraging AI to grow their social media presence and maximize their crypto investments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setLocation('/dashboard')}
              className="bg-gradient-to-r from-neonGreen to-cyberBlue hover:from-neonGreen/80 hover:to-cyberBlue/80 text-cyberDark font-semibold"
            >
              Get Started Now
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/contact')}
              className="border-neonGreen text-neonGreen hover:bg-neonGreen/10"
            >
              Contact Us
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}