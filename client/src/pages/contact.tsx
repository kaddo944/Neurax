import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Bug, Lightbulb } from 'lucide-react';

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  });

  const contactInfo = [
    {
      icon: <Mail className="h-5 w-5" />,
      label: "Email",
      value: "support@neurax.ai",
      link: "mailto:support@neurax.ai"
    },
    {
      icon: <Phone className="h-5 w-5" />,
      label: "Phone",
      value: "+1 (555) 123-4567",
      link: "tel:+15551234567"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      label: "Address",
      value: "123 Tech Street, San Francisco, CA 94105",
      link: null
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Business Hours",
      value: "Mon-Fri: 9AM-6PM PST",
      link: null
    }
  ];

  const categories = [
    { value: 'general', label: 'General Inquiry', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'support', label: 'Technical Support', icon: <Bug className="h-4 w-4" /> },
    { value: 'feature', label: 'Feature Request', icon: <Lightbulb className="h-4 w-4" /> },
    { value: 'business', label: 'Business Partnership', icon: <Mail className="h-4 w-4" /> }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Message Sent Successfully!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 pt-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="border-neonGreen text-neonGreen">
          Get in Touch
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-neonGreen to-cyberBlue bg-clip-text text-transparent">
          Contact Us
        </h1>
        <p className="text-xl text-techWhite/80 max-w-2xl mx-auto leading-relaxed">
          Have questions about NeuraX? Need technical support? Want to explore business partnerships? 
          We're here to help you succeed.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-neonGreen flex items-center gap-2">
                <Send className="h-6 w-6" />
                Send us a Message
              </CardTitle>
              <CardDescription className="text-techWhite/70">
                Fill out the form below and we'll respond as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-techWhite">Name *</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      required
                      className="bg-cyberDark/50 border-neonGreen/30 text-techWhite placeholder:text-techWhite/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-techWhite">Email *</label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      required
                      className="bg-cyberDark/50 border-neonGreen/30 text-techWhite placeholder:text-techWhite/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-techWhite">Category</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: category.value })}
                        className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center gap-2 text-sm ${
                          formData.category === category.value
                            ? 'border-neonGreen bg-neonGreen/10 text-neonGreen'
                            : 'border-neonGreen/30 text-techWhite/70 hover:border-neonGreen/50 hover:bg-cyberDark/30'
                        }`}
                      >
                        {category.icon}
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-techWhite">Subject *</label>
                  <Input
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of your inquiry"
                    required
                    className="bg-cyberDark/50 border-neonGreen/30 text-techWhite placeholder:text-techWhite/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-techWhite">Message *</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Please provide details about your inquiry..."
                    required
                    rows={6}
                    className="bg-cyberDark/50 border-neonGreen/30 text-techWhite placeholder:text-techWhite/50 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-neonGreen to-cyberBlue hover:from-neonGreen/80 hover:to-cyberBlue/80 text-cyberDark font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyberDark mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-xl text-neonGreen">Contact Information</CardTitle>
              <CardDescription className="text-techWhite/70">
                Reach out to us through any of these channels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-cyberDark/30 hover:bg-cyberDark/50 transition-colors">
                  <div className="text-neonGreen mt-1">
                    {info.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-techWhite mb-1">
                      {info.label}
                    </div>
                    {info.link ? (
                      <a 
                        href={info.link} 
                        className="text-sm text-cyberBlue hover:text-cyberBlue/80 transition-colors"
                      >
                        {info.value}
                      </a>
                    ) : (
                      <div className="text-sm text-techWhite/70">
                        {info.value}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-cyberDark/30 border-neonGreen/20 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-xl text-neonGreen">Quick Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-cyberDark/30">
                  <div className="text-sm font-medium text-techWhite mb-1">Documentation</div>
                  <div className="text-sm text-techWhite/70">Check our comprehensive guides and tutorials</div>
                </div>
                <div className="p-3 rounded-lg bg-cyberDark/30">
                  <div className="text-sm font-medium text-techWhite mb-1">FAQ</div>
                  <div className="text-sm text-techWhite/70">Find answers to commonly asked questions</div>
                </div>
                <div className="p-3 rounded-lg bg-cyberDark/30">
                  <div className="text-sm font-medium text-techWhite mb-1">Status Page</div>
                  <div className="text-sm text-techWhite/70">Check real-time system status and updates</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Response Time */}
      <Card className="bg-gradient-to-r from-neonGreen/10 to-cyberBlue/10 border-neonGreen/30 backdrop-blur-lg">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-neonGreen mb-2">Response Time</h3>
          <p className="text-techWhite/80">
            We typically respond to all inquiries within <span className="text-neonGreen font-semibold">24 hours</span> during business days. 
            For urgent technical issues, please include "URGENT" in your subject line.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}