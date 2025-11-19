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


// Archivo donde se van a guardar los registros
const REGISTROS_FILE = path.join(DATA_DIR, 'registros.json');

// Cargar registros desde el archivo (si existe)
let registros = [];

try {
  if (fs.existsSync(REGISTROS_FILE)) {
    const rawReg = fs.readFileSync(REGISTROS_FILE, 'utf8');
    registros = JSON.parse(rawReg || '[]');
  } else {
    registros = [];
  }
  console.log(`📂 Registros cargados: ${registros.length}`);
} catch (err) {
  console.error('Error al leer registros.json:', err);
  registros = [];
}

function guardarRegistrosEnArchivo() {
  try {
    fs.writeFileSync(REGISTROS_FILE, JSON.stringify(registros, null, 2), 'utf8');
    console.log('✅ Registros guardados en', REGISTROS_FILE);
  } catch (err) {
    console.error('❌ Error al guardar registros:', err);
  }
}

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

// Ruta para obtener todos los registros
app.get('/api/registros', (req, res) => {
  res.json(registros);
});

// Ruta para agregar un registro nuevo
app.post('/api/registros', (req, res) => {
  const nuevoRegistro = req.body;

  // Validación mínima
  if (!nuevoRegistro ||
      typeof nuevoRegistro.conductor !== 'string' ||
      typeof nuevoRegistro.vehiculo !== 'string' ||
      (typeof nuevoRegistro.nroAuto !== 'string' && typeof nuevoRegistro.nroAuto !== 'number') ||
      !Array.isArray(nuevoRegistro.alumnos)) {
    return res.status(400).json({ error: 'Formato de registro inválido' });
  }

  // Normalizar registro y agregar arrays de estado
  const alumnos = nuevoRegistro.alumnos;
  const registroNormalizado = {
    conductor: nuevoRegistro.conductor,
    vehiculo: nuevoRegistro.vehiculo,
    nroAuto: String(nuevoRegistro.nroAuto),
    alumnos,
    noAutorizado: !!nuevoRegistro.noAutorizado,
    enviadoAcceso: new Array(alumnos.length).fill(false),
    retirado: new Array(alumnos.length).fill(false)
  };

  registros.push(registroNormalizado);
  guardarRegistrosEnArchivo();

  res.json({ ok: true, total: registros.length });
});


// Ruta para actualizar el estado de un checkbox (envío a acceso / retirado)
app.patch('/api/registros/estado', (req, res) => {
  const { registroIndex, alumnoIndex, campo, valor } = req.body;

  if (
    typeof registroIndex !== 'number' ||
    typeof alumnoIndex !== 'number' ||
    !['enviadoAcceso', 'retirado'].includes(campo)
  ) {
    return res.status(400).json({ error: 'Datos inválidos para actualizar estado' });
  }

  const reg = registros[registroIndex];
  if (!reg) {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }

  // Asegurar que existan los arrays
  if (!Array.isArray(reg.enviadoAcceso)) {
    reg.enviadoAcceso = new Array(reg.alumnos.length).fill(false);
  }
  if (!Array.isArray(reg.retirado)) {
    reg.retirado = new Array(reg.alumnos.length).fill(false);
  }

  // Actualizar el campo correspondiente
  reg[campo][alumnoIndex] = !!valor;

  guardarRegistrosEnArchivo();

  res.json({ ok: true });
});


// Ruta para limpiar todos los registros
app.delete('/api/registros', (req, res) => {
  registros = [];
  guardarRegistrosEnArchivo();
  res.json({ ok: true });
});
