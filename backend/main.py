from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
import uuid
from datetime import datetime
import asyncio

app = FastAPI(title="WhatsApp Clone API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class User(BaseModel):
    id: str
    name: str
    email: str
    avatar: str
    is_online: bool = False

class Message(BaseModel):
    id: str
    chat_id: str
    sender_id: str
    sender_name: str
    text: str
    timestamp: str
    message_type: str = "text"

class Chat(BaseModel):
    id: str
    name: str
    type: str  # "private" or "group"
    participants: List[str]
    avatar: str
    last_message: Optional[Message] = None
    created_at: str

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

# In-memory storage (in production, use a proper database)
users: Dict[str, User] = {}
chats: Dict[str, Chat] = {}
messages: Dict[str, List[Message]] = {}
active_connections: Dict[str, WebSocket] = {}
user_sessions: Dict[str, str] = {}  # websocket_id -> user_id

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, str] = {}  # user_id -> connection_id

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        connection_id = str(uuid.uuid4())
        self.active_connections[connection_id] = websocket
        self.user_connections[user_id] = connection_id
        
        # Update user online status
        if user_id in users:
            users[user_id].is_online = True
        
        return connection_id

    def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            # Find user_id for this connection
            user_id = None
            for uid, cid in self.user_connections.items():
                if cid == connection_id:
                    user_id = uid
                    break
            
            # Update user offline status
            if user_id and user_id in users:
                users[user_id].is_online = False
            
            # Remove connection
            del self.active_connections[connection_id]
            if user_id:
                del self.user_connections[user_id]

    async def send_personal_message(self, message: str, connection_id: str):
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            await websocket.send_text(message)

    async def send_to_user(self, message: str, user_id: str):
        if user_id in self.user_connections:
            connection_id = self.user_connections[user_id]
            await self.send_personal_message(message, connection_id)

    async def broadcast_to_chat(self, message: str, chat_id: str):
        if chat_id in chats:
            chat = chats[chat_id]
            for participant_id in chat.participants:
                await self.send_to_user(message, participant_id)

manager = ConnectionManager()

# Initialize some sample data
def init_sample_data():
    # Create sample users
    user1 = User(
        id="user1",
        name="Alice Johnson",
        email="alice@example.com",
        avatar="https://i.pravatar.cc/150?img=1"
    )
    user2 = User(
        id="user2",
        name="Bob Smith",
        email="bob@example.com",
        avatar="https://i.pravatar.cc/150?img=2"
    )
    user3 = User(
        id="user3",
        name="Charlie Brown",
        email="charlie@example.com",
        avatar="https://i.pravatar.cc/150?img=3"
    )
    
    users["user1"] = user1
    users["user2"] = user2
    users["user3"] = user3
    
    # Create sample chats
    chat1 = Chat(
        id="chat1",
        name="Alice Johnson",
        type="private",
        participants=["user1", "user2"],
        avatar="https://i.pravatar.cc/150?img=1",
        created_at=datetime.now().isoformat()
    )
    
    chat2 = Chat(
        id="chat2",
        name="Team Project",
        type="group",
        participants=["user1", "user2", "user3"],
        avatar="https://i.pravatar.cc/150?img=5",
        created_at=datetime.now().isoformat()
    )
    
    chats["chat1"] = chat1
    chats["chat2"] = chat2
    
    # Create sample messages
    messages["chat1"] = [
        Message(
            id="msg1",
            chat_id="chat1",
            sender_id="user1",
            sender_name="Alice Johnson",
            text="Hey there! How are you doing?",
            timestamp=datetime.now().isoformat()
        )
    ]
    
    messages["chat2"] = [
        Message(
            id="msg2",
            chat_id="chat2",
            sender_id="user1",
            sender_name="Alice Johnson",
            text="Let's start the project meeting!",
            timestamp=datetime.now().isoformat()
        )
    ]

# Initialize sample data on startup
init_sample_data()

# Authentication endpoints
@app.post("/api/auth/login")
async def login(request: LoginRequest):
    # Simple authentication (in production, use proper password hashing)
    user = None
    for u in users.values():
        if u.email == request.email:
            user = u
            break
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "user": user.dict(),
        "token": f"token_{user.id}"  # Simple token (use JWT in production)
    }

@app.post("/api/auth/signup")
async def signup(request: SignupRequest):
    # Check if user already exists
    for u in users.values():
        if u.email == request.email:
            raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        name=request.name,
        email=request.email,
        avatar=f"https://i.pravatar.cc/150?img={len(users) + 1}"
    )
    
    users[user_id] = user
    
    return {
        "user": user.dict(),
        "token": f"token_{user_id}"
    }

# Chat endpoints
@app.get("/api/chats/{user_id}")
async def get_user_chats(user_id: str):
    user_chats = []
    for chat in chats.values():
        if user_id in chat.participants:
            chat_dict = chat.dict()
            # Get last message
            if chat.id in messages and messages[chat.id]:
                chat_dict["last_message"] = messages[chat.id][-1].dict()
            user_chats.append(chat_dict)
    
    return user_chats

@app.get("/api/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str):
    if chat_id not in messages:
        return []
    
    return [msg.dict() for msg in messages[chat_id]]

@app.post("/api/chats")
async def create_chat(chat_data: dict):
    chat_id = str(uuid.uuid4())
    chat = Chat(
        id=chat_id,
        name=chat_data["name"],
        type=chat_data["type"],
        participants=chat_data["participants"],
        avatar=chat_data.get("avatar", "https://i.pravatar.cc/150?img=5"),
        created_at=datetime.now().isoformat()
    )
    
    chats[chat_id] = chat
    messages[chat_id] = []
    
    return chat.dict()

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    connection_id = await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "message":
                # Create new message
                message = Message(
                    id=str(uuid.uuid4()),
                    chat_id=message_data["chat_id"],
                    sender_id=user_id,
                    sender_name=users[user_id].name if user_id in users else "Unknown",
                    text=message_data["text"],
                    timestamp=datetime.now().isoformat()
                )
                
                # Store message
                if message_data["chat_id"] not in messages:
                    messages[message_data["chat_id"]] = []
                messages[message_data["chat_id"]].append(message)
                
                # Update chat's last message
                if message_data["chat_id"] in chats:
                    chats[message_data["chat_id"]].last_message = message
                
                # Broadcast to all participants in the chat
                response = {
                    "type": "new_message",
                    "message": message.dict()
                }
                await manager.broadcast_to_chat(json.dumps(response), message_data["chat_id"])
            
            elif message_data["type"] == "typing":
                # Broadcast typing indicator
                response = {
                    "type": "typing",
                    "chat_id": message_data["chat_id"],
                    "user_id": user_id,
                    "user_name": users[user_id].name if user_id in users else "Unknown",
                    "is_typing": message_data["is_typing"]
                }
                await manager.broadcast_to_chat(json.dumps(response), message_data["chat_id"])
    
    except WebSocketDisconnect:
        manager.disconnect(connection_id)

@app.get("/api/users")
async def get_users():
    return [user.dict() for user in users.values()]

@app.get("/")
async def root():
    return {"message": "WhatsApp Clone API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)