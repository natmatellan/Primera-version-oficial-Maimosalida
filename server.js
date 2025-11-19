const express = require('express');
const session = require('express-session');
const socketio = require('socket.io');
const http = require('http');

// Configuración de la aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const fs = require('fs');
const path = require('path');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Configurar middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesiones
app.use(session({
  secret: 'mi_secreto_super_seguro',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cambiar a true en producción con HTTPS
}));

// Middleware para compartir sesión con Socket.io
const sharedSession = require('express-socket.io-session');
io.use(sharedSession(session({
  secret: 'mi_secreto_super_seguro',
  resave: false,
  saveUninitialized: true
}), {
  autoSave: true
}));



// Archivo donde se van a guardar las familias
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'familias.json');

// Asegurar que exista la carpeta data
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Cargar familias desde el archivo (si existe)
let familias = [];

try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    familias = JSON.parse(raw || '[]');
  } else {
    familias = [];
  }
  console.log(`📂 Familias cargadas: ${familias.length}`);
} catch (err) {
  console.error('Error al leer familias.json:', err);
  familias = [];
}


function guardarFamiliasEnArchivo() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(familias, null, 2), 'utf8');
    console.log('✅ Familias guardadas en', DATA_FILE);
  } catch (err) {
    console.error('❌ Error al guardar familias:', err);
  }
}


// Ruta principal
app.get('/', (req, res) => {
  req.session.visitCount = (req.session.visitCount || 0) + 1;
  res.sendFile(__dirname +'/public' + '/Maimosalida.html');
});

// Ruta principal
app.get('/Maimosalida', (req, res) => {
  req.session.visitCount = (req.session.visitCount || 0) + 1;
  res.sendFile(__dirname +'/public' + '/Maimosalida.html');
});

// Conexión de Socket.io
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');
  
  // Usar la sesión del socket
  const session = socket.handshake.session;
  
  // Inicializar contador de socket si no existe
  session.socketCount = (session.socketCount || 0) + 1;
  session.save();
  
  // Enviar datos de sesión al cliente
  socket.emit('sessionData', {
    visitCount: session.visitCount,
    socketCount: session.socketCount
  });
  
  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


// Datos de usuarios válidos
const usuariosValidos = {
  "admin": "1234",
  "LucasHubscher": "kabat85",
  "lucas": "pass123",
  "carla": "clave456",
  "mariana": "sergioSalame123"
};

// Ruta para obtener usuarios
app.get('/users', (req, res) => {
  res.json(usuariosValidos);
});

app.post('/users', (req, res) => {
  console.log(req.body);
});


// Ruta para obtener todas las familias
app.get('/api/familias', (req, res) => {
  res.json(familias);
});

// Ruta para agregar una familia nueva
app.post('/api/familias', (req, res) => {
  const nuevoGrupo = req.body;

  // Validación mínima
  if (!nuevoGrupo || !Array.isArray(nuevoGrupo.parientes) || !Array.isArray(nuevoGrupo.alumnos)) {
    return res.status(400).json({ error: 'Formato de familia inválido' });
  }

  familias.push(nuevoGrupo);
  guardarFamiliasEnArchivo();

  res.json({ ok: true, total: familias.length });
});
