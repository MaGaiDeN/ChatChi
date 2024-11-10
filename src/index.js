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
    remove as dbRemove,
    onChildRemoved
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
    getRedirectResult,
    updateProfile
} from 'firebase/auth';

// Configuración mejorada de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAwbEWJn6_lK-gV33tUCEW_-AoZgY2iPk4",
    authDomain: "chatchi-b31b4.firebaseapp.com",
    databaseURL: "https://chatchi-b31b4-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "chatchi-b31b4",
    storageBucket: "chatchi-b31b4.appspot.com",
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

// Función mejorada de presencia
async function updatePresence(user) {
    if (!user) {
        console.error('🔴 No hay usuario autenticado');
        return;
    }

    try {
        const userPresenceRef = ref(database, `presence/${user.uid}`);
        
        // Datos de presencia
        const presenceData = {
            online: true,
            email: user.email,
            displayName: user.displayName || 'Usuario',
            lastSeen: serverTimestamp(),
            uid: user.uid
        };

        // Actualizar presencia
        await set(userPresenceRef, presenceData);
        console.log('✅ Presencia actualizada:', presenceData);

        // Configurar limpieza al desconectar
        onDisconnect(userPresenceRef).remove();

    } catch (error) {
        console.error('❌ Error actualizando presencia:', error);
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

// Función actualizada para mostrar usuarios
function updateUsersList(snapshot) {
    const usersList = document.getElementById('usersList');
    const userCount = document.getElementById('userCount');
    
    if (!usersList || !userCount) return;
    
    usersList.innerHTML = '';
    const users = [];
    
    snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.online) {
            users.push(userData);
        }
    });
    
    users.forEach(userData => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        
        if (auth.currentUser && userData.uid === auth.currentUser.uid) {
            userDiv.className += ' current-user';
        }
        
        userDiv.innerHTML = `
            <span class="user-status"></span>
            <span class="user-name">${userData.displayName}</span>
        `;
        usersList.appendChild(userDiv);
    });
    
    userCount.textContent = users.length.toString();
    console.log('👥 Usuarios conectados:', users.length);
}

// Función para manejar errores con logs
function logError(error, context) {
    console.error(`Error en ${context}:`, {
        code: error.code,
        message: error.message,
        fullError: error
    });
}

// Función mejorada de autenticación con Google
window.handleGoogleAuth = async function() {
    console.log('1. Iniciando proceso de autenticación con Google');
    const errorDiv = document.getElementById('loginError');
    
    try {
        console.log('2. Intentando autenticación con popup');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        
        // Obtener el nombre de usuario del input
        const usernameInput = document.getElementById('usernameInput');
        const customUsername = usernameInput.value.trim();
        
        // Si hay un nombre de usuario personalizado, actualizarlo
        if (customUsername) {
            await updateProfile(result.user, {
                displayName: customUsername
            });
            
            // Actualizar presencia con el nuevo nombre
            const userPresenceRef = ref(database, `presence/${result.user.uid}`);
            await set(userPresenceRef, {
                online: true,
                email: result.user.email,
                displayName: customUsername,
                lastSeen: serverTimestamp(),
                uid: result.user.uid
            });
        }
        
        console.log('3. Autenticación exitosa:', {
            email: result.user.email,
            displayName: customUsername || result.user.displayName
        });
        
        errorDiv.textContent = '';
        
    } catch (error) {
        console.error('Error en auth con Google:', error);
        handleAuthError(error, errorDiv);
    }
}

// Actualizar el HTML para requerir el nombre de usuario
document.addEventListener('DOMContentLoaded', () => {
    const googleBtn = document.querySelector('.google-btn');
    const usernameInput = document.getElementById('usernameInput');
    
    if (googleBtn && usernameInput) {
        googleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!usernameInput.value.trim()) {
                const errorDiv = document.getElementById('loginError');
                errorDiv.textContent = 'Por favor, ingresa un nombre de usuario';
                return;
            }
            handleGoogleAuth();
        });
    }
});

