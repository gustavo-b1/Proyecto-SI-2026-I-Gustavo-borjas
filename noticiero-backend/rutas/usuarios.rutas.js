const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../base-datos/conexion');
const { autenticarToken, permitirRoles, CLAVE_SECRETA } = require('../intermediario/verificar_rol');

const router = express.Router();

// Registro de usuario (por defecto rol LECTOR)
router.post('/registro', (req, res) => {
  const { nombre, correo, clave } = req.body;

  if (!nombre || !correo || !clave) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const claveHasheada = bcrypt.hashSync(clave, 10);
    const stmt = db.prepare(`
      INSERT INTO usuarios (nombre, correo, clave, rol) 
      VALUES (?, ?, ?, 'LECTOR')
    `);
    const resultado = stmt.run(nombre, correo, claveHasheada);

    res.status(201).json({ 
      mensaje: 'Usuario registrado con éxito', 
      usuarioId: resultado.lastInsertRowid 
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }
    res.status(500).json({ error: 'Error interno al registrar usuario' });
  }
});

// Inicio de sesión
router.post('/login', (req, res) => {
  const { correo, clave } = req.body;

  if (!correo || !clave) {
    return res.status(400).json({ error: 'Debe ingresar correo y clave' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo);

  if (!usuario || !bcrypt.compareSync(clave, usuario.clave)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const payload = {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol
  };

  const token = jwt.sign(payload, CLAVE_SECRETA, { expiresIn: '8h' });

  res.json({
    mensaje: 'Inicio de sesión exitoso',
    token,
    usuario: payload
  });
});

// Obtener lista del EQUIPO EDITORIAL (Solo REDACTOR y EDITOR)
router.get('/lista', autenticarToken, permitirRoles('ADMINISTRADOR'), (req, res) => {
  try {
    const usuarios = db.prepare(`
      SELECT id, nombre, correo, rol, creado_en
      FROM usuarios
      WHERE rol IN ('REDACTOR', 'EDITOR')
      ORDER BY rol ASC, nombre ASC
    `).all();

    res.json({ usuarios });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el equipo de trabajo' });
  }
});

// Asignar o Modificar Rol por Correo Electrónico
router.put('/rol', autenticarToken, permitirRoles('ADMINISTRADOR'), (req, res) => {
  const { correo, nuevoRol, usuarioId } = req.body;

  // SEGURIDAD: Nadie puede crear administradores desde la web
  if (nuevoRol === 'ADMINISTRADOR') {
    return res.status(403).json({ error: 'Operación no permitida: el rol ADMINISTRADOR solo puede asignarse manualmente en la base de datos.' });
  }

  // Solo se permite promover a REDACTOR, EDITOR o degradar a LECTOR
  if (!['REDACTOR', 'EDITOR', 'LECTOR'].includes(nuevoRol)) {
    return res.status(400).json({ error: 'Rol seleccionado no válido.' });
  }

  try {
    let usuarioObjetivo;

    if (correo) {
      usuarioObjetivo = db.prepare('SELECT id, nombre, correo, rol FROM usuarios WHERE LOWER(correo) = LOWER(?)').get(correo.trim());
      if (!usuarioObjetivo) {
        return res.status(404).json({ error: 'No se encontró ningún usuario con ese correo electrónico.' });
      }
    } else if (usuarioId) {
      usuarioObjetivo = db.prepare('SELECT id, nombre, correo, rol FROM usuarios WHERE id = ?').get(usuarioId);
      if (!usuarioObjetivo) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }
    } else {
      return res.status(400).json({ error: 'Debes proporcionar un correo o un identificador de usuario.' });
    }

    // Proteger al administrador de ser alterado
    if (usuarioObjetivo.rol === 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'No es posible modificar el rol del Administrador principal.' });
    }

    db.prepare('UPDATE usuarios SET rol = ? WHERE id = ?').run(nuevoRol, usuarioObjetivo.id);

    res.json({ 
      mensaje: `El usuario ${usuarioObjetivo.nombre} (${usuarioObjetivo.correo}) ahora tiene el rol: ${nuevoRol}` 
    });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el cambio de rol.' });
  }
});

module.exports = router;