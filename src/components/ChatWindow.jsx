import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatWindow({ chat, onSendMessage, currentUser }) {
  if (!chat) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <div className="text-xl mb-2">Welcome to WhatsApp Clone</div>
          <div>Select a chat to start messaging</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <ChatHeader 
        name={chat.name} 
        avatar={chat.avatar} 
        isGroup={chat.type === 'group'}
        participants={chat.participants || []}
      />
      <MessageList 
        messages={chat.messages} 
        isGroup={chat.type === 'group'}
        currentUser={currentUser}
      />
      <MessageInput onSend={onSendMessage} />
    </div>
  );
}