// Listener de autenticación con logs
onAuthStateChanged(auth, async (user) => {
    console.log('👤 Estado de auth cambiado:', user?.email);
    
    if (user) {
        // Usuario autenticado
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
        
        // Actualizar UI
        document.getElementById('username').textContent = user.displayName || 'Usuario';
        document.getElementById('userEmail').textContent = user.email;
        
        // Actualizar presencia
        await updatePresence(user);
        
        // Escuchar cambios en presencia
        const allPresenceRef = ref(database, 'presence');
        onValue(allPresenceRef, (snapshot) => {
            console.log('👥 Actualizando lista de usuarios');
            updateUsersList(snapshot);
        });
        
        // Inicializar listeners de mensajes
        initializeMessages();
    } else {
        // Usuario no autenticado
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('chatContainer').style.display = 'none';
        clearUserData();
    }
});

// Función para inicializar los mensajes
function initializeMessages() {
    console.log('📨 Inicializando sistema de mensajes');
    
    const messagesRef = ref(database, 'messages');
    
    // Escuchar nuevos mensajes
    onChildAdded(messagesRef, (snapshot) => {
        const message = snapshot.val();
        console.log('📩 Nuevo mensaje recibido:', message);
        displayMessage(message);
    }, (error) => {
        console.error('❌ Error al escuchar mensajes:', error);
    });
}

// Función para mostrar mensajes
function displayMessage(message) {
    console.log('📝 Mostrando mensaje:', message);
    const messagesDiv = document.getElementById('messages');
    
    if (!messagesDiv) {
        console.error('❌ No se encontró el contenedor de mensajes');
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    const isCurrentUser = message.userId === auth.currentUser?.uid;
    messageElement.classList.add(isCurrentUser ? 'message-own' : 'message-other');
    
    const timestamp = message.timestamp ? new Date(message.timestamp) : new Date();
    
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${message.displayName}</span>
                <span class="message-time">${timestamp.toLocaleTimeString()}</span>
            </div>
            <div class="message-text">${message.text}</div>
        </div>
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    console.log('✅ Mensaje agregado al DOM');
}

// Función para enviar mensajes
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error('❌ No hay usuario autenticado');
            return;
        }

        const messagesRef = ref(database, 'messages');
        
        const newMessage = {
            text: message,
            userId: user.uid,
            userEmail: user.email,
            displayName: user.displayName || 'Usuario',
            timestamp: Date.now()  // Cambiado de serverTimestamp()
        };

        console.log('📤 Enviando mensaje:', newMessage);
        
        // Enviar mensaje
        await push(messagesRef, newMessage);
        console.log('✅ Mensaje enviado correctamente');
        
        // Limpiar input
        messageInput.value = '';
        
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
    }
}

// Verificar resultado de redirección al cargar
getRedirectResult(auth)
    .then((result) => {
        if (result) {
            console.log('Login por redirección exitoso:', {
                email: result.user.email,
                displayName: result.user.displayName
            });
        }
    })
    .catch((error) => {
        console.error('Error en redirección:', error);
        document.getElementById('loginError').textContent = 'Error al iniciar sesión';
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

// Agregar listener para limpiar presencia al cerrar ventana
window.addEventListener('beforeunload', async (event) => {
    const user = auth.currentUser;
    if (user) {
        await clearPresence(user.uid);
    }
});

// Agregar evento de tecla Enter para enviar mensajes
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
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

// Función para manejar el login y registro
async function handleAuth(email, password, username) {
    try {
        // Intentar login primero
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Actualizar el nombre de usuario
        await updateUserProfile(userCredential.user, username);
        return userCredential;
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            // Si el usuario no existe, crear uno nuevo
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Establecer el nombre de usuario para el nuevo usuario
            await updateUserProfile(userCredential.user, username);
            return userCredential;
        }
        throw error;
    }
}

// Función para actualizar el perfil del usuario
async function updateUserProfile(user, username) {
    try {
        // Actualizar displayName en Auth
        await updateProfile(user, {
            displayName: username
        });
        
        // Actualizar en la base de datos
        const userRef = ref(database, `users/${user.uid}`);
        await set(userRef, {
            username: username,
            email: user.email,
            lastUpdated: serverTimestamp()
        });
        
        console.log('Perfil actualizado:', username);
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        throw error;
    }
}

// Actualizar el event listener del formulario
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('usernameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');

    try {
        if (!username) {
            errorDiv.textContent = 'Por favor, ingresa un nombre de usuario';
            return;
        }
        
        const userCredential = await handleAuth(email, password, username);
        console.log('Login exitoso:', userCredential.user.email);
        errorDiv.textContent = '';
    } catch (error) {
        console.error('Error:', error);
        handleAuthError(error, errorDiv);
    }
});

