import { Smile, Send, Paperclip } from 'lucide-react';
import { useState, useRef } from 'react';

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleTyping = (value) => {
    setText(value);
    
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      // In a real app, you'd send typing indicator to other users
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const sendMessage = () => {
    const trimmedText = text.trim();
    if (trimmedText) {
      onSend(trimmedText);
      setText('');
      setIsTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Focus back on input
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="p-4 border-t bg-white">
      <div className="flex items-end gap-3">
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Paperclip className="w-5 h-5" />
        </button>
        
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Smile className="w-5 h-5" />
        </button>
        
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              minHeight: '40px',
              maxHeight: '120px',
              overflowY: text.length > 100 ? 'auto' : 'hidden'
            }}
          />
        </div>
        
        <button 
          onClick={sendMessage}
          disabled={!text.trim()}
          className={`p-2 rounded-full transition-colors ${
            text.trim() 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}