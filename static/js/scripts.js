// Authentication and form handling
async function signup() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('confirm-password').value;
    const errorElement = document.getElementById('error-message');
    
    // Clear previous error
    errorElement.textContent = '';
    
    // Validate email
    if (!email || !email.includes('@')) {
        errorElement.textContent = 'Please enter a valid email address';
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        errorElement.textContent = 'Password must be at least 6 characters long';
        return;
    }
    
    // Check password match
    if (password !== confirm) {
        errorElement.textContent = 'Passwords do not match';
        return;
    }

    try {
        console.log('Attempting signup...');
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();
        console.log('Signup response:', data);
        
        if (!response.ok) {
            errorElement.textContent = data.error || 'Signup failed';
            return;
        }

        // If signup was successful, redirect to chat
        console.log('Signup successful, redirecting to chat...');
        window.location.href = '/chat';
        
    } catch (error) {
        console.error('Signup error:', error);
        errorElement.textContent = 'An error occurred during signup';
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('error-message');
    
    // Clear previous error
    errorElement.textContent = '';
    
    // Basic validation
    if (!email || !email.includes('@')) {
        errorElement.textContent = 'Please enter a valid email address';
        return;
    }
    
    if (!password) {
        errorElement.textContent = 'Password is required';
        return;
    }

    try {
        console.log('Attempting login...');
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();
        console.log('Login response:', data);
        
        if (!response.ok) {
            errorElement.textContent = data.error || 'Login failed';
            return;
        }

        // Store email in localStorage for chat page
        localStorage.setItem('userEmail', email);

        // Handle redirection
        if (data.redirect) {
            console.log('Login successful, redirecting to:', data.redirect);
            window.location.href = data.redirect;
        } else {
            console.error('No redirect URL in response');
            errorElement.textContent = 'Login successful but redirect failed';
        }
        
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = 'An error occurred during login';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Toggle between signup and login forms
    document.getElementById('showLogin').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('signUpContainer').classList.remove('active');
        document.getElementById('loginContainer').classList.add('active');
    });

    document.getElementById('showSignUp').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('loginContainer').classList.remove('active');
        document.getElementById('signUpContainer').classList.add('active');
    });

    // Signup form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                window.location.href = data.redirect;
            } else {
                showError(data.error || 'Signup failed');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred during signup');
        }
    });

    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                window.location.href = data.redirect;
            } else {
                showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred during login');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
});

// Event Listeners
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    signup();
});

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    login();
});

// Check authentication status on page load
async function checkAuth() {
    try {
        const response = await fetch('/check-auth');
        const data = await response.json();
        
        if (data.authenticated) {
            console.log('User is authenticated, redirecting to chat...');
            window.location.href = '/chat';
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

// Run auth check when page loads
checkAuth();

// Chatbot response patterns
const responsePatterns = {
    greeting: {
        patterns: ['hello', 'hi', 'hey', 'greetings'],
        responses: [
            "Hello! How can I help you today?",
            "Hi there! What can I do for you?",
            "Hey! How can I assist you?"
        ]
    },
    farewell: {
        patterns: ['bye', 'goodbye', 'see you', 'cya'],
        responses: [
            "Goodbye! Have a great day!",
            "See you later! Take care!",
            "Bye! Come back soon!"
        ]
    },
    thanks: {
        patterns: ['thank', 'thanks', 'appreciate'],
        responses: [
            "You're welcome!",
            "Glad I could help!",
            "My pleasure!"
        ]
    },
    help: {
        patterns: ['help', 'support', 'assist'],
        responses: [
            "I'm here to help! What do you need assistance with?",
            "How can I help you today?",
            "I'd be happy to assist you. What's on your mind?"
        ]
    },
    about: {
        patterns: ['who are you', 'what are you', 'about you'],
        responses: [
            "I'm a friendly chatbot here to help you!",
            "I'm your virtual assistant, ready to help with your questions.",
            "I'm a chatbot designed to make your experience better!"
        ]
    }
};

// Function to get a random response from an array
function getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
}

// Function to generate chatbot response based on user input
function generateResponse(userInput) {
    // Convert input to lowercase for better matching
    const input = userInput.toLowerCase();
    
    // Check for matches in response patterns
    for (const category in responsePatterns) {
        const patterns = responsePatterns[category].patterns;
        if (patterns.some(pattern => input.includes(pattern))) {
            return getRandomResponse(responsePatterns[category].responses);
        }
    }
    
    // Handle questions
    if (input.includes('?')) {
        if (input.startsWith('what')) {
            return "That's an interesting question. Could you be more specific?";
        } else if (input.startsWith('how')) {
            return "Let me help you with that. What exactly would you like to know?";
        } else if (input.startsWith('why')) {
            return "That's a good question. Could you provide more context?";
        }
    }
    
    // Handle common phrases
    if (input.includes('weather')) {
        return "I can't check the weather right now, but I hope it's nice where you are!";
    } else if (input.includes('name')) {
        return "You can call me ChatBot! Nice to meet you!";
    } else if (input.includes('how are you')) {
        return "I'm doing great, thanks for asking! How can I help you today?";
    }
    
    // Default responses for unrecognized input
    const defaultResponses = [
        "I'm not sure I understand. Could you rephrase that?",
        "Interesting! Tell me more about that.",
        "I'm still learning. Could you explain what you mean?",
        "Let me know if you need help with anything specific!"
    ];
    
    return getRandomResponse(defaultResponses);
}

// Chat functionality
if (document.getElementById('chatForm')) {
    // Display welcome message if on chat page
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        const welcomeMsg = `Welcome, ${userEmail}! How can I help you today?`;
        appendMessage('bot', welcomeMsg);
    }

    document.getElementById('chatForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (message) {
            // Display user message
            appendMessage('user', message);
            chatInput.value = '';

            // Generate and display bot response
            setTimeout(() => {
                const botResponse = generateResponse(message);
                appendMessage('bot', botResponse);
            }, 500);
        }
    });
}

function appendMessage(sender, message) {
    const chatWindow = document.getElementById('chatWindow');
    const messageElement = document.createElement('div');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = message;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
