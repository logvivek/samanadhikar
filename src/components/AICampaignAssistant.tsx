import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  User, 
  HelpCircle, 
  Flame, 
  Heart,
  RefreshCw
} from "lucide-react";

interface AICampaignAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onDonateClick: () => void;
}

export const AICampaignAssistant: React.FC<AICampaignAssistantProps> = ({
  isOpen,
  onClose,
  initialQuery = "",
  onDonateClick
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "bot",
      text: "जय श्री राम! मैं समान अधिकार पार्टी का आधिकारिक एआई प्रवक्ता हूँ। राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी के मुख्य 5 संकल्पों (आरक्षण खात्मा, हिंदू राष्ट्र, जनसंख्या कानून, गुरुकुल शिक्षा, गौमाता राष्ट्रमाता) के बारे में आप कोई भी प्रश्न पूछ सकते हैं।",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "आरक्षण प्रणाली खत्म करने का पार्टी का क्या खाका है?",
    "भारत को हिंदू राष्ट्र बनाने हेतु क्या कदम उठाए जाएंगे?",
    "जनसंख्या नियंत्रण कानून क्यों और कैसे लागू होगा?",
    "हर जिले में गुरुकुल स्कूल खोलने की क्या योजना है?",
    "गौमाता को राष्ट्रमाता घोषित करने हेतु पार्टी का रुख?"
  ];

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    try {
      const historyForApi = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          history: historyForApi
        })
      });

      const data = await res.json();

      const botReplyText = data.reply || "समान अधिकार पार्टी देश में जाति आधारित आरक्षण समाप्त कर आर्थिक आधार व योग्यता को प्राथमिकता देने तथा भारत को हिंदू राष्ट्र घोषित करने के लिए संकल्पबद्ध है।";

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: "समान अधिकार पार्टी का लक्ष्य आरक्षण प्रणाली समाप्त करना, जनसंख्या नियंत्रण कानून लागू करना, गुरुकुल शिक्षा व्यवस्था स्थापित करना एवं गौमाता को राष्ट्रमाता घोषित करना है।",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-orange-300 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] h-[600px] my-auto flex flex-col shadow-2xl relative overflow-hidden text-left">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 border-b border-orange-400 flex items-center justify-between shrink-0 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-md flex items-center justify-center">
              <Bot className="w-6 h-6 text-orange-600" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-white text-base">समान अधिकार पार्टी एआई सहायक</h3>
                <span className="text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded shadow-sm">
                  Gemini 3.6
                </span>
              </div>
              <p className="text-xs text-orange-100 font-bold">राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी के संकल्पों पर प्रश्न पूछें</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Chips */}
        <div className="p-3 bg-orange-50/80 border-b border-orange-200 flex items-center space-x-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[11px] font-black text-orange-950 uppercase tracking-wider shrink-0 pl-1">
            सुझाव:
          </span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-3 py-1 rounded-full bg-white hover:bg-orange-100 border border-orange-200 text-xs text-orange-950 font-bold shrink-0 transition-colors whitespace-nowrap shadow-sm cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Thread */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-orange-50/20">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? "bg-orange-500 text-white font-bold shadow-sm"
                      : "bg-orange-100 text-orange-700 border border-orange-300 shadow-sm"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-orange-500 text-white font-bold rounded-tr-none shadow-sm"
                      : "bg-white border border-orange-200 text-slate-900 font-medium rounded-tl-none space-y-2 shadow-sm"
                  }`}
                >
                  <div className="space-y-1.5 whitespace-pre-wrap">
                    {msg.text.split("\n").map((line, lIdx) => {
                      if (!line.trim()) return <div key={lIdx} className="h-1.5" />;

                      // Parse **bold** parts in line
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={lIdx} className="leading-relaxed">
                          {parts.map((part, pIdx) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return (
                                <strong key={pIdx} className={isUser ? "text-white font-extrabold" : "text-orange-950 font-bold"}>
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            return <span key={pIdx}>{part}</span>;
                          })}
                        </p>
                      );
                    })}
                  </div>

                  {!isUser && (msg.text.includes("दान") || msg.text.includes("सहयोग") || msg.text.includes("Donation")) && (
                    <div className="pt-2 border-t border-orange-100 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          onClose();
                          onDonateClick();
                        }}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 fill-white text-white" />
                        <span>ऑनलाइन दान करें (Online Donation)</span>
                      </button>
                    </div>
                  )}
                  <div className={`text-[10px] text-right pt-1 ${isUser ? "text-orange-100 font-bold" : "text-slate-500"}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center space-x-3 text-orange-700 text-xs py-2 font-bold">
              <Bot className="w-5 h-5 text-orange-600 animate-pulse" />
              <span>समान अधिकार पार्टी एआई उत्तर तैयार कर रहा है...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input Bar */}
        <div className="p-4 bg-white border-t border-orange-200 space-y-3 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="आरक्षण, हिंदू राष्ट्र, गुरुकुल या गौमाता संकल्प पर प्रश्न पूछें..."
              className="flex-1 px-4 py-3 bg-orange-50/50 border border-orange-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
            />

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold px-1">
            <span>समान अधिकार पार्टी - Powered by Gemini AI</span>
            <button
              onClick={onDonateClick}
              className="text-orange-600 hover:underline font-black flex items-center space-x-1 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-orange-600 text-orange-600" />
              <span>अभियान हेतु सहयोग दें</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
