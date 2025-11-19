// server.js
const express = require('express');
const path = require('path');

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal que servirá el archivo Maimosalidas.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Maimosalida.html'));
});

// Ruta principal que servirá el archivo Maimosalidas.html
app.get('/Maimosalida', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Maimosalida.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});