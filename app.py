from flask import Flask, render_template, request, jsonify
from groq import Groq
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize Groq client
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# Store conversation history
conversation_history = []

@app.route('/')
def home():
    """Render the chat interface"""
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat requests"""
    try:
        user_message = request.json.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Add user message to history
        conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        # Keep only last 10 messages to avoid token limits
        messages_to_send = conversation_history[-10:]
        
        # Add system message for context
        messages = [
            {
                "role": "system",
                "content": "You are a helpful, friendly AI assistant. Keep responses concise and helpful."
            }
        ] + messages_to_send
        
        print(f"User: {user_message}")
        
        # Call Groq API with updated working model
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",  # Updated working model
            temperature=0.7,
            max_tokens=150,
        )
        
        # Get AI response
        bot_reply = chat_completion.choices[0].message.content
        
        # Add bot response to history
        conversation_history.append({
            "role": "assistant",
            "content": bot_reply
        })
        
        print(f"Bot: {bot_reply}")
        
        return jsonify({'reply': bot_reply})
            
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'API Error: {str(e)}'}), 500

@app.route('/clear', methods=['POST'])
def clear_history():
    """Clear conversation history"""
    global conversation_history
    conversation_history = []
    return jsonify({'message': 'History cleared'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)