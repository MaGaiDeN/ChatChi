import './styles.css';
import { initializeApp } from 'firebase/app';
import { 
    getDatabase, 
    ref, 
    push, 
    onValue, 
    onDisconnect,
    set,
    get,
    serverTimestamp,
    onChildAdded 
} from 'firebase/database';
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
const presenceRef = ref(database, 'presence');
const connectedRef = ref(database, '.info/connected');

// Definir funciones globales
const globalFunctions = {
    // Función de autenticación con Google
    handleGoogleAuth: async () => {
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
    },

    // Función de autenticación con email
    handleEmailAuth: async (type) => {
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        const errorDiv = document.getElementById('loginError');

        try {
            if (type === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            errorDiv.textContent = '';
        } catch (error) {
            console.error('Error en auth:', error);
            errorDiv.textContent = error.message;
        }
    },

    // Función de logout
    handleLogout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error en logout:', error);
            alert('Error al cerrar sesión');
        }
    },

    // Función para mostrar modal de cambio de nombre
    showChangeUsername: () => {
        const modal = document.getElementById('usernameModal');
        if (modal) {
            modal.style.display = 'block';
        }
    },

    // Función para guardar nombre de usuario
    saveUsername: async () => {
        const usernameInput = document.getElementById('usernameInput');
        const modal = document.getElementById('usernameModal');
        const username = usernameInput.value.trim();

        if (username && auth.currentUser) {
            try {
                const userRef = ref(database, `users/${auth.currentUser.uid}`);
                await set(userRef, {
                    username: username,
                    lastUpdated: Date.now()
                });
                
                document.getElementById('username').textContent = username;
                modal.style.display = 'none';
                usernameInput.value = '';
            } catch (error) {
                console.error('Error al guardar username:', error);
                alert('Error al guardar el nombre de usuario');
            }
        }
    },

    // Función para enviar mensajes
    sendMessage: async () => {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (message && auth.currentUser) {
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
    }
};

// Asignar todas las funciones al objeto window
Object.assign(window, globalFunctions);

// Inicializar listeners
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        document.getElementById('userEmail').textContent = user.email;
        
        // Obtener nombre de usuario si existe
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            document.getElementById('username').textContent = snapshot.val().username;
        } else {
            document.getElementById('usernameModal').style.display = 'block';
        }
    } else {
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('chatContainer').style.display = 'none';
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