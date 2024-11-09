import './styles.css';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onChildAdded } from 'firebase/database';
import { 
    getAuth,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged 
} from 'firebase/auth';

// Configuración de Firebase
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
const auth = getAuth(app);
const database = getDatabase(app);
const messagesRef = ref(database, 'messages');
const googleProvider = new GoogleAuthProvider();

// Funciones de autenticación
window.handleGoogleAuth = async () => {
    const errorDiv = document.getElementById('loginError');
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        console.log('Login exitoso:', result.user.email);
        errorDiv.textContent = '';
    } catch (error) {
        console.error('Error en login con Google:', error);
        errorDiv.textContent = error.message;
    }
};

window.handleEmailAuth = async (type) => {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    try {
        if (type === 'login') {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        console.error('Error en auth:', error);
        document.getElementById('loginError').textContent = error.message;
    }
};

window.handleLogout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error en logout:', error);
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

// Listener de estado de autenticación
onAuthStateChanged(auth, (user) => {
    const authContainer = document.getElementById('authContainer');
    const chatContainer = document.getElementById('chatContainer');
    const userEmail = document.getElementById('userEmail');

    if (user) {
        authContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        userEmail.textContent = user.email;
    } else {
        authContainer.style.display = 'flex';
        chatContainer.style.display = 'none';
    }
});

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