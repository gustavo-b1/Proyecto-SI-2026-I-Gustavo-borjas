const express = require('express');
const db = require('../base-datos/conexion');
const { autenticarToken, permitirRoles } = require('../intermediario/verificar_rol');

const router = express.Router();

// REGISTRAR CONSUMO
router.post('/registrar', (req, res) => {
  const { articuloId, tiempoPermanencia } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!articuloId) {
    return res.status(400).json({ error: 'El ID del artículo es obligatorio' });
  }

  const stmt = db.prepare(`
    INSERT INTO metricas (articulo_id, tiempo_permanencia, direccion_ip)
    VALUES (?, ?, ?)
  `);
  stmt.run(articuloId, tiempoPermanencia || 0, ip);

  res.status(201).json({ mensaje: 'Métrica registrada' });
});

// PANEL ANALÍTICO
router.get('/panel', autenticarToken, permitirRoles('EDITOR', 'ADMINISTRADOR'), (req, res) => {
  const resumen = db.prepare(`
    SELECT 
      a.id, 
      a.titulo, 
      a.categoria,
      COUNT(m.id) AS total_vistas,
      ROUND(AVG(m.tiempo_permanencia), 1) AS promedio_segundos
    FROM articulos a
    LEFT JOIN metricas m ON a.id = m.articulo_id
    WHERE a.estado = 'PUBLICADO'
    GROUP BY a.id
    ORDER BY total_vistas DESC
  `).all();

  res.json({ panelAnalitico: resumen });
});

module.exports = router;