const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./base-datos/conexion');

// Rutas
const usuariosRutas = require('./rutas/usuarios.rutas');       
const contenidoRutas = require('./rutas/contenido.rutas');     
const publicacionRutas = require('./rutas/publicacion.rutas'); 
const metricasRutas = require('./rutas/metricas.rutas');       

const app = express();
const PUERTO = 3000;

// Intermediarios globales
app.use(cors());
app.use(express.json());

// Montaje de rutas API
app.use('/api/usuarios', usuariosRutas);
app.use('/api/contenido', contenidoRutas);
app.use('/api/publicacion', publicacionRutas);
app.use('/api/metricas', metricasRutas);

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'publico')));

// Endpoint de prueba de salud
app.get('/api/estado', (req, res) => {
  res.json({ mensaje: 'Backend del portal activo y conectado a SQLite' });
});

app.listen(PUERTO, () => {
  console.log(`Servidor activo en http://localhost:${PUERTO}`);
});