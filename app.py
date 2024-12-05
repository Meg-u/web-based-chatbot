from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from datetime import datetime, timedelta
import json
from models import db, User, Conversation, Message

app = Flask(__name__)
app.secret_key = str(uuid.uuid4())
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=60),
    SQLALCHEMY_DATABASE_URI='sqlite:///chatbot.db',
    SQLALCHEMY_TRACK_MODIFICATIONS=False
)

# Initialize database
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('chat'))
    return render_template('index.html')

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    try:
        user = User(email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        session['user_id'] = user.id
        return jsonify({'redirect': url_for('chat')})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create account'}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            return jsonify({'redirect': url_for('chat')})
        return jsonify({'error': 'Invalid email or password'}), 401
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'redirect': url_for('index')})

@app.route('/check-auth')
def check_auth():
    return jsonify({'authenticated': 'user_id' in session})

@app.route('/chat')
def chat():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('chat.html')

@app.route('/chat/message', methods=['POST'])
def chat_message():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    try:
        # Get current conversation or create new one
        conversation = Conversation.query.filter_by(
            user_id=session['user_id']
        ).order_by(Conversation.created_at.desc()).first()

        if not conversation:
            conversation = Conversation(user_id=session['user_id'])
            db.session.add(conversation)
            db.session.commit()

        # Save user message
        user_msg = Message(
            conversation_id=conversation.id,
            content=message,
            is_user=True
        )
        db.session.add(user_msg)

        # Generate AI response
        response = get_mock_response(message)

        # Save AI response
        ai_msg = Message(
            conversation_id=conversation.id,
            content=response,
            is_user=False
        )
        db.session.add(ai_msg)
        db.session.commit()

        return jsonify({'response': response})

    except Exception as e:
        print(f"Error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to process message'}), 500

@app.route('/chat/new', methods=['POST'])
def new_chat():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        conversation = Conversation(user_id=session['user_id'])
        db.session.add(conversation)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create new chat'}), 500

@app.route('/chat/clear', methods=['POST'])
def clear_chat():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        conversation = Conversation.query.filter_by(
            user_id=session['user_id']
        ).order_by(Conversation.created_at.desc()).first()

        if conversation:
            Message.query.filter_by(conversation_id=conversation.id).delete()
            db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to clear chat'}), 500

def get_mock_response(message):
    message = message.lower()
    responses = {
        "hello": "Hello! How can I help you today?",
        "hi": "Hi there! What can I do for you?",
        "how are you": "I'm doing well, thank you! How can I assist you?",
        "bye": "Goodbye! Have a great day!",
        "thanks": "You're welcome! Let me know if you need anything else.",
        "thank you": "You're welcome! Is there anything else I can help with?"
    }
    
    for key in responses:
        if key in message:
            return responses[key]
    return "I understand. How can I help you further?"

if __name__ == '__main__':
    app.run(debug=True)
