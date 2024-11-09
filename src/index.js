import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onChildAdded } from 'firebase/database';
import { 
    initAuthStateListener, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    logoutUser,
    auth 
} from './auth.js';
import './styles.css';

const firebaseConfig = {
    apiKey: "AIzaSyAwbEWJn6_lK-gV33tUCEW_-AoZgY2iPk4",
    authDomain: "chatchi-b31b4.firebaseapp.com",
    databaseURL: "https://chatchi-b31b4-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "chatchi-b31b4",
    storageBucket: "chatchi-b31b4.firebasestorage.app",
    messagingSenderId: "645757510345",
    appId: "1:645757510345:web:343b5191ecc9a15608a318",
    measurementId: "G-MWPGW5KX5L"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const messagesRef = ref(database, 'messages');

// Manejar el estado de autenticación
initAuthStateListener(
    (user) => {
        // Usuario autenticado
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        document.getElementById('userEmail').textContent = user.email;
    },
    () => {
        // Usuario no autenticado
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('chatContainer').style.display = 'none';
    }
);

// Funciones de autenticación para el HTML
window.handleEmailAuth = async (type) => {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');

    try {
        if (type === 'login') {
            await loginWithEmail(email, password);
        } else {
            await registerWithEmail(email, password);
        }
        errorDiv.textContent = '';
    } catch (error) {
        errorDiv.textContent = error.message;
    }
};

window.handleGoogleAuth = async () => {
    const errorDiv = document.getElementById('loginError');
    try {
        await loginWithGoogle();
        errorDiv.textContent = '';
    } catch (error) {
        errorDiv.textContent = error.message;
    }
};

window.handleLogout = async () => {
    try {
        await logoutUser();
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
};

// Función para enviar mensajes
window.sendMessage = async function() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    
    if (message.trim() !== '' && auth.currentUser) {
        try {
            await push(messagesRef, {
                text: message,
                timestamp: Date.now(),
                userId: auth.currentUser.uid,
                userEmail: auth.currentUser.email
            });
            messageInput.value = '';
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
        }
    }
};

// Escuchar nuevos mensajes
onChildAdded(messagesRef, (snapshot) => {
    const message = snapshot.val();
    const messagesDiv = document.getElementById('messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = `${message.userEmail}: ${message.text}`;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}); 