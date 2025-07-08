import { Video, Phone, MoreVertical, ArrowLeft } from 'lucide-react';

export default function ChatHeader({ name, avatar, isGroup, participants = [], onBack }) {
  const getStatusText = () => {
    if (isGroup) {
      return `${participants.length} participants`;
    }
    return "Online"; // In a real app, you'd track actual online status
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
      <div className="flex items-center">
        {onBack && (
          <button 
            onClick={onBack}
            className="mr-3 p-1 hover:bg-gray-100 rounded md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        <div className="relative">
          <img 
            src={avatar} 
            className="w-10 h-10 rounded-full mr-3" 
            alt={name} 
          />
          {isGroup && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">G</span>
            </div>
          )}
        </div>
        
        <div>
          <div className="font-semibold text-gray-900">
            {name}
          </div>
          <div className="text-xs text-green-600">
            {getStatusText()}
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 text-gray-500">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Video className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Phone className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}