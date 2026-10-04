require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Inicializa el archivo local editorial.db
const db = new Database(path.join(__dirname, 'editorial.db'));

// Habilita claves foráneas
db.pragma('foreign_keys = ON');

// USUARIOS
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    clave TEXT NOT NULL,
    rol TEXT CHECK(rol IN ('ADMINISTRADOR', 'EDITOR', 'REDACTOR', 'LECTOR')) DEFAULT 'LECTOR',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ARTICULOS
db.exec(`
  CREATE TABLE IF NOT EXISTS articulos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    resumen TEXT,
    contenido TEXT NOT NULL,
    categoria TEXT NOT NULL,
    imagen_url TEXT,
    estado TEXT CHECK(estado IN ('BORRADOR', 'PUBLICADO', 'RECHAZADO', 'ELIMINADO')) DEFAULT 'BORRADOR',
    autor_id INTEGER NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
  );
`);

// METRICAS
db.exec(`
  CREATE TABLE IF NOT EXISTS metricas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    articulo_id INTEGER NOT NULL,
    tiempo_permanencia INTEGER DEFAULT 0,
    direccion_ip TEXT,
    registrado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (articulo_id) REFERENCES articulos(id)
  );
`);

module.exports = db;

// Semilla: Crear administrador por defecto si no existe ninguno
const existeAdmin = db.prepare("SELECT id FROM usuarios WHERE rol = 'ADMINISTRADOR'").get();
if (!existeAdmin) {
  const correoAdmin = process.env.ADMIN_EMAIL;
  const clavePlanaAdmin = process.env.ADMIN_PASSWORD;

  const claveAdminHash = bcrypt.hashSync(clavePlanaAdmin, 10);
  db.prepare(`
    INSERT INTO usuarios (nombre, correo, clave, rol) 
    VALUES ('Administrador', ?, ?, 'ADMINISTRADOR')
  `).run(correoAdmin, claveAdminHash);
  console.log(`Usuario administrador por defecto creado)`);
}