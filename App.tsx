
import React, { useState } from 'react';
import VideoAssistant from './components/VideoAssistant';
import PerformanceAnalyzer from './components/PerformanceAnalyzer';
import { LogoIcon } from './components/Icons';

type ActiveView = 'assistant' | 'analyzer';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('assistant');

  const renderView = () => {
    switch (activeView) {
      case 'assistant':
        return <VideoAssistant />;
      case 'analyzer':
        return <PerformanceAnalyzer />;
      default:
        return <VideoAssistant />;
    }
  };

  const HeaderLink: React.FC<{ view: ActiveView; label: string }> = ({ view, label }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        activeView === view
          ? 'bg-brand-primary text-base-100'
          : 'text-gray-300 hover:bg-base-300 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      <header className="sticky top-0 z-10 bg-base-200/80 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveView('assistant')}>
            <LogoIcon className="h-8 w-8 text-brand-primary" />
            <h1 className="text-xl font-bold text-white">Asystent Publikacji AI</h1>
          </div>
          <nav className="flex items-center space-x-2 md:space-x-4">
             <HeaderLink view="assistant" label="Asystent Wideo" />
             <HeaderLink view="analyzer" label="Analiza Wyników" />
          </nav>
        </div>
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
