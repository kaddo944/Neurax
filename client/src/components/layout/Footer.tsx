import React from 'react';
import { Link } from 'wouter';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neonGreen/20 p-4 md:p-6 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="text-xs text-techWhite/50 mb-4 md:mb-0">
          <p>&copy; {new Date().getFullYear()} NeuraX - AI-Powered Social Media Manager</p>
          <p className="mt-1">
            Version 1.0.3 | <span className="text-neonGreen">SYSTEM ONLINE</span>
          </p>
          <div className="flex gap-4 mt-2">
            <Link href="/privacy">
              <span className="text-techWhite/60 hover:text-neonGreen transition-colors cursor-pointer">
                Privacy
              </span>
            </Link>
            <Link href="/terms">
              <span className="text-techWhite/60 hover:text-neonGreen transition-colors cursor-pointer">
                Terms
              </span>
            </Link>
            <Link href="/about">
              <span className="text-techWhite/60 hover:text-neonGreen transition-colors cursor-pointer">
                About
              </span>
            </Link>
          </div>
        </div>
        <div className="flex gap-4">
          <Link href="/privacy">
            <span className="text-matrixGreen hover:text-neonGreen transition-colors text-sm cursor-pointer" title="Privacy Policy">
              <i className="fas fa-shield-alt"></i>
            </span>
          </Link>
          <Link href="/faq">
            <span className="text-matrixGreen hover:text-neonGreen transition-colors text-sm cursor-pointer" title="FAQ">
              <i className="fas fa-question-circle"></i>
            </span>
          </Link>
          <Link href="/about">
            <span className="text-matrixGreen hover:text-neonGreen transition-colors text-sm cursor-pointer" title="About">
              <i className="fas fa-code"></i>
            </span>
          </Link>
          <Link href="/contact">
            <span className="text-matrixGreen hover:text-neonGreen transition-colors text-sm cursor-pointer" title="Contact Us">
              <i className="fas fa-envelope"></i>
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
