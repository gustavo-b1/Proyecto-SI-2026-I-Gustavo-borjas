const jwt = require('jsonwebtoken');
const CLAVE_SECRETA = 'clave';

function autenticarToken(req, res, next) {
  const encabezadoAuth = req.headers['authorization'];
  const token = encabezadoAuth && encabezadoAuth.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado: token faltante' });
  }

  jwt.verify(token, CLAVE_SECRETA, (err, usuario) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.usuario = usuario;
    next();
  });
}

function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ 
        error: `Acceso restringido. Se requiere rol: ${rolesPermitidos.join(' o ')}` 
      });
    }
    next();
  };
}

module.exports = {
  autenticarToken,
  permitirRoles,
  CLAVE_SECRETA
};