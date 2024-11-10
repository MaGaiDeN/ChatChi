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

// Función mejorada para manejar la presencia
async function updatePresence(user) {
    if (!user) return;

    try {
        const userPresenceRef = ref(database, `presence/${user.uid}`);
        const connectedRef = ref(database, '.info/connected');
        
        onValue(connectedRef, async (snap) => {
            if (snap.val() === true) {
                // Configurar limpieza al desconectar
                await onDisconnect(userPresenceRef).remove();
                
                // Obtener nombre de usuario
                const userRef = ref(database, `users/${user.uid}`);
                const userSnapshot = await get(userRef);
                const username = userSnapshot.exists() ? userSnapshot.val().username : user.email;
                
                // Actualizar presencia
                await set(userPresenceRef, {
                    online: true,
                    email: user.email,
                    username: username,
                    lastSeen: serverTimestamp()
                });
                
                console.log('Presencia actualizada para:', username);
            }
        });
    } catch (error) {
        console.error('Error actualizando presencia:', error);
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
    console.log('Actualizando lista de usuarios');
    const usersList = document.getElementById('usersList');
    const userCount = document.getElementById('userCount');
    
    if (!usersList || !userCount) {
        console.error('Elementos de usuarios no encontrados');
        return;
    }

    usersList.innerHTML = '';
    let count = 0;

    snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        console.log('Usuario encontrado:', userData);
        
        if (userData.online) {
            count++;
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            userDiv.innerHTML = `
                <span class="user-status"></span>
                <span class="user-name">${userData.username || userData.email}</span>
            `;
            usersList.appendChild(userDiv);
        }
    });

    console.log('Total usuarios conectados:', count);
    userCount.textContent = count.toString();
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
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        // Usar signInWithPopup en lugar de redirect
        console.log('2. Intentando autenticación con popup');
        const result = await signInWithPopup(auth, provider);
        
        console.log('3. Autenticación exitosa:', {
            email: result.user.email,
            displayName: result.user.displayName
        });
        
        errorDiv.textContent = '';
    } catch (error) {
        console.error('Error en autenticación:', {
            code: error.code,
            message: error.message
        });
        
        // Si falla el popup, intentar con redirect
        if (error.code === 'auth/popup-blocked') {
            try {
                console.log('4. Popup bloqueado, intentando con redirect');
                await signInWithRedirect(auth, provider);
            } catch (redirectError) {
                console.error('Error en redirect:', redirectError);
                errorDiv.textContent = 'Error al iniciar sesión con Google';
            }
        } else {
            errorDiv.textContent = 'Error al iniciar sesión con Google';
        }
    }
};

// Listener de autenticación con logs
onAuthStateChanged(auth, async (user) => {
    console.log('1. Estado de autenticación cambiado:', {
        autenticado: !!user,
        timestamp: new Date().toISOString()
    });
    
    if (user) {
        console.log('2. Usuario autenticado:', {
            email: user.email,
            uid: user.uid,
            displayName: user.displayName
        });
        
        // Verificar elementos del DOM
        const authContainer = document.getElementById('authContainer');
        const chatContainer = document.getElementById('chatContainer');
        console.log('3. Elementos del contenedor:', {
            authContainer: !!authContainer,
            chatContainer: !!chatContainer
        });

        // Cambiar visibilidad
        if (authContainer) authContainer.style.display = 'none';
        if (chatContainer) chatContainer.style.display = 'block';
        
        console.log('4. Visibilidad actualizada');

        try {
            // Actualizar UI
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
                console.log('5. Email de usuario actualizado en UI');
            }

            // Actualizar presencia
            console.log('6. Iniciando actualización de presencia');
            await updatePresence(user);
            
            // Verificar datos de usuario
            const userRef = ref(database, `users/${user.uid}`);
            const snapshot = await get(userRef);
            
            console.log('7. Datos de usuario obtenidos:', {
                existe: snapshot.exists(),
                datos: snapshot.val()
            });

            if (snapshot.exists()) {
                const usernameElement = document.getElementById('username');
                if (usernameElement) {
                    usernameElement.textContent = snapshot.val().username;
                    console.log('8. Nombre de usuario actualizado en UI');
                }
            } else {
                console.log('9. Usuario nuevo - Mostrando modal');
                const modal = document.getElementById('usernameModal');
                if (modal) modal.style.display = 'block';
            }

            // Inicializar chat
            console.log('10. Iniciando configuración del chat');
            initializeChat();

        } catch (error) {
            console.error('Error en configuración inicial:', error);
        }
    } else {
        console.log('X. No hay usuario autenticado');
        const authContainer = document.getElementById('authContainer');
        const chatContainer = document.getElementById('chatContainer');
        
        if (authContainer) authContainer.style.display = 'flex';
        if (chatContainer) chatContainer.style.display = 'none';
    }
});

