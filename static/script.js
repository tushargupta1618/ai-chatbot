// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const newChatBtn = document.getElementById('newChatBtn');
const themeToggle = document.getElementById('themeToggle');
const personalitySelect = document.getElementById('personality');
const chatList = document.getElementById('chatList');
const searchChats = document.getElementById('searchChats');

// State
let currentChatId = null;
let chats = JSON.parse(localStorage.getItem('chats')) || [];
let recognition = null;

// Initialize
initializeSpeechRecognition();
loadChatHistory();
loadTheme();

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
voiceBtn.addEventListener('click', toggleVoiceInput);
newChatBtn.addEventListener('click', startNewChat);
themeToggle.addEventListener('click', toggleTheme);
personalitySelect.addEventListener('change', updatePersonality);
searchChats.addEventListener('input', filterChats);

// Send Message
function sendMessage() {
    const message = userInput.value.trim();
    
    if (message === '') return;
    
    // Create new chat if needed
    if (!currentChatId) {
        createNewChat(message);
    }
    
    // Remove welcome screen
    const welcomeScreen = document.querySelector('.welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.remove();
    }
    
    // Display user message
    addMessage(message, 'user-message');
    userInput.value = '';
    
    // Show typing indicator
    const typingIndicator = addMessage('Thinking...', 'bot-message typing');
    
    // Get personality
    const personality = personalitySelect.value;
    
    // Send to backend
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            message: message,
            personality: personality
        })
    })
    .then(response => response.json())
    .then(data => {
        typingIndicator.remove();
        
        if (data.error) {
            addMessage('Error: ' + data.error, 'bot-message');
        } else {
            addMessage(data.reply, 'bot-message');
            
            // Save to chat history
            saveMessageToChat(message, data.reply);
        }
    })
    .catch(error => {
        typingIndicator.remove();
        addMessage('Error: Could not connect to server.', 'bot-message');
        console.error('Error:', error);
    });
}

// Add Message to UI
function addMessage(text, className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

// Voice Input
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            voiceBtn.classList.remove('recording');
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            voiceBtn.classList.remove('recording');
        };
        
        recognition.onend = () => {
            voiceBtn.classList.remove('recording');
        };
    } else {
        voiceBtn.disabled = true;
        voiceBtn.title = 'Voice input not supported in this browser';
    }
}

function toggleVoiceInput() {
    if (!recognition) return;
    
    if (voiceBtn.classList.contains('recording')) {
        recognition.stop();
        voiceBtn.classList.remove('recording');
    } else {
        recognition.start();
        voiceBtn.classList.add('recording');
    }
}

// Chat History Management
function createNewChat(firstMessage) {
    const chatId = Date.now().toString();
    const chat = {
        id: chatId,
        title: firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date().toISOString()
    };
    
    chats.unshift(chat);
    currentChatId = chatId;
    
    saveChatHistory();
    renderChatList();
}

function saveMessageToChat(userMsg, botMsg) {
    const chat = chats.find(c => c.id === currentChatId);
    if (chat) {
        chat.messages.push(
            { role: 'user', content: userMsg },
            { role: 'assistant', content: botMsg }
        );
        saveChatHistory();
    }
}

function startNewChat() {
    currentChatId = null;
    chatMessages.innerHTML = `
        <div class="welcome-screen">
            <h1>🤖 AI Chatbot</h1>
            <p>How can I help you today?</p>
        </div>
    `;
    userInput.focus();
    
    // Remove active state from chat items
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
}

function loadChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    
    currentChatId = chatId;
    chatMessages.innerHTML = '';
    
    chat.messages.forEach(msg => {
        const className = msg.role === 'user' ? 'user-message' : 'bot-message';
        addMessage(msg.content, className);
    });
    
    // Update active state
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.toggle('active', item.dataset.chatId === chatId);
    });
}

function renderChatList() {
    chatList.innerHTML = '';
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.dataset.chatId = chat.id;
        chatItem.textContent = chat.title;
        
        if (chat.id === currentChatId) {
            chatItem.classList.add('active');
        }
        
        chatItem.addEventListener('click', () => loadChat(chat.id));
        
        chatList.appendChild(chatItem);
    });
}

function loadChatHistory() {
    renderChatList();
}

function saveChatHistory() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

function filterChats() {
    const searchTerm = searchChats.value.toLowerCase();
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        const title = item.textContent.toLowerCase();
        item.style.display = title.includes(searchTerm) ? 'block' : 'none';
    });
}

// Dark Mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Toggle icons
    document.querySelector('.sun-icon').classList.toggle('hidden', isDark);
    document.querySelector('.moon-icon').classList.toggle('hidden', !isDark);
}

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('.sun-icon').classList.add('hidden');
        document.querySelector('.moon-icon').classList.remove('hidden');
    }
}

// Personality
function updatePersonality() {
    // Personality will be sent with each message
    console.log('Personality changed to:', personalitySelect.value);
}