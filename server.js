const express = require('express');
const session = require('express-session');
const socketio = require('socket.io');
const http = require('http');
const nodemailer = require('nodemailer');
require('dotenv').config();





// Configuración de la aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const fs = require('fs');
const path = require('path');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Detectar si estamos en Render (producción)
const isRender = !!process.env.RENDER;

// ----------------- CONFIGURACIÓN SMTP -----------------
// Configuración de mail (usar env vars en producción/local)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                  
  port: Number(process.env.SMTP_PORT) || 587,   
  secure: process.env.SMTP_SECURE === 'true',   
  auth: {
    user: process.env.SMTP_USER,                
    pass: process.env.SMTP_PASS                 
  }
});


if (!isRender) {
    // MODO LOCAL: sólo intentamos configurar SMTP si hay credenciales
    const smtpUser = process.env.MAIL_USER;
    const smtpPass = process.env.MAIL_PASS;

    if (smtpUser && smtpPass) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });

        console.log("📬 SMTP configurado en modo LOCAL");
    } else {
        console.log("📭 SMTP no configurado en LOCAL (faltan MAIL_USER o MAIL_PASS)");
    }
} else {
    console.log("📪 Servidor detectado en Render → envío de mails DESACTIVADO");
}

// ----------------- FUNCIÓN PARA ENVIAR BACKUP -----------------
async function enviarBackupFamiliasPorMail() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('📭 SMTP no configurado, no se envía mail (modo local / faltan env vars)');
    return;
  }

  try {
    const contenido = JSON.stringify(familias, null, 2);

    console.log('✉️ Intentando enviar backup de familias a:', 'nat.matellan@gmail.com');

    const info = await transporter.sendMail({
      from: `"Maimosalida" <${process.env.SMTP_USER}>`,
      to: 'nat.matellan@gmail.com',
      subject: 'Backup familias actualizado',
      text: 'Adjunto el backup actual de familias.json',
      attachments: [
        {
          filename: 'familias.json',
          content: contenido
        }
      ]
    });

    console.log('📧 Backup de familias enviado por mail. messageId:', info.messageId);
  } catch (err) {
    console.error('❌ Error enviando backup por mail:', err.message || err);
  }
}




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

    // 🔔 Avisar a todos los clientes que hubo cambios en el listado
    io.emit('registrosActualizados');
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


// Usuarios válidos SOLO en el servidor
// Podés agregar más acá
const usuariosValidos = {
  Direccion: {
    password: "maimodire750",
    nombre: "Administrador",
    rol: "admin"
  },
  LucasHubscher: {
    password: "kabat85",
    nombre: "Lucas Hubscher",
    rol: "admin"
  },
  Jerocorrea: {
    password: "kukannabis2026",
    nombre: "Jero Correa",
    rol: "operador"
  },
  carla: {
    password: "clave456",
    nombre: "Carla",
    rol: "operador"
  },
  mariana: {
    password: "sergioSalame123",
    nombre: "Mariana",
    rol: "operador"
  },

  // 👉 Ejemplos de usuarios nuevos (podés cambiarlos)
  Nat: {
    password: "nat2024",
    nombre: "Nat",
    rol: "operador"
  },
  acceso1: {
    password: "acceso123",
    nombre: "Puesto Acceso 1",
    rol: "operador"
  }
};


// Login simple: valida usuario/clave en el servidor
app.post('/api/login', (req, res) => {
  const { usuario, clave } = req.body || {};

  if (!usuario || !clave) {
    return res.status(400).json({
      ok: false,
      message: "Faltan usuario o contraseña"
    });
  }

  const user = usuariosValidos[usuario];

  if (!user || user.password !== clave) {
    return res.status(401).json({
      ok: false,
      message: "Usuario o contraseña incorrectos"
    });
  }

  // (En la versión pro después podemos guardar en la sesión)
  // req.session.usuario = { username: usuario, rol: user.rol };

  return res.json({
    ok: true,
    usuario,
    nombre: user.nombre,
    rol: user.rol
  });
});



// Ruta para obtener todas las familias
app.get('/api/familias', (req, res) => {
  res.json(familias);
});


// Ruta para agregar una familia nueva
app.post('/api/familias', async (req, res) => {
  const nuevoGrupo = req.body;

  // Validación mínima
  if (!nuevoGrupo || !Array.isArray(nuevoGrupo.parientes) || !Array.isArray(nuevoGrupo.alumnos)) {
    return res.status(400).json({ error: 'Formato de familia inválido' });
  }

  familias.push(nuevoGrupo);
  guardarFamiliasEnArchivo();

  // Enviar mail, pero sin romper la respuesta si falla
  enviarBackupFamiliasPorMail()
    .then(() => console.log('📨 Proceso de backup por mail terminado'))
    .catch(err => console.error('❌ Error inesperado en backup por mail:', err));

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
app.post('/api/registros/estado', (req, res) => {
  const { registroIndex, alumnoIndex, campo, valor } = req.body;

  console.log('📝 Actualizar estado:', { registroIndex, alumnoIndex, campo, valor });

  if (
    typeof registroIndex !== 'number' ||
    typeof alumnoIndex !== 'number' ||
    !['enviadoAcceso', 'retirado'].includes(campo)
  ) {
    console.warn('⚠ Datos inválidos para actualizar estado:', req.body);
    return res.status(400).json({ ok: false, error: 'Datos inválidos para actualizar estado' });
  }

  const reg = registros[registroIndex];
  if (!reg) {
    console.warn('⚠ Registro no encontrado para índice:', registroIndex);
    return res.status(404).json({ ok: false, error: 'Registro no encontrado' });
  }

  // Asegurar que existan los arrays
  if (!Array.isArray(reg.enviadoAcceso)) {
    reg.enviadoAcceso = new Array(reg.alumnos.length).fill(false);
  }
  if (!Array.isArray(reg.retirado)) {
    reg.retirado = new Array(reg.alumnos.length).fill(false);
  }

  // Ajustar tamaños si cambia la cantidad de alumnos
  if (reg.enviadoAcceso.length < reg.alumnos.length) {
    reg.enviadoAcceso = [
      ...reg.enviadoAcceso,
      ...new Array(reg.alumnos.length - reg.enviadoAcceso.length).fill(false)
    ];
  }
  if (reg.retirado.length < reg.alumnos.length) {
    reg.retirado = [
      ...reg.retirado,
      ...new Array(reg.alumnos.length - reg.retirado.length).fill(false)
    ];
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
