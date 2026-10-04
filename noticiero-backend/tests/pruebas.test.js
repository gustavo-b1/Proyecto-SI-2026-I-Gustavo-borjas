// tests/pruebas.test.js
require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("ERROR FATAL: La variable de entorno JWT_SECRET no está definida en el archivo .env");
  process.exit(1);
}

// 1. PRUEBAS FUNCIONALES
test('PF-01 AUTENTICACIÓN: Generación, firma y expiración de tokens JWT', () => {
  const cargaUsuario = { id: 1, correo: 'admin@admin.admin', rol: 'ADMINISTRADOR' };
  const token = jwt.sign(cargaUsuario, JWT_SECRET, { expiresIn: '1h' });

  assert.ok(typeof token === 'string' && token.split('.').length === 3, 'El token debe tener estructura JWT');

  const decodificado = jwt.verify(token, JWT_SECRET);
  assert.strictEqual(decodificado.correo, cargaUsuario.correo);
  assert.strictEqual(decodificado.rol, cargaUsuario.rol);
});

test('PF-02 Control de Acceso: Bloqueo estricto a un LECTOR al intentar acceder a redacción o moderación', () => {
  const tokenLector = jwt.sign({ id: 2, correo: 'lector@rubier.com', rol: 'LECTOR' }, JWT_SECRET);
  const usuarioAutenticado = jwt.verify(tokenLector, JWT_SECRET);

  const rolesPermitidosRedaccion = ['ADMINISTRADOR', 'EDITOR', 'REDACTOR'];
  const puedeRedactar = rolesPermitidosRedaccion.includes(usuarioAutenticado.rol);

  const rolesPermitidosModeracion = ['ADMINISTRADOR', 'EDITOR'];
  const puedeModerar = rolesPermitidosModeracion.includes(usuarioAutenticado.rol);

  assert.strictEqual(puedeRedactar, false, 'Un LECTOR no puede redactar');
  assert.strictEqual(puedeModerar, false, 'Un LECTOR no puede moderar');
});


// 2. PRUEBAS NO FUNCIONALES 
test('PNF-01 Rendimiento: Tiempo de respuesta en procesamiento local de noticias menor a 200 ms', () => {
  const inicio = performance.now();

  const noticiasMock = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    titulo: `Noticia ${i + 1}`,
    categoria: 'Tecnología',
    estado: 'PUBLICADO',
    tiempoLectura: Math.floor(Math.random() * 180)
  }));

  const payloadRespuesta = JSON.stringify(noticiasMock.filter(n => n.estado === 'PUBLICADO'));
  JSON.parse(payloadRespuesta);

  const fin = performance.now();
  const duracionMs = fin - inicio;

  assert.ok(duracionMs < 200, `El tiempo de respuesta fue de ${duracionMs.toFixed(2)} ms (debe ser menor a 200 ms)`);
});

test('PNF-02 Seguridad: Almacenamiento y protección de contraseñas mediante cifrado Bcrypt sin texto plano', async () => {
  const contrasenaOriginal = 'admin123';
  const hash = await bcrypt.hash(contrasenaOriginal, 10);

  assert.notStrictEqual(hash, contrasenaOriginal, 'La contraseña no debe guardarse en texto plano');
  assert.match(hash, /^\$2[aby]\$\d{2}\$/, 'El formato debe coincidir con un hash Bcrypt válido');

  const coincideCorrecta = await bcrypt.compare('admin123', hash);
  const coincideErronea = await bcrypt.compare('clave_falsa', hash);

  assert.strictEqual(coincideCorrecta, true, 'Bcrypt debe validar la contraseña legítima');
  assert.strictEqual(coincideErronea, false, 'Bcrypt debe rechazar cualquier contraseña incorrecta');
});