import React, { useState } from 'react';
import { Video, Download, Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
              <a href="#" className="text-slate-300 hover:text-white transition-colors duration-200">
                {t('header.nav.home')}
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors duration-200">
                {t('header.nav.library')}
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors duration-200">
                {t('header.nav.about')}
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
              <a
                 href="#"
                 className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors duration-200"
               >
                 {t('header.nav.home')}
               </a>
               <a
                 href="#"
                 className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors duration-200"
               >
                 {t('header.nav.library')}
               </a>
               <a
                 href="#"
                 className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors duration-200"
               >
                 {t('header.nav.about')}
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