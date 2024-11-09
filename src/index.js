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
    onChildAdded,
    remove as dbRemove
} from 'firebase/database';
import { 
    getAuth,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    signInWithRedirect,
    remove,
    getRedirectResult
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

// Referencias de Firebase para presencia
const presenceRef = ref(database, 'presence');

// Función mejorada para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para manejar errores de autenticación
function handleAuthError(error, errorDiv) {
    console.error('Error en auth:', error);
    switch (error.code) {
        case 'auth/invalid-email':
            errorDiv.textContent = 'El email no es válido';
            break;
        case 'auth/weak-password':
            errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
            break;
        case 'auth/email-already-in-use':
            errorDiv.textContent = 'Este email ya está registrado';
            break;
        case 'auth/user-not-found':
            errorDiv.textContent = 'Usuario no encontrado';
            break;
        case 'auth/wrong-password':
            errorDiv.textContent = 'Contraseña incorrecta';
            break;
        default:
            errorDiv.textContent = 'Error en la autenticación';
    }
}

// Función mejorada para forzar textos correctos
function enforceCorrectTexts() {
    const elements = {
        changeNameBtn: document.querySelector('.change-name-btn'),
        modalTitle: document.querySelector('#usernameModal h3'),
        modalButton: document.querySelector('#usernameModal button'),
        modalInput: document.querySelector('#usernameInput')
    };

    const texts = {
        changeNameBtn: 'Cambiar nombre de usuario',
        modalTitle: 'Cambiar nombre de usuario',
        modalButton: 'Guardar nombre',
        modalInput: 'Escribe tu nombre de usuario'
    };

    for (const [key, element] of Object.entries(elements)) {
        if (element) {
            if (element.tagName === 'INPUT') {
                element.placeholder = texts[key];
            } else {
                element.textContent = texts[key];
            }
            // Agregar atributo para evitar traducción
            element.setAttribute('translate', 'no');
            element.classList.add('notranslate');
        }
    }
}

// Función mejorada para manejar la presencia
async function updatePresence(user) {
    if (!user) {
        console.log('⚠ updatePresence: No hay usuario');
        return;
    }

    console.log('→ Iniciando actualización de presencia para:', user.email);
    
    try {
        const userPresenceRef = ref(database, `presence/${user.uid}`);
        const connectedRef = ref(database, '.info/connected');
        
        onValue(connectedRef, async (snap) => {
            console.log('→ Estado de conexión:', snap.val());
            
            if (snap.val() === true) {
                try {
                    await onDisconnect(userPresenceRef).remove();
                    console.log('✓ Configurada limpieza al desconectar');
                    
                    const userRef = ref(database, `users/${user.uid}`);
                    const snapshot = await get(userRef);
                    const username = snapshot.exists() ? snapshot.val().username : null;
                    
                    await set(userPresenceRef, {
                        online: true,
                        email: user.email,
                        username: username,
                        lastSeen: serverTimestamp()
                    });
                    
                    console.log('✓ Presencia actualizada exitosamente');
                } catch (error) {
                    console.error('✗ Error al configurar presencia:', error);
                }
            }
        });
    } catch (error) {
        console.error('✗ Error en updatePresence:', error);
    }
}

// Función para limpiar datos al cerrar sesión
function clearUserData() {
    const elements = {
        messages: document.getElementById('messages'),
        usersList: document.getElementById('usersList'),
        userCount: document.getElementById('userCount'),
        username: document.getElementById('username'),
        userEmail: document.getElementById('userEmail')
    };

    // Limpiar elementos
    Object.values(elements).forEach(element => {
        if (element) {
            if (element.tagName === 'INPUT') {
                element.value = '';
            } else {
                element.textContent = '';
            }
        }
    });
}

// Función mejorada para actualizar la lista de usuarios
function updateUsersList(snapshot) {
    const usersList = document.getElementById('usersList');
    const userCount = document.getElementById('userCount');
    
    if (!usersList || !userCount) return;
    
    const users = [];
    usersList.innerHTML = '';

    snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData && userData.online) {
            users.push(userData);
            
            const userElement = document.createElement('div');
            userElement.className = 'user-item online';
            userElement.innerHTML = `
                <span class="user-status"></span>
                <span class="user-name">${userData.username || userData.email || 'Anónimo'}</span>
            `;
            usersList.appendChild(userElement);
        }
    });

    console.log(`Usuarios conectados: ${users.length}`);
    userCount.textContent = users.length.toString();
}

// Configurar el proveedor de Google
const provider = new GoogleAuthProvider();
provider.addScope('email');
provider.addScope('profile');

// Función de autenticación con Google con logs
window.handleGoogleAuth = async function() {
    const errorDiv = document.getElementById('loginError');
    console.log('1. Iniciando proceso de autenticación con Google');
    
    try {
        const provider = new GoogleAuthProvider();
        console.log('2. Proveedor de Google creado');
        
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        console.log('3. Parámetros personalizados configurados');

        console.log('4. Intentando signInWithRedirect');
        await signInWithRedirect(auth, provider);
        console.log('5. Redirección iniciada'); // Este log probablemente no se vea por la redirección
    } catch (error) {
        console.error('Error en handleGoogleAuth:', error);
        errorDiv.textContent = 'Error al iniciar sesión con Google';
    }
};

