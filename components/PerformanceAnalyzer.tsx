
import React, { useState, useCallback } from 'react';
import { analyzePublicationPerformance } from '../services/geminiService';
import type { PerformanceAnalysis } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { LightBulbIcon } from './Icons';

const PerformanceAnalyzer: React.FC = () => {
    const [platform, setPlatform] = useState('YouTube');
    const [title, setTitle] = useState('');
    const [views, setViews] = useState('');
    const [likes, setLikes] = useState('');
    const [comments, setComments] = useState('');
    const [shares, setShares] = useState('');
    const [goal, setGoal] = useState('Zwiększenie zasięgu');
    
    const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !views || !likes || !comments) {
            setError('Proszę wypełnić wszystkie wymagane pola (tytuł, wyświetlenia, polubienia, komentarze).');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const result = await analyzePublicationPerformance(
                platform, 
                title, 
                Number(views), 
                Number(likes), 
                Number(comments), 
                Number(shares) || 0,
                goal
            );
            setAnalysis(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd.');
        } finally {
            setIsLoading(false);
        }
    }, [platform, title, views, likes, comments, shares, goal]);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Analiza Wyników Publikacji</h2>
                <p className="mt-4 text-lg text-gray-400">Wprowadź dane, aby otrzymać analizę i sugestie od AI.</p>
            </div>
            <div className="bg-base-200 p-6 rounded-2xl shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="platform" className="block text-sm font-medium text-gray-300 mb-2">Platforma</label>
                        <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none">
                            <option>YouTube</option>
                            <option>TikTok</option>
                            <option>Instagram</option>
                            <option>Facebook</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="post-title" className="block text-sm font-medium text-gray-300 mb-2">Tytuł lub Opis Publikacji</label>
                        <textarea id="post-title" rows={2} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="np. Mój przepis na idealną pizzę neapolitańską" required />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><label htmlFor="views" className="block text-sm font-medium text-gray-300 mb-2">Wyświetlenia</label><input type="number" id="views" value={views} onChange={e => setViews(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2" required /></div>
                        <div><label htmlFor="likes" className="block text-sm font-medium text-gray-300 mb-2">Polubienia</label><input type="number" id="likes" value={likes} onChange={e => setLikes(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2" required /></div>
                        <div><label htmlFor="comments" className="block text-sm font-medium text-gray-300 mb-2">Komentarze</label><input type="number" id="comments" value={comments} onChange={e => setComments(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2" required /></div>
                        <div><label htmlFor="shares" className="block text-sm font-medium text-gray-300 mb-2">Udostępnienia</label><input type="number" id="shares" value={shares} onChange={e => setShares(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2" /></div>
                    </div>
                     <div>
                        <label htmlFor="goal" className="block text-sm font-medium text-gray-300 mb-2">Główny Cel Publikacji</label>
                        <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none">
                            <option>Zwiększenie zasięgu</option>
                            <option>Generowanie zaangażowania</option>
                            <option>Konwersja/Sprzedaż</option>
                            <option>Budowanie społeczności</option>
                        </select>
                    </div>
                    <div className="pt-2">
                         <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-brand-primary text-base-100 font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? <LoadingSpinner /> : <LightBulbIcon className="w-5 h-5" />}
                            {isLoading ? 'Analizowanie...' : 'Analizuj Wyniki'}
                        </button>
                    </div>
                </form>
            </div>

            {error && <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">{error}</div>}
            
            {isLoading && <div className="mt-6 flex justify-center items-center gap-2 text-gray-300"><LoadingSpinner /> Przygotowywanie analizy...</div>}

            {analysis && (
                <div className="mt-8 space-y-6 bg-base-200 p-6 rounded-2xl shadow-lg animate-fade-in">
                    <div className="text-center border-b border-gray-700 pb-4">
                        <span className="inline-block bg-brand-primary/20 text-brand-light text-sm font-semibold px-4 py-1 rounded-full">{analysis.score}</span>
                        <p className="mt-3 text-lg text-gray-300">{analysis.summary}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-white mb-2">👍 Co poszło dobrze</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                                {analysis.positives.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-2">💡 Obszary do poprawy</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                                {analysis.improvements.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    </div>
                    <div>
                         <h4 className="font-bold text-white mb-2">🚀 Sugerowane działania</h4>
                         <ul className="space-y-2 text-gray-300 text-sm">
                            {analysis.suggestions.map((item, i) => (
                                <li key={i} className="p-2 bg-base-300 rounded-md">{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceAnalyzer;
