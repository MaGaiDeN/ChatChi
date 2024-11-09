import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onChildAdded, onValue } from 'firebase/database';
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

// Función para verificar la conexión
function testConnection() {
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            console.log('✅ Conectado a Firebase');
        } else {
            console.log('❌ Desconectado de Firebase');
        }
    });
}

// Función para probar escritura
async function testWrite() {
    try {
        const testRef = ref(database, 'test');
        await push(testRef, {
            mensaje: "Prueba de escritura",
            timestamp: Date.now()
        });
        console.log('✅ Prueba de escritura exitosa');
    } catch (error) {
        console.error('❌ Error en prueba de escritura:', error);
    }
}

// Función para probar lectura
function testRead() {
    const messagesRef = ref(database, 'messages');
    onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        console.log('📖 Datos actuales en messages:', data);
    }, (error) => {
        console.error('❌ Error en lectura:', error);
    });
}

// Ejecutar pruebas al cargar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando pruebas de Firebase...');
    testConnection();
    testWrite();
    testRead();
});

// Función para enviar mensajes
window.sendMessage = async function() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    
    if (message.trim() !== '') {
        try {
            await push(messagesRef, {
                text: message,
                timestamp: Date.now()
            });
            console.log('✅ Mensaje enviado correctamente');
            messageInput.value = '';
        } catch (error) {
            console.error('❌ Error al enviar mensaje:', error);
        }
    }
}

// Escuchar nuevos mensajes
onChildAdded(messagesRef, (snapshot) => {
    const message = snapshot.val();
    const messagesDiv = document.getElementById('messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = message.text;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}); 