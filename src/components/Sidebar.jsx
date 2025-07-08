import { useState } from "react";
import { Search, LogOut, Settings } from "lucide-react";

export default function Sidebar({ chats, activeChatId, onSelectChat, user, onLogout }) {
  const [searchText, setSearchText] = useState("");

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getLastMessage = (chat) => {
    if (chat.messages && chat.messages.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      return lastMsg.text.length > 30 ? lastMsg.text.substring(0, 30) + "..." : lastMsg.text;
    }
    return "No messages yet";
  };

  const getLastMessageTime = (chat) => {
    if (chat.messages && chat.messages.length > 0) {
      return chat.messages[chat.messages.length - 1].time;
    }
    return "";
  };

  return (
    <div className="w-1/3 max-w-sm border-r bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-green-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={user?.avatar || "https://i.pravatar.cc/150?img=0"} 
              className="w-10 h-10 rounded-full mr-3" 
              alt="Profile" 
            />
            <div>
              <div className="font-semibold">{user?.name || "User"}</div>
              <div className="text-xs text-green-100">Online</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-green-700 rounded">
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-green-700 rounded"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Search chats..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="text-center text-sm text-gray-500 p-8">
            {searchText ? "No chats found" : "No chats available"}
          </div>
        ) : (
          filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                chat.id === activeChatId ? 'bg-green-50 border-r-4 border-green-500' : ''
              }`}
            >
              <div className="relative">
                <img 
                  src={chat.avatar} 
                  className="w-12 h-12 rounded-full mr-3" 
                  alt={chat.name} 
                />
                {chat.type === 'group' && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">G</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-gray-900 truncate">
                    {chat.name}
                  </div>
                  <div className="text-xs text-gray-500 ml-2">
                    {getLastMessageTime(chat)}
                  </div>
                </div>
                <div className="text-sm text-gray-600 truncate mt-1">
                  {getLastMessage(chat)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}