// Manejador del resultado de la redirección
document.addEventListener('DOMContentLoaded', async () => {
    console.log('A. DOMContentLoaded - Iniciando verificación de redirección');
    
    try {
        console.log('B. Intentando obtener resultado de redirección');
        const result = await getRedirectResult(auth);
        
        if (result) {
            console.log('C. Resultado de redirección obtenido:', {
                email: result.user.email,
                uid: result.user.uid
            });
        } else {
            console.log('D. No hay resultado de redirección (normal en la primera carga)');
        }
    } catch (error) {
        console.error('E. Error al obtener resultado de redirección:', error);
    }
});

window.handleEmailAuth = async function(type) {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');

    if (!isValidEmail(email)) {
        errorDiv.textContent = 'Por favor, introduce un email válido';
        return;
    }

    if (!password || password.length < 6) {
        errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
        return;
    }

    try {
        if (type === 'login') {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        errorDiv.textContent = '';
    } catch (error) {
        handleAuthError(error, errorDiv);
    }
};

window.handleLogout = async function() {
    try {
        const user = auth.currentUser;
        if (user) {
            // Eliminar presencia usando set(null)
            const userPresenceRef = ref(database, `presence/${user.uid}`);
            await set(userPresenceRef, null);
        }
        
        // Limpiar UI
        const elements = {
            messages: document.getElementById('messages'),
            usersList: document.getElementById('usersList'),
            userCount: document.getElementById('userCount'),
            username: document.getElementById('username'),
            userEmail: document.getElementById('userEmail')
        };

        // Limpiar cada elemento
        Object.values(elements).forEach(element => {
            if (element) {
                if (element.tagName === 'INPUT') {
                    element.value = '';
                } else {
                    element.innerHTML = '';
                }
            }
        });

        // Cerrar sesión en Firebase
        await signOut(auth);
        
        // Cambiar vista
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('chatContainer').style.display = 'none';
        
        console.log('Sesión cerrada correctamente');
    } catch (error) {
        console.error('Error en logout:', error);
        alert('Error al cerrar sesión');
    }
};

window.showChangeUsername = function() {
    const modal = document.getElementById('usernameModal');
    if (modal) {
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
            
            // Actualizar presencia con nuevo nombre
            await updatePresence(auth.currentUser);
            
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

// Función para limpiar presencia
async function clearPresence(userId) {
    if (!userId) return;
    try {
        const userPresenceRef = ref(database, `presence/${userId}`);
        await set(userPresenceRef, null);
        console.log('Presencia eliminada para usuario:', userId);
    } catch (error) {
        console.error('Error al limpiar presencia:', error);
    }
}

// Listener de autenticación mejorado
onAuthStateChanged(auth, async (user) => {
    console.log('→ Estado de autenticación cambiado');
    
    if (user) {
        console.log('✓ Usuario autenticado:', {
            email: user.email,
            uid: user.uid,
            displayName: user.displayName
        });
        
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        document.getElementById('userEmail').textContent = user.email;
        
        console.log('✓ Actualizando UI para usuario autenticado');
        
        try {
            console.log('✓ Iniciando actualización de presencia');
            await updatePresence(user);
            
            const userRef = ref(database, `users/${user.uid}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                console.log('✓ Datos de usuario encontrados en la base de datos');
                document.getElementById('username').textContent = snapshot.val().username;
            } else {
                console.log('✓ Usuario nuevo - Mostrando modal de nombre de usuario');
                document.getElementById('usernameModal').style.display = 'block';
            }
        } catch (error) {
            console.error('✗ Error al actualizar datos de usuario:', error);
        }
    } else {
        console.log('✗ Usuario no autenticado - Mostrando pantalla de login');
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('chatContainer').style.display = 'none';
        
        // Limpiar UI
        ['messages', 'usersList', 'userCount', 'username', 'userEmail'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '';
        });
    }
});

// Agregar listener para limpiar presencia al cerrar ventana
window.addEventListener('beforeunload', async (event) => {
    const user = auth.currentUser;
    if (user) {
        await clearPresence(user.uid);
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

// Escuchar cambios en la presencia
onValue(presenceRef, (snapshot) => {
    console.log('Actualizando lista de usuarios');
    updateUsersList(snapshot);
});

// Llamar a enforceCorrectTexts más frecuentemente al inicio
document.addEventListener('DOMContentLoaded', () => {
    enforceCorrectTexts();
    // Llamar varias veces en los primeros segundos
    for (let i = 1; i <= 5; i++) {
        setTimeout(enforceCorrectTexts, i * 1000);
    }
    // Después, llamar periódicamente
    setInterval(enforceCorrectTexts, 2000);
});