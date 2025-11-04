
import React from 'react';
import VideoAssistant from './components/VideoAssistant';
import { LogoIcon } from './components/Icons';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      <header className="sticky top-0 z-10 bg-base-200/80 backdrop-blur-md shadow-lg">
        <nav className="container mx-auto px-4 py-3 flex justify-center items-center">
          <div className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-8 text-brand-primary" />
            <h1 className="text-xl font-bold text-white">Asystent Publikacji AI</h1>
          </div>
        </nav>
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