// Función para cambiar nombre de usuario
async function showChangeUsername() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No hay usuario autenticado');

        const newUsername = prompt('Ingresa tu nuevo nombre de usuario:');
        if (!newUsername) return;

        await updateUserProfile(user, newUsername);
        
        // Actualizar UI
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = newUsername;
        }

        // Actualizar presencia
        const userPresenceRef = ref(database, `presence/${user.uid}`);
        await set(userPresenceRef, {
            online: true,
            email: user.email,
            displayName: newUsername,
            lastSeen: serverTimestamp()
        });

    } catch (error) {
        console.error('Error cambiando nombre:', error);
        alert('Error al cambiar el nombre de usuario');
    }
}

// Asegurarse de exportar la función
window.showChangeUsername = showChangeUsername;

// Logs para verificar carga inicial
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 DOM Cargado - Verificando estilos');
    
    const authContainer = document.getElementById('authContainer');
    const chatContainer = document.getElementById('chatContainer');
    
    console.log('📦 Estado contenedores:', {
        authContainer: {
            existe: !!authContainer,
            display: authContainer?.style.display,
            className: authContainer?.className,
            computedStyle: window.getComputedStyle(authContainer)
        },
        chatContainer: {
            existe: !!chatContainer,
            display: chatContainer?.style.display,
            className: chatContainer?.className
        }
    });

    // Verificar si los estilos se aplicaron
    if (authContainer) {
        const styles = window.getComputedStyle(authContainer);
        console.log('🎨 Estilos auth-container:', {
            display: styles.display,
            justifyContent: styles.justifyContent,
            alignItems: styles.alignItems,
            height: styles.height,
            width: styles.width,
            position: styles.position
        });
    }
});

// Asegurar disponibilidad global
window.sendMessage = sendMessage;

// Evento Enter para enviar mensajes
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

// Validación del formulario de login
document.addEventListener('DOMContentLoaded', () => {
    const emailForm = document.getElementById('emailForm');
    const googleBtn = document.querySelector('.google-btn');
    const usernameInput = document.getElementById('usernameInput');
    const errorDiv = document.getElementById('loginError');

    // Deshabilitar botón de Google inicialmente
    if (googleBtn) {
        googleBtn.disabled = true;
        googleBtn.style.opacity = '0.5';
        googleBtn.style.cursor = 'not-allowed';
    }

    // Validar nombre de usuario en tiempo real
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            const username = usernameInput.value.trim();
            if (username.length >= 3) {
                googleBtn.disabled = false;
                googleBtn.style.opacity = '1';
                googleBtn.style.cursor = 'pointer';
                errorDiv.textContent = '';
            } else {
                googleBtn.disabled = true;
                googleBtn.style.opacity = '0.5';
                googleBtn.style.cursor = 'not-allowed';
                errorDiv.textContent = 'El nombre de usuario debe tener al menos 3 caracteres';
            }
        });
    }

    // Validar formulario de email
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim();
            
            if (username.length < 3) {
                errorDiv.textContent = 'El nombre de usuario debe tener al menos 3 caracteres';
                return;
            }
            
            // ... resto del código de login ...
        });
    }
});