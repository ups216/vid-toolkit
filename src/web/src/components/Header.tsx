import React, { useState } from 'react';
import { Video, Menu, X, Github } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  currentPage?: 'home' | 'library';
  onNavigate?: (page: 'home' | 'library') => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage = 'home', onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (page: 'home' | 'library') => {
    if (onNavigate) {
      onNavigate(page);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t('header.title')}</h1>
              <p className="text-xs text-slate-400">{t('header.subtitle')}</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex items-center space-x-6">
              <button 
                onClick={() => handleNavigation('home')}
                className={`transition-colors duration-200 ${
                  currentPage === 'home' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t('header.nav.home')}
              </button>
              <button 
                onClick={() => handleNavigation('library')}
                className={`transition-colors duration-200 ${
                  currentPage === 'library' 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t('header.nav.library')}
              </button>
              <a href="#" className="text-slate-300 hover:text-white transition-colors duration-200">
                {t('header.nav.about')}
              </a>
              <a 
                href="https://github.com/ups216/video-wallet" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white transition-colors duration-200 p-2 hover:bg-slate-800/50 rounded-lg"
                aria-label="GitHub Repository"
              >
                <Github className="h-5 w-5" />
              </a>
            </nav>
            <LanguageSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-slate-300 hover:text-white transition-colors duration-200 p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700/50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => handleNavigation('home')}
                className={`block w-full text-left px-3 py-2 rounded-md transition-colors duration-200 ${
                  currentPage === 'home' 
                    ? 'text-blue-400 bg-slate-800/50' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {t('header.nav.home')}
              </button>
              <button
                onClick={() => handleNavigation('library')}
                className={`block w-full text-left px-3 py-2 rounded-md transition-colors duration-200 ${
                  currentPage === 'library' 
                    ? 'text-blue-400 bg-slate-800/50' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {t('header.nav.library')}
              </button>
              <a
                href="#"
                className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors duration-200"
              >
                {t('header.nav.about')}
              </a>
              <a 
                href="https://github.com/ups216/video-wallet" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors duration-200"
              >
                <Github className="h-5 w-5" />
                <span>GitHub</span>
              </a>
              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;