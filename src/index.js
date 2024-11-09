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
    serverTimestamp 
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

// Función para mantener los textos correctos
function enforceCorrectTexts() {
    const elements = document.querySelectorAll('[data-text]');
    elements.forEach(element => {
        const correctText = element.getAttribute('data-text');
        if (element.textContent !== correctText) {
            element.textContent = correctText;
        }
    });
}

// Función para manejar la presencia de usuarios
function handlePresence(user) {
    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            const userPresenceRef = ref(database, `presence/${user.uid}`);
            
            set(userPresenceRef, {
                online: true,
                username: user.displayName || document.getElementById('username').textContent,
                lastSeen: serverTimestamp()
            });

            onDisconnect(userPresenceRef).remove();
        }
    });
}

// Función única para actualizar la lista de usuarios
function updateUsersList(presenceData) {
    const usersList = document.getElementById('usersList');
    const userCount = document.getElementById('userCount');
    usersList.innerHTML = '';
    
    const onlineUsers = Object.values(presenceData || {}).filter(user => user.online);
    userCount.textContent = onlineUsers.length;

    onlineUsers.forEach(userData => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item online';
        userElement.innerHTML = `
            <span class="user-status"></span>
            <span class="user-name">${userData.username || 'Anónimo'}</span>
        `;
        usersList.appendChild(userElement);
    });
}

// Funciones de la ventana
window.showChangeUsername = () => {
    const modal = document.getElementById('usernameModal');
    modal.style.display = 'block';
    enforceCorrectTexts();
};

window.saveUsername = async () => {
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
            
            // Actualizar presencia con nuevo nombre
            const userPresenceRef = ref(database, `presence/${auth.currentUser.uid}`);
            await set(userPresenceRef, {
                online: true,
                username: username,
                lastSeen: serverTimestamp()
            });
            
            document.getElementById('username').textContent = username;
            modal.style.display = 'none';
            usernameInput.value = '';
        } catch (error) {
            console.error('Error al guardar nombre de usuario:', error);
            alert('Error al guardar el nombre de usuario');
        }
    }
};

// ... resto del código existente ...

// Listeners
onValue(presenceRef, (snapshot) => {
    updateUsersList(snapshot.val());
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        handlePresence(user);
        // ... resto del código de autenticación ...
    }
});

// Llamar a enforceCorrectTexts periódicamente
setInterval(enforceCorrectTexts, 1000);