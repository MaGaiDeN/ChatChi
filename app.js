// Configuración de Firebase
const firebaseConfig = {
    // Aquí va tu configuración de Firebase
    apiKey: "tu-api-key",
    authDomain: "tu-auth-domain",
    projectId: "tu-project-id",
    databaseURL: "tu-database-url",
    storageBucket: "tu-storage-bucket",
    messagingSenderId: "tu-messaging-sender-id",
    appId: "tu-app-id"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const messagesRef = database.ref('messages');

// Función para enviar mensajes
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    
    if (message.trim() !== '') {
        messagesRef.push({
            text: message,
            timestamp: Date.now()
        });
        messageInput.value = '';
    }
}

// Escuchar nuevos mensajes
messagesRef.on('child_added', (snapshot) => {
    const message = snapshot.val();
    const messagesDiv = document.getElementById('messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = message.text;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}); 