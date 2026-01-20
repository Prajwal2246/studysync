import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Search, Bot, User as UserIcon, Loader2, Link2, ExternalLink } from 'lucide-react';
import { ChatMessage, AIMode, GroundingChunk } from '../types';
import { generateGeminiResponse } from '../services/geminiService';

interface ChatPanelProps {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  userLocation: GeolocationCoordinates | undefined;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, addMessage, userLocation }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AIMode>('search');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      senderName: 'You',
      text: inputText,
      timestamp: Date.now()
    };
    addMessage(userMsg);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await generateGeminiResponse(messages, userMsg.text, mode, userLocation);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        senderName: 'Gemini',
        text: response.text,
        timestamp: Date.now(),
        groundingMetadata: response.groundingMetadata,
        isMapResponse: mode === 'maps'
      };
      addMessage(aiMsg);
    } catch (error) {
      console.error("Failed to generate response", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderGroundingSource = (chunk: GroundingChunk, index: number) => {
    if (chunk.web) {
      return (
        <a 
          key={index} 
          href={chunk.web.uri} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-md border border-gray-700 text-xs transition-colors mb-2"
        >
          <div className="bg-blue-900/50 p-1.5 rounded-full text-blue-400">
             <Link2 size={12} />
          </div>
          <div className="flex-1 min-w-0">
             <div className="font-medium text-blue-200 truncate">{chunk.web.title}</div>
             <div className="text-gray-500 truncate text-[10px]">{new URL(chunk.web.uri).hostname}</div>
          </div>
          <ExternalLink size={12} className="text-gray-500" />
        </a>
      );
    }
    
    if (chunk.maps) {
      return (
        <a 
          key={index} 
          href={chunk.maps.uri} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-3 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 text-xs transition-colors mb-2 group"
        >
          <div className="flex items-start gap-3">
             <div className="bg-green-900/30 p-2 rounded-full text-green-400 group-hover:bg-green-900/50 transition-colors">
               <MapPin size={16} />
             </div>
             <div className="flex-1">
                <div className="font-bold text-green-100 text-sm">{chunk.maps.title}</div>
                {chunk.maps.placeAnswerSources?.[0]?.reviewSnippets?.[0] && (
                   <div className="mt-1 text-gray-400 italic">
                      "{chunk.maps.placeAnswerSources[0].reviewSnippets[0].content}"
                   </div>
                )}
             </div>
          </div>
        </a>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
        <h2 className="font-semibold text-white">Meeting Chat</h2>
        <div className="flex bg-gray-800 p-0.5 rounded-lg border border-gray-700">
          <button
            onClick={() => setMode('search')}
            className={`p-1.5 rounded-md transition-all ${mode === 'search' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            title="Search with Gemini 3 Flash"
          >
            <Search size={16} />
          </button>
          <button
            onClick={() => setMode('maps')}
            className={`p-1.5 rounded-md transition-all ${mode === 'maps' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            title="Maps with Gemini 2.5 Flash"
          >
            <MapPin size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1">
              {msg.sender === 'ai' && <Bot size={14} className="text-blue-400" />}
              <span className="text-xs text-gray-400">{msg.senderName}</span>
              <span className="text-[10px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
            </div>

            {/* Grounding Sources */}
            {msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
              <div className="mt-2 max-w-[85%] w-full">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5 ml-1">Sources</div>
                <div className="grid grid-cols-1 gap-1">
                  {msg.groundingMetadata.groundingChunks.map((chunk, idx) => renderGroundingSource(chunk, idx))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-2">
            <Bot size={14} className="text-blue-400 mt-1" />
            <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 border border-gray-700">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'search' ? "Ask Gemini to search..." : "Ask for a location..."}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-inner"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="text-[10px] text-gray-500 mt-2 text-center">
          Using {mode === 'search' ? 'gemini-3-flash-preview (Search)' : 'gemini-2.5-flash (Maps)'}
        </div>
      </div>
    </div>
  );
};
