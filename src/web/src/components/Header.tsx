import React from 'react';
import { Video, Download } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Video Wallet</h1>
              <p className="text-xs text-slate-400">Video Library Made Simple</p>
            </div>
          </div>
          <nav className="flex items-center space-x-6">
            <a href="#" className="text-slate-300 hover:text-white transition-colors duration-200">
              Home
            </a>
            <a href="#" className="text-slate-300 hover:text-white transition-colors duration-200">
              Library
            </a>
            <a href="#" className="text-slate-300 hover:text-white transition-colors duration-200">
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;