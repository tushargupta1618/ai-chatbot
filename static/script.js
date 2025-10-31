const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');

// Send message when button is clicked
sendBtn.addEventListener('click', sendMessage);

// Send message when Enter key is pressed
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Clear chat history
clearBtn.addEventListener('click', clearChat);

function sendMessage() {
    const message = userInput.value.trim();
    
    if (message === '') {
        return;
    }
    
    // Display user message
    addMessage(message, 'user-message');
    
    // Clear input field
    userInput.value = '';
    
    // Show typing indicator
    const typingIndicator = addMessage('Typing...', 'bot-message');
    
    // Send message to backend
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
        // Remove typing indicator
        typingIndicator.remove();
        
        if (data.error) {
            addMessage('Error: ' + data.error, 'bot-message');
        } else {
            addMessage(data.reply, 'bot-message');
        }
    })
    .catch(error => {
        // Remove typing indicator
        typingIndicator.remove();
        addMessage('Error: Could not connect to server.', 'bot-message');
        console.error('Error:', error);
    });
}

function addMessage(text, className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    
    const messagePara = document.createElement('p');
    messagePara.textContent = text;
    
    messageDiv.appendChild(messagePara);
    chatBox.appendChild(messageDiv);
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return messageDiv;
}

function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        // Clear chat box (keep welcome message)
        chatBox.innerHTML = `
            <div class="message bot-message">
                <p>Hello! I'm your AI assistant. How can I help you today?</p>
            </div>
        `;
        
        // Clear backend history
        fetch('/clear', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(error => {
            console.error('Error clearing history:', error);
        });
    }
}