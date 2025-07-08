import { Check, CheckCheck } from 'lucide-react';

export default function MessageBubble({ text, time, isSender, sender, isGroup, messageStatus = 'sent' }) {
  const renderMessageStatus = () => {
    if (!isSender) return null;
    
    return (
      <div className="inline-flex ml-1">
        {messageStatus === 'sent' && <Check className="w-3 h-3 text-gray-400" />}
        {messageStatus === 'delivered' && <CheckCheck className="w-3 h-3 text-gray-400" />}
        {messageStatus === 'read' && <CheckCheck className="w-3 h-3 text-blue-500" />}
      </div>
    );
  };

  return (
    <div className={`flex mb-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isSender 
          ? 'bg-green-500 text-white rounded-br-none' 
          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
      }`}>
        {isGroup && !isSender && (
          <div className="text-xs font-semibold text-blue-600 mb-1">
            {sender}
          </div>
        )}
        
        <div className="text-sm leading-relaxed">
          {text}
        </div>
        
        <div className={`flex items-center justify-end mt-1 text-xs ${
          isSender ? 'text-green-100' : 'text-gray-500'
        }`}>
          <span>{time}</span>
          {renderMessageStatus()}
        </div>
      </div>
    </div>
  );
}