from flask import Flask, render_template, request, jsonify
from groq import Groq
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize Groq client
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# Personality system prompts
PERSONALITIES = {
    'helpful': "You are a helpful, friendly AI assistant. Keep responses concise and helpful.",
    'professional': "You are a professional AI assistant. Be formal, precise, and business-like in your responses.",
    'casual': "You are a casual and friendly AI assistant. Be relaxed, use conversational language, and feel free to use emojis occasionally.",
    'creative': "You are a creative AI assistant. Be imaginative, think outside the box, and provide unique perspectives.",
    'concise': "You are a concise AI assistant. Give brief, to-the-point answers. Keep responses under 50 words when possible."
}

# Store conversation history per session (in production, use database)
conversation_history = {}

@app.route('/')
def home():
    """Render the chat interface"""
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat requests"""
    try:
        user_message = request.json.get('message', '').strip()
        personality = request.json.get('personality', 'helpful')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Get system prompt based on personality
        system_prompt = PERSONALITIES.get(personality, PERSONALITIES['helpful'])
        
        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
        
        print(f"User ({personality}): {user_message}")
        
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=200,
        )
        
        # Get AI response
        bot_reply = chat_completion.choices[0].message.content
        
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
    conversation_history = {}
    return jsonify({'message': 'History cleared'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)