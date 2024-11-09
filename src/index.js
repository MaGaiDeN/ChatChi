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

// Función para forzar textos correctos
function enforceCorrectTexts() {
    // Botón de cambiar nombre
    const changeNameBtn = document.querySelector('.change-name-btn');
    if (changeNameBtn) {
        changeNameBtn.textContent = 'Cambiar nombre de usuario';
    }

    // Título del modal
    const modalTitle = document.querySelector('#usernameModal h3');
    if (modalTitle) {
        modalTitle.textContent = 'Cambiar nombre de usuario';
    }

    // Botón del modal
    const modalButton = document.querySelector('#usernameModal button');
    if (modalButton) {
        modalButton.textContent = 'Guardar nombre';
    }
}

// IMPORTANTE: Definir las funciones globales antes de que se cargue el HTML
window.handleGoogleAuth = async function() {
    const errorDiv = document.getElementById('loginError');
    try {
        const provider = new GoogleAuthProvider();
        // Configurar el proveedor para manejar mejor el popup
        provider.setCustomParameters({
            prompt: 'select_account',
            display: 'popup'
        });
        
        const result = await signInWithPopup(auth, provider);
        console.log('Login exitoso:', result.user.email);
        errorDiv.textContent = '';
    } catch (error) {
        console.error('Error en login con Google:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            errorDiv.textContent = 'Ventana de inicio de sesión cerrada';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorDiv.textContent = 'Operación cancelada';
        } else {
            errorDiv.textContent = 'Error al iniciar sesión con Google';
        }
    }
};

window.handleEmailAuth = async function(type) {
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
};

window.handleLogout = async function() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error en logout:', error);
        alert('Error al cerrar sesión');
    }
};

window.showChangeUsername = function() {
    const modal = document.getElementById('usernameModal');
    if (modal) {
        // Forzar textos correctos antes de mostrar
        enforceCorrectTexts();
        modal.style.display = 'block';
    }
};

window.saveUsername = async function() {
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
};

window.sendMessage = async function() {
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
};

// Listener de autenticación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        document.getElementById('userEmail').textContent = user.email;
        
        // Forzar textos correctos
        enforceCorrectTexts();
        
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            document.getElementById('username').textContent = snapshot.val().username;
        } else {
            document.getElementById('usernameModal').style.display = 'block';
            enforceCorrectTexts();
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

// Llamar a enforceCorrectTexts periódicamente
setInterval(enforceCorrectTexts, 1000);