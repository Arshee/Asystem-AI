
import React, { useState } from 'react';
import VideoAssistant from './components/VideoAssistant';
import Chatbot from './components/Chatbot';
import ImageAnalyzer from './components/ImageAnalyzer';
import { VideoIcon, ChatIcon, ImageIcon, LogoIcon } from './components/Icons';

type View = 'video' | 'chat' | 'image';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('video');

  const renderView = () => {
    switch (activeView) {
      case 'video':
        return <VideoAssistant />;
      case 'chat':
        return <Chatbot />;
      case 'image':
        return <ImageAnalyzer />;
      default:
        return <VideoAssistant />;
    }
  };
  
  const NavButton: React.FC<{ view: View; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
        activeView === view 
        ? 'bg-brand-primary text-base-100 font-semibold shadow-[0_0_15px_rgba(8,217,214,0.5)]' 
        : 'hover:bg-base-200 text-base-content'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      <header className="sticky top-0 z-10 bg-base-200/80 backdrop-blur-md shadow-lg">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-8 text-brand-primary" />
            <h1 className="text-xl font-bold text-white hidden md:block">Asystent Publikacji AI</h1>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 bg-base-300 p-1 rounded-xl">
            <NavButton view="video" label="Asystent Wideo" icon={<VideoIcon className="h-5 w-5" />} />
            <NavButton view="chat" label="Chatbot" icon={<ChatIcon className="h-5 w-5" />} />
            <NavButton view="image" label="Analizator Obrazu" icon={<ImageIcon className="h-5 w-5" />} />
          </div>
        </nav>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        {renderView()}
      </main>
      
      <footer className="text-center py-4 mt-8 text-sm text-gray-500">
        <p>Stworzone z pasją przy użyciu Gemini API</p>
      </footer>
    </div>
  );
};

export default App;