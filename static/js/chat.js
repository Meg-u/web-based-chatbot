// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug: chat.js loaded');
    
    // Get DOM elements
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const logoutButton = document.getElementById('logout-button');
    const newChatButton = document.getElementById('new-chat-button');
    const clearChatButton = document.getElementById('clear-chat-button');

    console.log('Elements found:', {
        messageInput: !!messageInput,
        sendButton: !!sendButton,
        chatMessages: !!chatMessages,
        logoutButton: !!logoutButton,
        newChatButton: !!newChatButton,
        clearChatButton: !!clearChatButton
    });

    if (!messageInput || !sendButton || !chatMessages) {
        console.error('Debug: Required elements not found');
        return;
    }

    // Check authentication status periodically
    setInterval(checkAuth, 60000); // Check every minute
    
    function checkAuth() {
        fetch('/check-auth')
            .then(response => response.json())
            .then(data => {
                if (data.authenticated === false) {
                    window.location.href = '/';
                }
            })
            .catch(error => {
                console.error('Auth check error:', error);
                window.location.href = '/';
            });
    }

    // Message input handler
    messageInput.addEventListener('input', function() {
        sendButton.disabled = !this.value.trim();
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Send button click handler
    sendButton.addEventListener('click', function() {
        const message = messageInput.value.trim();
        if (message) {
            sendMessage(message);
        }
    });

    // Enter key handler for message input
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = this.value.trim();
            if (message) {
                sendMessage(message);
            }
        }
    });

    // New chat button handler
    document.getElementById('new-chat-button').addEventListener('click', async function() {
        try {
            const response = await fetch('/chat/new', {
                method: 'POST',
                credentials: 'same-origin'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create new chat');
            }

            // Clear all messages except the welcome message
            const chatMessages = document.getElementById('chat-messages');
            while (chatMessages.children.length > 1) {
                chatMessages.removeChild(chatMessages.lastChild);
            }

            // Clear input
            messageInput.value = '';
            messageInput.style.height = 'auto';
            messageInput.focus();

        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
            if (error.message.includes('Unauthorized')) {
                window.location.href = '/';
            }
        }
    });

    // Clear chat button handler
    clearChatButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all messages?')) {
            fetch('/chat/clear', {
                method: 'POST',
                credentials: 'same-origin'
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to clear chat');
                while (chatMessages.children.length > 0) {
                    chatMessages.removeChild(chatMessages.lastChild);
                }
                addMessage("Hello! I'm your AI assistant. How can I help you today?", false);
                messageInput.value = '';
                messageInput.style.height = 'auto';
                messageInput.focus();
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Failed to clear chat');
            });
        }
    });

    // Logout button handler
    document.getElementById('logout-button').addEventListener('click', async function() {
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                credentials: 'same-origin'
            });

            if (response.ok) {
                window.location.href = '/';
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showError('Failed to logout. Please try again.');
        }
    });

    // Send message function
    async function sendMessage(message) {
        if (!message) return;

        try {
            // Disable input and button while sending
            messageInput.disabled = true;
            sendButton.disabled = true;

            // Add user message immediately
            addMessage(message, true);
            
            // Clear input
            messageInput.value = '';
            messageInput.style.height = 'auto';

            // Send to server
            const response = await fetch('/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send message');
            }

            const data = await response.json();

            // Add bot response
            if (data.response) {
                addMessage(data.response, false);
            }

        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'Failed to send message');
            
            // If unauthorized, redirect to login
            if (error.message.includes('Unauthorized')) {
                window.location.href = '/';
            }
        } finally {
            // Re-enable input and button
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    }

    // Add message to chat
    function addMessage(content, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = content;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(textDiv);
        messageDiv.appendChild(timeDiv);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        chatMessages.appendChild(errorDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode === chatMessages) {
                chatMessages.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Initial focus
    messageInput.focus();
    console.log('Debug: chat.js initialization complete');
});
