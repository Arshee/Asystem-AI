import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { generateAiResponse } from '../services/openaiService';
import { LoadingSpinner } from './LoadingSpinner';
import { SendIcon, UserIcon, SparklesIcon } from './Icons';

const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatInstanceRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const responseText = await generateAiResponse(input);
    const modelMessage: ChatMessage = { role: 'model', parts: [{ text: responseText }] };
    setMessages(prev => [...prev, modelMessage]);

        setInput('');
        setIsLoading(true);

        try {
            if (!chatInstanceRef.current) {
                chatInstanceRef.current = getChatInstance();
            }
            // FIX: The `sendMessage` method expects an object with a `message` property, not a raw string.
            const response = await chatInstanceRef.current.sendMessage({ message: input });
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error(error);
            const errorMessageText = error instanceof Error ? error.message : "Przepraszam, wystąpił błąd. Spróbuj ponownie.";
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: errorMessageText }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto flex flex-col h-[75vh] animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Chat z AI</h2>
                <p className="mt-2 text-lg text-gray-400">Zadaj pytanie, a Gemini odpowie.</p>
            </div>
            <div className="flex-grow bg-base-200 rounded-2xl shadow-lg p-4 flex flex-col overflow-hidden">
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                                    <SparklesIcon className="w-5 h-5 text-base-100" />
                                </div>
                            )}
                            <div className={`max-w-md md:max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-primary text-base-100 rounded-br-none' : 'bg-base-300 text-base-content rounded-bl-none'}`}>
                                <p className="text-sm">{msg.parts[0].text}</p>
                            </div>
                             {msg.role === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-base-300 flex items-center justify-center">
                                    <UserIcon className="w-5 h-5 text-base-content" />
                                </div>
                            )}
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5 text-base-100" />
                            </div>
                            <div className="max-w-md md:max-w-lg p-3 rounded-2xl bg-base-300 text-base-content rounded-bl-none">
                               <LoadingSpinner/>
                            </div>
                        </div>
                     )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="mt-4 flex-shrink-0">
                    <div className="flex items-center bg-base-300 rounded-full p-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Napisz wiadomość..."
                            className="w-full bg-transparent px-3 py-1 focus:outline-none text-base-content"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="p-2 rounded-full bg-brand-primary text-base-100 hover:bg-brand-secondary transition-colors disabled:bg-base-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                           <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
