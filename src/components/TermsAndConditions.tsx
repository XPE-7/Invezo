import React, { useState } from 'react';
import { AlertTriangle, CheckSquare, Square, BarChart2, Shield, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface TermsAndConditionsProps {
  onAccept: () => void;
}

export function TermsAndConditions({ onAccept }: TermsAndConditionsProps) {
  const [accepted, setAccepted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const handleAccept = () => {
    if (!accepted) {
      toast.error('Please accept the terms and conditions to continue');
      return;
    }
    onAccept();
  };

  const sections = [
    {
      title: 'Risk Warning',
      icon: AlertTriangle,
      content: 'Trading in financial instruments carries a high level of risk and may not be suitable for all investors. You should carefully consider whether trading is appropriate for you in light of your experience, objectives, financial resources, and other relevant circumstances.',
    },
    {
      title: 'Platform Features',
      icon: BarChart2,
      content: 'Our AI-powered platform provides advanced analytics and predictions based on historical data. While we strive for accuracy, these predictions are not guaranteed and should be used as one of many tools in your investment decision-making process.',
    },
    {
      title: 'Security',
      icon: Shield,
      content: 'We implement industry-standard security measures to protect your data and transactions. However, no system is completely secure, and you should always exercise caution when making investment decisions.',
    },
    {
      title: 'Market Risks',
      icon: TrendingUp,
      content: 'Financial markets are subject to various risks including but not limited to market volatility, economic factors, political events, and other unforeseen circumstances that can affect investment performance.',
    },
  ];

  const ActiveIcon = sections[activeSection].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8 bg-card p-8 rounded-2xl border border-border animate-slide-up">
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-3">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-destructive via-red-500 to-orange-500 text-transparent bg-clip-text">
              Important Disclaimer
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Before using Invezo's AI-powered stock analysis platform, please carefully review and acknowledge the following terms and conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {sections.map((section, index) => {
            const SectionIcon = section.icon;
            return (
              <button
                key={index}
                onClick={() => setActiveSection(index)}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  activeSection === index
                    ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg'
                    : 'border-border hover:border-primary/30 hover:bg-accent/50'
                }`}
              >
                <SectionIcon className={`h-8 w-8 mb-2 ${
                  activeSection === index ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <h3 className="font-semibold text-card-foreground">{section.title}</h3>
              </button>
            );
          })}
        </div>

        <div className="bg-accent/30 rounded-xl p-6 min-h-[200px] transition-all duration-300">
          <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center">
            <ActiveIcon className="h-6 w-6 mr-2 text-primary" />
            {sections[activeSection].title}
          </h2>
          <p className="text-card-foreground leading-relaxed">{sections[activeSection].content}</p>
        </div>

        <div className="space-y-6">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-destructive mb-2">Key Risk Points:</h3>
            <ul className="list-disc pl-6 space-y-2 text-card-foreground">
              <li>Past performance does not guarantee future results</li>
              <li>Investment value can decrease as well as increase</li>
              <li>AI predictions are based on historical data and may not accurately predict future movements</li>
              <li>Never invest more than you can afford to lose</li>
              <li>Consider seeking independent financial advice before making investment decisions</li>
            </ul>
          </div>

          <button
            onClick={() => setAccepted(!accepted)}
            className="flex items-center space-x-3 text-sm text-card-foreground hover:text-primary transition-all duration-300 group"
          >
            {accepted ? (
              <CheckSquare className="h-5 w-5 text-primary" />
            ) : (
              <Square className="h-5 w-5 group-hover:text-primary" />
            )}
            <span className="group-hover:text-primary">
              I understand and accept all risks involved in using Invezo's platform
            </span>
          </button>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handleAccept}
            disabled={!accepted}
            className="px-6 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] flex items-center space-x-2"
          >
            <span>Continue to Platform</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}