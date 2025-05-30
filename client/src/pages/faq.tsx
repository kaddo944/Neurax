import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Search, HelpCircle, Zap, Shield, CreditCard, Bot, TrendingUp, Users } from 'lucide-react';

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqCategories = [
    {
      icon: <Zap className="h-5 w-5 text-neonGreen" />,
      title: "Getting Started",
      color: "neonGreen",
      faqs: [
        {
          question: "How do I get started with NeuraX?",
          answer: "Simply sign up for an account, connect your social media profiles (Twitter, Instagram, etc.), and start using our AI-powered tools to create and schedule content. Our onboarding wizard will guide you through the setup process."
        },
        {
          question: "What social media platforms does NeuraX support?",
          answer: "Currently, we support Twitter, Instagram, Facebook, LinkedIn, and TikTok. We're continuously adding support for more platforms based on user demand."
        },
        {
          question: "Do I need technical knowledge to use NeuraX?",
          answer: "Not at all! NeuraX is designed to be user-friendly with an intuitive interface. Our AI handles the complex tasks while you focus on your content strategy and business goals."
        },
        {
          question: "How long does it take to see results?",
          answer: "Most users see improved engagement within the first week of consistent posting. However, building a strong social media presence typically takes 30-90 days of regular, quality content."
        }
      ]
    },
    {
      icon: <Bot className="h-5 w-5 text-cyberBlue" />,
      title: "AI Features",
      color: "cyberBlue",
      faqs: [
        {
          question: "How does the AI content generation work?",
          answer: "Our AI analyzes your brand voice, target audience, and trending topics to generate relevant, engaging content. It uses advanced language models trained on successful social media content to create posts that resonate with your audience."
        },
        {
          question: "Can I customize the AI-generated content?",
          answer: "Absolutely! All AI-generated content can be edited, refined, or used as inspiration. You have full control over what gets published to your social media accounts."
        },
        {
          question: "Does the AI learn from my preferences?",
          answer: "Yes, our AI continuously learns from your editing patterns, engagement data, and feedback to improve future content suggestions and better match your brand voice."
        },
        {
          question: "What languages does the AI support?",
          answer: "Currently, our AI supports English, Spanish, French, German, Italian, Portuguese, and Japanese. We're working on adding more languages based on user requests."
        }
      ]
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-purple-400" />,
      title: "Crypto Trading",
      color: "purple-400",
      faqs: [
        {
          question: "Is NeuraX a trading platform?",
          answer: "No, NeuraX is not a trading platform. We provide market insights, analysis, and educational content about cryptocurrency. All trading decisions and actions must be made through your chosen exchange or broker."
        },
        {
          question: "Are the crypto signals guaranteed to be profitable?",
          answer: "No investment advice or signals are guaranteed. Cryptocurrency trading involves significant risk, and past performance doesn't indicate future results. Always do your own research and never invest more than you can afford to lose."
        },
        {
          question: "How accurate are the market predictions?",
          answer: "Our AI analyzes market data and trends to provide insights, but cryptocurrency markets are highly volatile and unpredictable. Use our analysis as one factor in your decision-making process, not as the sole basis for trading decisions."
        },
        {
          question: "Do you provide financial advice?",
          answer: "No, we do not provide financial advice. All content related to cryptocurrency is for educational and informational purposes only. Consult with a qualified financial advisor for personalized investment advice."
        }
      ]
    },
    {
      icon: <CreditCard className="h-5 w-5 text-yellow-400" />,
      title: "Billing & Plans",
      color: "yellow-400",
      faqs: [
        {
          question: "What's included in the free plan?",
          answer: "The free plan includes basic AI content generation (10 posts/month), scheduling for 1 social media account, basic analytics, and access to our community forum."
        },
        {
          question: "Can I upgrade or downgrade my plan anytime?",
          answer: "Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle. You'll receive prorated credits for upgrades."
        },
        {
          question: "Do you offer refunds?",
          answer: "We offer a 30-day money-back guarantee for new subscribers. If you're not satisfied within the first 30 days, contact our support team for a full refund."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe."
        }
      ]
    },
    {
      icon: <Shield className="h-5 w-5 text-green-400" />,
      title: "Security & Privacy",
      color: "green-400",
      faqs: [
        {
          question: "How secure is my data?",
          answer: "We use enterprise-grade security measures including AES-256 encryption, secure data centers, regular security audits, and strict access controls. Your data is protected both in transit and at rest."
        },
        {
          question: "Do you store my social media passwords?",
          answer: "No, we never store your social media passwords. We use OAuth authentication, which means you log in directly through the social media platform, and they provide us with secure access tokens."
        },
        {
          question: "Can I delete my data?",
          answer: "Yes, you can request complete data deletion at any time. We'll remove all your personal data within 30 days of your request, except for data we're legally required to retain."
        },
        {
          question: "Do you share data with third parties?",
          answer: "We never sell your personal data. We only share data with trusted service providers necessary for platform operation (like hosting and analytics), and only under strict data protection agreements."
        }
      ]
    },
    {
      icon: <Users className="h-5 w-5 text-pink-400" />,
      title: "Support",
      color: "pink-400",
      faqs: [
        {
          question: "How can I contact support?",
          answer: "You can reach our support team via email at support@neurax.ai, through the in-app chat widget, or by submitting a ticket through your dashboard. We typically respond within 24 hours."
        },
        {
          question: "Do you offer phone support?",
          answer: "Phone support is available for Pro and Enterprise plan subscribers. Free and Basic plan users can access email and chat support."
        },
        {
          question: "Is there a knowledge base or documentation?",
          answer: "Yes, we have a comprehensive knowledge base with tutorials, guides, and best practices. You can access it from your dashboard or at docs.neurax.ai."
        },
        {
          question: "Do you offer training or onboarding?",
          answer: "We provide self-guided onboarding for all users, video tutorials for common tasks, and personalized onboarding sessions for Enterprise customers."
        }
      ]
    }
  ];

  const toggleItem = (categoryIndex: number, faqIndex: number) => {
    const itemId = categoryIndex * 1000 + faqIndex;
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(
      faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="container mx-auto p-4 pt-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="border-neonGreen text-neonGreen">
          Help Center
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-neonGreen to-cyberBlue bg-clip-text text-transparent">
          Frequently Asked Questions
        </h1>
        <p className="text-xl text-techWhite/80 max-w-3xl mx-auto leading-relaxed">
          Find answers to common questions about NeuraX's AI-powered social media management platform.
        </p>
      </div>

      {/* Search */}
      <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-techWhite/50" />
            <Input
              placeholder="Search frequently asked questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-cyberDark/50 border-neonGreen/30 text-techWhite placeholder:text-techWhite/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {filteredCategories.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-techWhite flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyberDark/50">
                  {category.icon}
                </div>
                {category.title}
                <Badge variant="outline" className={`border-${category.color} text-${category.color}`}>
                  {category.faqs.length} questions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.faqs.map((faq, faqIndex) => {
                const itemId = categoryIndex * 1000 + faqIndex;
                const isOpen = openItems.includes(itemId);
                
                return (
                  <div key={faqIndex} className="border border-neonGreen/20 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleItem(categoryIndex, faqIndex)}
                      className="w-full p-4 text-left bg-cyberDark/30 hover:bg-cyberDark/50 transition-colors duration-200 flex items-center justify-between"
                    >
                      <span className="font-medium text-techWhite pr-4">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-neonGreen flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-neonGreen flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-cyberDark/20 border-t border-neonGreen/20">
                        <p className="text-techWhite/80 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {searchTerm && filteredCategories.length === 0 && (
        <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
          <CardContent className="p-8 text-center">
            <HelpCircle className="h-12 w-12 text-techWhite/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-techWhite mb-2">No results found</h3>
            <p className="text-techWhite/70 mb-4">
              We couldn't find any questions matching "{searchTerm}". Try different keywords or browse our categories above.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-2 bg-gradient-to-r from-neonGreen to-cyberBlue hover:from-neonGreen/80 hover:to-cyberBlue/80 text-cyberDark font-semibold rounded-lg transition-all duration-200"
            >
              Clear Search
            </button>
          </CardContent>
        </Card>
      )}

      {/* Still Need Help */}
      <Card className="bg-gradient-to-r from-neonGreen/10 to-cyberBlue/10 border-neonGreen/30 backdrop-blur-lg">
        <CardContent className="p-8 text-center space-y-4">
          <HelpCircle className="h-12 w-12 text-neonGreen mx-auto" />
          <h3 className="text-2xl font-semibold text-neonGreen">Still Need Help?</h3>
          <p className="text-techWhite/80 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our support team is here to help you get the most out of NeuraX.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@neurax.ai" 
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-neonGreen to-cyberBlue hover:from-neonGreen/80 hover:to-cyberBlue/80 text-cyberDark font-semibold rounded-lg transition-all duration-200"
            >
              Contact Support
            </a>
            <a 
              href="/contact" 
              className="inline-flex items-center justify-center px-6 py-3 border border-neonGreen text-neonGreen hover:bg-neonGreen hover:text-cyberDark font-semibold rounded-lg transition-all duration-200"
            >
              Send Feedback
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}