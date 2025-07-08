import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, isGroup, currentUser }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">👋</div>
          <div>No messages yet</div>
          <div className="text-sm">Start a conversation!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="space-y-1">
        {messages.map((msg, index) => (
          <MessageBubble
            key={index}
            text={msg.text}
            time={msg.time}
            isSender={msg.sender === 'Me'}
            sender={msg.sender}
            isGroup={isGroup}
            messageStatus={msg.sender === 'Me' ? 'delivered' : undefined}
          />
        ))}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}