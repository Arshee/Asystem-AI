
import React, { useState } from 'react';
import VideoAssistant from './components/VideoAssistant';
import { LogoIcon } from './components/Icons';

type ActiveView = 'assistant';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('assistant');

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      <header className="sticky top-0 z-10 bg-base-200/80 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveView('assistant')}>
            <LogoIcon className="h-8 w-8 text-brand-primary" />
            <h1 className="text-xl font-bold text-white">Asystent Publikacji AI</h1>
          </div>
          {/* Navigation removed as there is only one view now */}
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <VideoAssistant />
      </main>
      
      <footer className="text-center py-4 mt-8 text-sm text-gray-500">
        <p>Stworzone z pasją przy użyciu Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
