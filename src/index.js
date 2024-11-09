import './styles.css';
import { database, auth } from './firebase';
import { ref, push, onChildAdded } from 'firebase/database';
import { 
    initAuthStateListener, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    logoutUser 
} from './auth';

const messagesRef = ref(database, 'messages');

// Funciones globales para el HTML
window.handleGoogleAuth = async () => {
    const errorDiv = document.getElementById('loginError');
    try {
        await loginWithGoogle();
        errorDiv.textContent = '';
    } catch (error) {
        console.error('Error en login con Google:', error);
        errorDiv.textContent = error.message;
    }
};

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
        console.error('Error en auth:', error);
        errorDiv.textContent = error.message;
    }
};

window.handleLogout = async () => {
    try {
        await logoutUser();
    } catch (error) {
        console.error('Error en logout:', error);
        alert('Error al cerrar sesión');
    }
};

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

// Inicializar el listener de autenticación
initAuthStateListener(
    (user) => {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        document.getElementById('userEmail').textContent = user.email;
    },
    () => {
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('chatContainer').style.display = 'none';
    }
);

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