// Función para inicializar el chat
function initializeChat() {
    console.log('11. Inicializando chat');
    
    // Verificar elementos del chat
    const elements = {
        messages: document.getElementById('messages'),
        messageInput: document.getElementById('messageInput'),
        usersList: document.getElementById('usersList'),
        userCount: document.getElementById('userCount')
    };

    console.log('12. Elementos del chat:', {
        messagesExiste: !!elements.messages,
        inputExiste: !!elements.messageInput,
        usersListExiste: !!elements.usersList,
        userCountExiste: !!elements.userCount
    });

    // Configurar listener de mensajes
    const messagesRef = ref(database, 'messages');
    console.log('13. Configurando listener de mensajes');
    
    onChildAdded(messagesRef, (snapshot) => {
        console.log('14. Nuevo mensaje recibido:', snapshot.val());
        displayMessage(snapshot.val());
    });

    // Configurar listener de presencia
    const presenceRef = ref(database, 'presence');
    console.log('15. Configurando listener de presencia');
    
    onValue(presenceRef, (snapshot) => {
        console.log('16. Actualización de presencia recibida');
        updateUsersList(snapshot);
    });
}

// Función para mostrar mensajes
function displayMessage(message) {
    console.log('17. Mostrando mensaje:', message);
    const messagesDiv = document.getElementById('messages');
    
    if (!messagesDiv) {
        console.error('18. Error: contenedor de mensajes no encontrado');
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    const isCurrentUser = message.userId === auth.currentUser?.uid;
    messageElement.classList.add(isCurrentUser ? 'message-own' : 'message-other');
    
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${message.userEmail}</span>
                <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="message-text">${message.text}</div>
        </div>
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    console.log('19. Mensaje agregado al DOM');
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

// Agregar listener para limpiar presencia al cerrar ventana
window.addEventListener('beforeunload', async (event) => {
    const user = auth.currentUser;
    if (user) {
        await clearPresence(user.uid);
    }
});

// Función para enviar mensajes
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message) {
        const user = auth.currentUser;
        if (user) {
            const messagesRef = ref(database, 'messages');
            push(messagesRef, {
                text: message,
                userId: user.uid,
                userEmail: user.email,
                timestamp: serverTimestamp()
            });
            messageInput.value = '';
        }
    }
}

// Agregar evento de tecla Enter para enviar mensajes
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Escuchar cambios en los mensajes
onChildAdded(messagesRef, (snapshot) => {
    const message = snapshot.val();
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    // Verificar si el mensaje es del usuario actual
    const isCurrentUser = message.userId === auth.currentUser?.uid;
    messageElement.classList.add(isCurrentUser ? 'message-own' : 'message-other');
    
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${message.userEmail}</span>
                <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="message-text">${message.text}</div>
        </div>
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Escuchar cambios en la presencia
onValue(presenceRef, (snapshot) => {
    console.log('Cambio detectado en presencia');
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

// Manejar login con email
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login exitoso:', userCredential.user.email);
        errorDiv.textContent = '';
    } catch (error) {
        console.error('Error en login:', error);
        if (error.code === 'auth/user-not-found') {
            // Si el usuario no existe, lo creamos
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                console.log('Usuario creado exitosamente');
            } catch (createError) {
                console.error('Error creando usuario:', createError);
                errorDiv.textContent = 'Error al crear usuario';
            }
        } else {
            errorDiv.textContent = 'Error en el inicio de sesión';
        }
    }
});