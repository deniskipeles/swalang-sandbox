import React, { useState, useRef, useEffect, useCallback } from 'react';
import { startSwalangChat } from '../services/geminiService';
import type { ChatMessage } from '../types';
import type { Chat } from '@google/genai';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Karibu! Welcome! Ask me anything about the Swalang community." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      chatRef.current = startSwalangChat();
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I couldn't connect to the AI service. Please check the API key." }]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await chatRef.current.sendMessageStream({ message: input });
      
      let newModelMessage = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        newModelMessage += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = newModelMessage;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Oops! Something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl max-w-2xl mx-auto flex flex-col h-[60vh] shadow-lg dark:shadow-2xl dark:shadow-slate-950/50">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center space-x-3">
        <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse"></div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Swalang Community Helper</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-sky-500 dark:bg-sky-600 text-white rounded-br-lg'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-lg'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1].role === 'user' && (
           <div className="flex justify-start">
             <div className="max-w-lg px-4 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-bl-lg">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce"></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about our community..."
          disabled={isLoading}
          className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent transition-all disabled:opacity-50 text-slate-900 dark:text-white"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-all"
        >
         {isLoading ? 
            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> :
            <i className="fa-solid fa-paper-plane"></i>
         }
        </button>
      </div>
    </div>
  );
};

export default Chatbot;