const express = require('express');
const db = require('../base-datos/conexion');
const { autenticarToken, permitirRoles } = require('../intermediario/verificar_rol');

const router = express.Router();

// MODIFICAR ESTADO EDITORIAL (Acceso: EDITOR o ADMINISTRADOR)
router.put('/articulos/:id/estado', autenticarToken, permitirRoles('EDITOR', 'ADMINISTRADOR'), (req, res) => {
  const { id } = req.params;
  const { nuevoEstado } = req.body; // 'PUBLICADO', 'RECHAZADO', 'ELIMINADO'

  const estadosValidos = ['BORRADOR', 'PUBLICADO', 'RECHAZADO', 'ELIMINADO'];
  if (!estadosValidos.includes(nuevoEstado)) {
    return res.status(400).json({ error: 'Estado editorial no válido' });
  }

  const stmt = db.prepare(`
    UPDATE articulos 
    SET estado = ?, actualizado_en = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  const resultado = stmt.run(nuevoEstado, id);

  if (resultado.changes === 0) {
    return res.status(404).json({ error: 'Artículo no encontrado' });
  }

  res.json({ mensaje: `Artículo actualizado al estado: ${nuevoEstado}` });
});

// Listado de revisión para el Editor (todos los artículos no eliminados)
router.get('/articulos/revision', autenticarToken, permitirRoles('EDITOR', 'ADMINISTRADOR'), (req, res) => {
  const articulos = db.prepare(`
    SELECT a.id, a.titulo, a.categoria, a.estado, a.creado_en, u.nombre as autor
    FROM articulos a
    JOIN usuarios u ON a.autor_id = u.id
    WHERE a.estado != 'ELIMINADO'
    ORDER BY a.creado_en DESC
  `).all();

  res.json({ articulos });
});

// Previsualización completa (Editor, Administrador y Redactor para sus propias notas)
router.get('/articulos/previsualizar/:id', autenticarToken, permitirRoles('REDACTOR', 'EDITOR', 'ADMINISTRADOR'), (req, res) => {
  const noticia = db.prepare(`
    SELECT a.id, a.autor_id, a.titulo, a.resumen, a.contenido, a.categoria, a.imagen_url, a.estado, a.creado_en, u.nombre as autor
    FROM articulos a
    JOIN usuarios u ON a.autor_id = u.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!noticia) {
    return res.status(404).json({ error: 'Artículo no encontrado' });
  }

  // Si el usuario es REDACTOR, solo puede previsualizar si es el autor original
  if (req.usuario.rol === 'REDACTOR' && noticia.autor_id !== req.usuario.id) {
    return res.status(403).json({ error: 'No tienes permiso para previsualizar artículos de otros redactores' });
  }

  res.json({ noticia });
});

// RECUPERAR Y SERVIR NOTICIAS (Público para LECTORES)
router.get('/noticias', (req, res) => {
  const { categoria } = req.query;

  let consulta = `
    SELECT a.id, a.titulo, a.resumen, a.contenido, a.categoria, a.imagen_url, a.creado_en, u.nombre as autor
    FROM articulos a
    JOIN usuarios u ON a.autor_id = u.id
    WHERE a.estado = 'PUBLICADO'
  `;
  const params = [];

  if (categoria && categoria !== 'TODAS') {
    consulta += ' AND a.categoria = ?';
    params.push(categoria);
  }

  consulta += ' ORDER BY a.creado_en DESC';

  const noticias = db.prepare(consulta).all(...params);
  res.json({ noticias });
});

// Obtener el TOP 5 de noticias más leídas
router.get('/noticias/mas-leidas', (req, res) => {
  try {
    const top5 = db.prepare(`
      SELECT 
        a.id, 
        a.titulo, 
        a.categoria,
        COUNT(m.id) as total_vistas
      FROM articulos a
      LEFT JOIN metricas m ON a.id = m.articulo_id
      WHERE a.estado = 'PUBLICADO'
      GROUP BY a.id
      ORDER BY total_vistas DESC, a.creado_en DESC
      LIMIT 5
    `).all();

    res.json({ masLeidas: top5 });
  } catch (error) {
    console.error('Error al obtener más leídas:', error);
    res.status(500).json({ error: 'Error al consultar tendencias' });
  }
});

// Noticia individual por ID
router.get('/noticias/:id', (req, res) => {
  const noticia = db.prepare(`
    SELECT a.id, a.titulo, a.resumen, a.contenido, a.categoria, a.imagen_url, a.creado_en, u.nombre as autor
    FROM articulos a
    JOIN usuarios u ON a.autor_id = u.id
    WHERE a.id = ? AND a.estado = 'PUBLICADO'
  `).get(req.params.id);

  if (!noticia) {
    return res.status(404).json({ error: 'Noticia no encontrada o no disponible' });
  }

  res.json({ noticia });
});

// EMITIR NOTIFICACIONES PUSH
router.get('/notificaciones', (req, res) => {
  const ultimasNoticias = db.prepare(`
    SELECT id, titulo, categoria, creado_en 
    FROM articulos 
    WHERE estado = 'PUBLICADO' 
    ORDER BY actualizado_en DESC 
    LIMIT 5
  `).all();

  res.json({ notificaciones: ultimasNoticias });
});

module.exports = router;