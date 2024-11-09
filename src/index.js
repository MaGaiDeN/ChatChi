import './styles.css';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onChildAdded, set, get, onValue, onDisconnect } from 'firebase/database';
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

// Referencia para usuarios conectados
const connectedRef = ref(database, '.info/connected');
const usersRef = ref(database, 'users');

// Función para guardar el nombre de usuario en la base de datos
async function saveUsernameToDb(uid, username) {
    const userRef = ref(database, `users/${uid}`);
    await set(userRef, {
        username: username,
        lastUpdated: Date.now()
    });
}

// Función para obtener el nombre de usuario
async function getUsernameFromDb(uid) {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val().username : null;
}

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
            const username = await getUsernameFromDb(auth.currentUser.uid);
            await push(messagesRef, {
                text: message,
                timestamp: Date.now(),
                userId: auth.currentUser.uid,
                userEmail: auth.currentUser.email,
                username: username || 'Anónimo'
            });
            messageInput.value = '';
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
        }
    }
};

// Listener de estado de autenticación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Obtener nombre de usuario existente
            const userRef = ref(database, `users/${user.uid}`);
            const snapshot = await get(userRef);
            const username = snapshot.exists() ? snapshot.val().username : null;

            // Actualizar UI
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('chatContainer').style.display = 'block';
            document.getElementById('userEmail').textContent = user.email;
            
            if (username) {
                document.getElementById('username').textContent = username;
            } else {
                // Mostrar modal para nuevo usuario
                document.getElementById('usernameModal').style.display = 'block';
            }
        } catch (error) {
            console.error('Error al cargar datos de usuario:', error);
        }

        // Configurar presencia
        onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                updateUserConnection(user.uid, true);
                
                // Desconectar cuando el usuario se va
                onDisconnect(ref(database, `users/${user.uid}/status`)).set({
                    online: false,
                    lastChanged: Date.now()
                });
            }
        });

        // Escuchar cambios en la lista de usuarios
        onValue(usersRef, (snapshot) => {
            const users = snapshot.val() || {};
            updateUsersList(users);
        });
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
    messageElement.textContent = `${message.username || 'Anónimo'}: ${message.text}`;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Mostrar modal de nombre de usuario
window.showChangeUsername = () => {
    const modal = document.getElementById('usernameModal');
    if (modal) {
        modal.style.display = 'block';
    }
};

// Guardar nombre de usuario
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
            
            // Actualizar UI
            const usernameSpan = document.getElementById('username');
            if (usernameSpan) {
                usernameSpan.textContent = username;
            }
            
            // Limpiar y cerrar modal
            if (modal) {
                modal.style.display = 'none';
            }
            usernameInput.value = '';
            
            console.log('Nombre de usuario guardado:', username);
        } catch (error) {
            console.error('Error al guardar username:', error);
            alert('Error al guardar el nombre de usuario');
        }
    }
};

// Agregar función para cerrar el modal si se hace clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('usernameModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Función para actualizar el estado de conexión del usuario
function updateUserConnection(uid, isOnline) {
    const userStatusRef = ref(database, `users/${uid}/status`);
    set(userStatusRef, {
        online: isOnline,
        lastChanged: Date.now()
    });
}

// Función para actualizar la lista de usuarios
function updateUsersList(users) {
    const usersList = document.getElementById('usersList');
    const userCount = document.getElementById('userCount');
    usersList.innerHTML = '';
    let onlineCount = 0;

    Object.entries(users).forEach(([uid, userData]) => {
        if (userData.username) {
            const isOnline = userData.status?.online;
            if (isOnline) onlineCount++;

            const userElement = document.createElement('div');
            userElement.className = `user-item ${isOnline ? 'online' : 'offline'}`;
            userElement.innerHTML = `
                <span class="user-status"></span>
                <span class="user-name">${userData.username}</span>
            `;
            usersList.appendChild(userElement);
        }
    });

    userCount.textContent = onlineCount;
}