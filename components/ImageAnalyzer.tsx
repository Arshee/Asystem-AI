
import React, { useState, useCallback } from 'react';
import { analyzeImage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { UploadIcon, LightBulbIcon } from './Icons';

const ImageAnalyzer: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('Co widzisz na tym obrazie? Opisz go szczegółowo.');
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setAnalysis(null);
            setError(null);
        }
    };

    const handleAnalyzeClick = useCallback(async () => {
        if (!imageFile || !prompt) {
            setError('Proszę dodać obraz i wpisać zapytanie.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const result = await analyzeImage(prompt, imageFile);
            setAnalysis(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd.');
        } finally {
            setIsLoading(false);
        }
    }, [imageFile, prompt]);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Analizator Obrazu</h2>
                <p className="mt-4 text-lg text-gray-400">Prześlij obraz i zadaj pytanie, aby uzyskać analizę od Gemini.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="bg-base-200 p-6 rounded-2xl shadow-lg space-y-6">
                     <div>
                        <label htmlFor="image-upload" className="block text-sm font-medium text-gray-300 mb-2">Plik Obrazu</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Podgląd" className="max-h-48 mx-auto rounded-md" />
                                ) : (
                                   <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                )}
                                <div className="flex text-sm text-gray-400">
                                    <label htmlFor="image-upload" className="relative cursor-pointer bg-base-300 rounded-md font-medium text-brand-light hover:text-brand-primary p-1">
                                        <span>Wybierz plik</span>
                                        <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">lub przeciągnij i upuść</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF do 10MB</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Twoje zapytanie</label>
                        <textarea
                            id="prompt"
                            rows={3}
                            className="w-full bg-base-300 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleAnalyzeClick}
                        disabled={isLoading || !imageFile}
                        className="w-full flex justify-center items-center gap-2 bg-brand-primary text-base-100 font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <LoadingSpinner /> : <LightBulbIcon className="w-5 h-5"/>}
                        {isLoading ? 'Analizowanie...' : 'Analizuj Obraz'}
                    </button>
                </div>
                <div className="bg-base-200 p-6 rounded-2xl shadow-lg min-h-[300px]">
                     <h3 className="text-xl font-bold text-white mb-4">Wynik Analizy</h3>
                     {isLoading && (
                        <div className="flex justify-center items-center h-full">
                           <LoadingSpinner/>
                        </div>
                     )}
                     {error && (
                         <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                             {error}
                         </div>
                     )}
                     {analysis && (
                         <p className="whitespace-pre-wrap text-base-content">{analysis}</p>
                     )}
                     {!isLoading && !analysis && !error && (
                        <div className="text-center text-gray-500 pt-10">
                            <p>Wyniki pojawią się tutaj po zakończeniu analizy.</p>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default ImageAnalyzer;