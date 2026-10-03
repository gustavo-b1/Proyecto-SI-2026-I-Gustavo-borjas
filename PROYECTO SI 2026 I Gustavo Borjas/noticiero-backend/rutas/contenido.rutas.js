const express = require('express');
const db = require('../base-datos/conexion');
const { autenticarToken, permitirRoles } = require('../intermediario/verificar_rol');

const router = express.Router();

// Redactor crea borrador
router.post('/borrador', autenticarToken, permitirRoles('REDACTOR', 'ADMINISTRADOR'), (req, res) => {
  const { titulo, resumen, contenido, categoria, imagen_url } = req.body;

  if (!titulo || !contenido || !categoria) {
    return res.status(400).json({ error: 'Título, contenido y categoría son obligatorios' });
  }

  const stmt = db.prepare(`
    INSERT INTO articulos (titulo, resumen, contenido, categoria, imagen_url, estado, autor_id)
    VALUES (?, ?, ?, ?, ?, 'BORRADOR', ?)
  `);

  const resultado = stmt.run(
    titulo, 
    resumen || '', 
    contenido, 
    categoria, 
    imagen_url || '', 
    req.usuario.id
  );

  // Respuesta transaccional: Estado de artículo
  res.status(201).json({
    mensaje: 'Borrador guardado exitosamente',
    articuloId: resultado.lastInsertRowid,
    estado: 'BORRADOR'
  });
});

// Listar borradores propios del Redactor
router.get('/mis-borradores', autenticarToken, permitirRoles('REDACTOR', 'ADMINISTRADOR'), (req, res) => {
  const articulos = db.prepare(`
    SELECT id, titulo, categoria, estado, creado_en 
    FROM articulos 
    WHERE autor_id = ? AND estado != 'ELIMINADO'
    ORDER BY creado_en DESC
  `).all(req.usuario.id);

  res.json({ articulos });
});

// Modificar borrador existente
router.put('/borrador/:id', autenticarToken, permitirRoles('REDACTOR', 'ADMINISTRADOR'), (req, res) => {
  const { id } = req.params;
  const { titulo, resumen, contenido, categoria, imagen_url } = req.body;

  const articulo = db.prepare('SELECT * FROM articulos WHERE id = ?').get(id);
  if (!articulo) {
    return res.status(404).json({ error: 'Artículo no encontrado' });
  }

  // Verificar que el redactor sea el autor o un administrador
  if (articulo.autor_id !== req.usuario.id && req.usuario.rol !== 'ADMINISTRADOR') {
    return res.status(403).json({ error: 'No tienes permiso para modificar este artículo' });
  }

  const stmt = db.prepare(`
    UPDATE articulos 
    SET titulo = ?, resumen = ?, contenido = ?, categoria = ?, imagen_url = ?, actualizado_en = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    titulo || articulo.titulo,
    resumen !== undefined ? resumen : articulo.resumen,
    contenido || articulo.contenido,
    categoria || articulo.categoria,
    imagen_url !== undefined ? imagen_url : articulo.imagen_url,
    id
  );

  res.json({ mensaje: 'Borrador actualizado con éxito' });
});

module.exports = router;