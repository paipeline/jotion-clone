"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAICompletion } from '@/components/ai';

export default function AIPromptPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initialPrompt = searchParams.get('initialPrompt');
    if (initialPrompt) {
      setPrompt(decodeURIComponent(initialPrompt));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const completion = await getAICompletion(prompt);
      setResponse(completion || 'No response received');
    } catch (error) {
      console.error('Error getting AI completion:', error);
      setResponse('Error occurred while getting AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleUseResponse = () => {
    // 这里我们需要一种方式来将响应传回编辑器
    // 一个简单的方法是使用 localStorage
    localStorage.setItem('aiCompletion', response);
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-[#1F1F1F]">
      <div className="max-w-4xl mx-auto p-6 sm:p-8">
        {/* 添加返回按钮 */}
        <button
          onClick={handleBack}
          className="mb-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          &larr; Back to Editor
        </button>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            AI Prompt
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter your prompt below and get AI-generated completions
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Prompt Input Section */}
          <div className="bg-white dark:bg-[#2F2F2F] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-4">
                {/* Textarea */}
                <div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type your prompt here..."
                    className="w-full min-h-[120px] px-3 py-2 text-gray-800 dark:text-gray-200 bg-transparent border-0 focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                    style={{ outline: 'none' }}
                  />
                </div>
                
                {/* Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium transition-colors duration-150 ease-in-out"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Generate Response'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Response Section */}
          {response && (
            <div className="bg-white dark:bg-[#2F2F2F] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    AI Response
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{response}</p>
                </div>
              </div>
            </div>
          )}
          {/* 在响应部分添加"使用此响应"按钮 */}
          {response && (
            <div className="mt-4">
              <button
                onClick={handleUseResponse}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Use this Response
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}