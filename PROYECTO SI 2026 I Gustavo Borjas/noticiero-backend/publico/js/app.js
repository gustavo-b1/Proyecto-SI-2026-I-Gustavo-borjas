// ESTADO GLOBAL Y VARIABLES DE SESIÓN
let token = localStorage.getItem('token_noticiero') || null;
let usuario = JSON.parse(localStorage.getItem('usuario_noticiero')) || null;
let tiempoInicioLectura = Date.now();
let articuloActualId = null;

// Variables de paginación y estado por módulo
let listaNoticiasPublicas = [];
let paginaActualNoticias = 1;
const NOTICIAS_PORTADA_POR_PAGINA = 6;

let listaArticulosModeracion = [];
let paginaActualModeracion = 1;
const ARTICULOS_POR_PAGINA_MODERACION = 5;

let listaMisArticulos = [];
let paginaActualMisArticulos = 1;
const ARTICULOS_POR_PAGINA_REDACTOR = 5;

let listaPersonalAdmin = [];
let paginaActualAdmin = 1;
const PERSONAL_POR_PAGINA = 10;

let listaMetricasAnalitica = [];
let paginaActualMetricas = 1;
const METRICAS_POR_PAGINA = 10;

// INICIALIZACIÓN DE LA APLICACIÓN
document.addEventListener('DOMContentLoaded', () => {
  actualizarFecha();
  actualizarInterfazUsuario();
  cargarNoticias('TODAS');
  cargarNotificaciones();
  cargarMasLeidas();
});

// FUNCIÓN GENÉRICA DE PAGINACIÓN (DRY)
function renderizarPaginacion(contenedorId, totalItems, porPagina, paginaActual, onCambio) {
  const paginador = document.getElementById(contenedorId);
  if (!paginador) return;
  paginador.innerHTML = '';

  const totalPaginas = Math.ceil(totalItems / porPagina);
  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement('button');
    btn.className = `btn-pag ${i === paginaActual ? 'activa' : ''}`;
    btn.innerText = i;
    btn.onclick = () => onCambio(i);
    paginador.appendChild(btn);
  }
}

// NOTIFICACIONES TOAST
function mostrarNotificacion(mensaje, tipo = 'exito') {
  let contenedor = document.getElementById('toast-contenedor');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'toast-contenedor';
    contenedor.className = 'toast-contenedor';
    document.body.appendChild(contenedor);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.innerHTML = `<i class="fa-solid ${tipo === 'exito' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${mensaje}`;
  
  contenedor.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// CABECERA Y FECHA DINÁMICA
function actualizarFecha() {
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaStr = new Date().toLocaleDateString('es-ES', opciones).toUpperCase();
  const fechaElem = document.getElementById('fecha-hoy');
  if (fechaElem) fechaElem.innerText = fechaStr;
}

// CONSUMO Y PORTADA DE NOTICIAS
async function cargarNoticias(categoria) {
  try {
    const url = categoria === 'TODAS' 
      ? '/api/publicacion/noticias' 
      : `/api/publicacion/noticias?categoria=${encodeURIComponent(categoria)}`;

    const resp = await fetch(url);
    const data = await resp.json();
    listaNoticiasPublicas = data.noticias || [];
    paginaActualNoticias = 1;

    renderizarPortadaNoticias();
  } catch (error) {
    console.error('Error al cargar noticias:', error);
  }
}

function renderizarPortadaNoticias() {
  const contenedorDestacada = document.getElementById('noticia-destacada');
  const contenedorGrid = document.getElementById('grid-noticias');

  if (!contenedorDestacada || !contenedorGrid) return;

  contenedorDestacada.innerHTML = '';
  contenedorGrid.innerHTML = '';

  if (listaNoticiasPublicas.length === 0) {
    contenedorDestacada.style.display = 'block';
    contenedorDestacada.removeAttribute('onclick');
    contenedorDestacada.innerHTML = '<div style="padding:40px; color:#fff; text-align:center;">No hay noticias disponibles en esta categoría.</div>';
    renderizarPaginacion('paginacion-noticias', 0, NOTICIAS_PORTADA_POR_PAGINA, 1, () => {});
    return;
  }

  // Noticia Principal Destacada
  const primera = listaNoticiasPublicas[0];
  contenedorDestacada.style.display = 'block';
  contenedorDestacada.setAttribute('onclick', `abrirNoticia(${primera.id})`);
  contenedorDestacada.innerHTML = `
    <img src="${primera.imagen_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'}" alt="${primera.titulo}">
    <div class="destacada-info">
      <span class="categoria-tag" style="color:#f1d688;">${primera.categoria}</span>
      <h2>${primera.titulo}</h2>
      <p>Por ${primera.autor} | ${new Date(primera.creado_en).toLocaleDateString()}</p>
    </div>
  `;

  // Cuadrícula Secundaria Paginada
  const secundarias = listaNoticiasPublicas.slice(1);
  const inicio = (paginaActualNoticias - 1) * NOTICIAS_PORTADA_POR_PAGINA;
  const fin = inicio + NOTICIAS_PORTADA_POR_PAGINA;
  const bloqueActual = secundarias.slice(inicio, fin);

  bloqueActual.forEach(noticia => {
    const card = document.createElement('article');
    card.className = 'tarjeta-noticia';
    card.style.cursor = 'pointer';
    card.setAttribute('onclick', `abrirNoticia(${noticia.id})`);
    card.innerHTML = `
      <img src="${noticia.imagen_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600'}" alt="${noticia.titulo}">
      <div class="tarjeta-cuerpo">
        <span class="categoria-tag">${noticia.categoria}</span>
        <h3>${noticia.titulo}</h3>
        <p class="resumen">${noticia.resumen || noticia.contenido.substring(0, 90) + '...'}</p>
        <div class="meta-info">Por ${noticia.autor} | ${new Date(noticia.creado_en).toLocaleDateString()}</div>
      </div>
    `;
    contenedorGrid.appendChild(card);
  });

  renderizarPaginacion(
    'paginacion-noticias',
    secundarias.length,
    NOTICIAS_PORTADA_POR_PAGINA,
    paginaActualNoticias,
    (nuevaPagina) => {
      paginaActualNoticias = nuevaPagina;
      renderizarPortadaNoticias();
      window.scrollTo({ top: contenedorGrid.offsetTop - 80, behavior: 'smooth' });
    }
  );
}

// Cargar el TOP 5 de noticias más leídas (Lateral)
async function cargarMasLeidas() {
  const contenedor = document.getElementById('lista-mas-leidas');
  if (!contenedor) return;

  try {
    const res = await fetch('/api/publicacion/noticias/mas-leidas');
    const data = await res.json();
    const noticias = data.masLeidas || [];

    contenedor.innerHTML = '';

    if (noticias.length === 0) {
      contenedor.innerHTML = '<div class="placeholder-vacio">No hay noticias leídas aún.</div>';
      return;
    }

    noticias.slice(0, 5).forEach((noticia, index) => {
      const item = document.createElement('div');
      item.className = 'item-tendencia';
      item.onclick = () => abrirNoticia(noticia.id);
      
      const numero = (index + 1).toString().padStart(2, '0');

      item.innerHTML = `
        <span class="numero-tendencia">${numero}</span>
        <div class="info-tendencia">
          <span class="tag">${noticia.categoria}</span>
          <h5>${noticia.titulo}</h5>
        </div>
      `;
      contenedor.appendChild(item);
    });
  } catch (error) {
    contenedor.innerHTML = '<div class="placeholder-vacio">Error al cargar tendencias.</div>';
  }
}

// Lectura de Noticia Individual
async function abrirNoticia(id) {
  try {
    const res = await fetch(`/api/publicacion/noticias/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const noticia = data.noticia;

    if (articuloActualId && articuloActualId !== id) {
      registrarMetricaLectura();
    }

    articuloActualId = noticia.id;
    tiempoInicioLectura = Date.now();

    // Registro de vista inmediata
    fetch('/api/metricas/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articuloId: noticia.id,
        tiempoPermanencia: 0
      })
    }).catch(err => console.error('Error registrando vista:', err));

    document.getElementById('lectura-categoria').innerText = noticia.categoria;
    document.getElementById('lectura-titulo').innerText = noticia.titulo;
    document.getElementById('lectura-autor').innerText = noticia.autor;
    document.getElementById('lectura-fecha').innerText = new Date(noticia.creado_en).toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const imgElem = document.getElementById('lectura-imagen');
    if (noticia.imagen_url) {
      imgElem.src = noticia.imagen_url;
      document.getElementById('lectura-img-contenedor').style.display = 'block';
    } else {
      document.getElementById('lectura-img-contenedor').style.display = 'none';
    }

    document.getElementById('lectura-resumen').innerText = noticia.resumen || '';
    document.getElementById('lectura-contenido').innerText = noticia.contenido;

    abrirModal('modal-lectura');
  } catch (err) {
    mostrarNotificacion(err.message, 'error');
  }
}

function cerrarLecturaArticulo() {
  registrarMetricaLectura();
  articuloActualId = null;
  cerrarModal('modal-lectura');
}

// TELEMETRÍA Y MÉTRICAS 
window.addEventListener('beforeunload', registrarMetricaLectura);

function registrarMetricaLectura() {
  if (!articuloActualId) return;
  const segundos = Math.round((Date.now() - tiempoInicioLectura) / 1000);

  if (segundos >= 2) {
    const datos = JSON.stringify({
      articuloId: articuloActualId,
      tiempoPermanencia: segundos
    });

    fetch('/api/metricas/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: datos,
      keepalive: true
    }).catch(() => {
      const blob = new Blob([datos], { type: 'application/json' });
      navigator.sendBeacon('/api/metricas/registrar', blob);
    });
  }
}

// NOTIFICACIONES PUSH
async function cargarNotificaciones() {
  const badge = document.getElementById('notif-badge');
  const lista = document.getElementById('lista-notificaciones');

  if (!usuario || !token) {
    if (badge) {
      badge.style.display = 'none';
      badge.innerText = '0';
    }
    if (lista) {
      lista.innerHTML = '<li style="font-size:0.8rem; color:#888; text-align:center; padding:10px 0;">Inicia sesión para recibir alertas.</li>';
    }
    return;
  }

  try {
    const res = await fetch('/api/publicacion/notificaciones');
    const data = await res.json();
    const notificaciones = data.notificaciones || [];

    lista.innerHTML = '';

    if (notificaciones.length === 0) {
      if (badge) badge.style.display = 'none';
      lista.innerHTML = '<li style="font-size:0.8rem; color:#888; text-align:center; padding:10px 0;">Sin alertas nuevas</li>';
      return;
    }

    notificaciones.forEach(item => {
      const li = document.createElement('li');
      li.style.padding = '8px 0';
      li.style.borderBottom = '1px solid #eee';
      li.style.fontSize = '0.8rem';
      li.innerHTML = `<strong>[${item.categoria}]</strong> ${item.titulo}`;
      lista.appendChild(li);
    });

    const claveStorage = `notif_vistas_${usuario.id}`;
    const cantidadVistas = parseInt(localStorage.getItem(claveStorage) || '0', 10);
    const pendientes = notificaciones.length - cantidadVistas;

    if (pendientes > 0) {
      badge.innerText = pendientes > 99 ? '99+' : pendientes;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch (e) {
    console.error('Error al cargar alertas:', e);
  }
}

function toggleNotificaciones() {
  if (!usuario || !token) {
    abrirModalAuth('login');
    return;
  }

  const panel = document.getElementById('panel-notificaciones');
  const estaAbierto = panel.classList.toggle('activo');

  if (estaAbierto) {
    const badge = document.getElementById('notif-badge');
    const lista = document.getElementById('lista-notificaciones');
    const totalItems = lista ? lista.querySelectorAll('li').length : 0;

    localStorage.setItem(`notif_vistas_${usuario.id}`, totalItems);

    if (badge) {
      badge.style.display = 'none';
      badge.innerText = '0';
    }
  }
}

// GESTIÓN DE ROLES E INTERFAZ DE USUARIO
function actualizarInterfazUsuario() {
  const label = document.getElementById('usuario-label');
  const rolTexto = document.getElementById('rol-actual');
  const btnRedactor = document.getElementById('btn-opcion-redactor');
  const btnEditor = document.getElementById('btn-opcion-editor');
  const btnAdmin = document.getElementById('btn-opcion-admin');
  const btnMetricas = document.getElementById('btn-opcion-metricas');
  const btnMisArticulos = document.getElementById('btn-opcion-mis-articulos');

  btnRedactor.classList.add('oculto');
  btnEditor.classList.add('oculto');
  btnAdmin.classList.add('oculto');
  btnMetricas.classList.add('oculto');
  if (btnMisArticulos) btnMisArticulos.classList.add('oculto');

  if (usuario && token) {
    label.innerText = usuario.nombre.split(' ')[0];
    rolTexto.innerText = usuario.rol;

    if (usuario.rol === 'REDACTOR' || usuario.rol === 'ADMINISTRADOR') {
      btnRedactor.classList.remove('oculto');
      if (btnMisArticulos) btnMisArticulos.classList.remove('oculto');
    }
    if (usuario.rol === 'EDITOR' || usuario.rol === 'ADMINISTRADOR') {
      btnEditor.classList.remove('oculto');
      btnMetricas.classList.remove('oculto');
    }
    if (usuario.rol === 'ADMINISTRADOR') {
      btnAdmin.classList.remove('oculto');
    }
  } else {
    label.innerText = 'Ingresar';
  }
}

function toggleMenuUsuario() {
  if (!token) {
    abrirModalAuth('login');
  } else {
    document.getElementById('panel-usuario').classList.toggle('activo');
  }
}

// AUTENTICACIÓN 
async function iniciarSesion(e) {
  e.preventDefault();
  const correo = document.getElementById('login-correo').value;
  const clave = document.getElementById('login-clave').value;

  try {
    const res = await fetch('/api/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, clave })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    token = data.token;
    usuario = data.usuario;
    localStorage.setItem('token_noticiero', token);
    localStorage.setItem('usuario_noticiero', JSON.stringify(usuario));

    cerrarModal('modal-auth');
    actualizarInterfazUsuario();
    cargarNotificaciones();
    mostrarNotificacion(`Bienvenido/a, ${usuario.nombre}`, 'exito');
  } catch (err) {
    mostrarNotificacion(err.message, 'error');
  }
}

async function registrarUsuario(e) {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre').value;
  const correo = document.getElementById('reg-correo').value;
  const clave = document.getElementById('reg-clave').value;

  try {
    const res = await fetch('/api/usuarios/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, clave })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    mostrarNotificacion('Registro exitoso. Ahora puedes iniciar sesión.', 'exito');
    cambiarTabAuth('login');
  } catch (err) {
    mostrarNotificacion(err.message, 'error');
  }
}

function cerrarSesion() {
  localStorage.removeItem('token_noticiero');
  localStorage.removeItem('usuario_noticiero');
  token = null;
  usuario = null;
  document.getElementById('panel-usuario').classList.remove('activo');
  actualizarInterfazUsuario();
  cargarNotificaciones();
  mostrarNotificacion('Sesión cerrada', 'exito');
}

// REDACCIÓN DE CONTENIDO 
async function guardarBorrador(e) {
  e.preventDefault();
  const titulo = document.getElementById('art-titulo').value;
  const categoria = document.getElementById('art-categoria').value;
  const imagen_url = document.getElementById('art-imagen').value;
  const resumen = document.getElementById('art-resumen').value;
  const contenido = document.getElementById('art-contenido').value;

  try {
    const res = await fetch('/api/contenido/borrador', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ titulo, categoria, imagen_url, resumen, contenido })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    mostrarNotificacion('Borrador editorial guardado exitosamente.', 'exito');
    document.getElementById('form-borrador').reset();
    cerrarModal('modal-borrador');
  } catch (err) {
    mostrarNotificacion(err.message, 'error');
  }
}

// Panel "Mis Artículos" (Redactor)
async function abrirPanelMisArticulos() {
  document.getElementById('panel-usuario').classList.remove('activo');
  abrirModal('modal-mis-articulos');

  try {
    const res = await fetch('/api/contenido/mis-borradores', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    listaMisArticulos = data.articulos || [];
    paginaActualMisArticulos = 1;
    renderizarTablaMisArticulos();
  } catch (error) {
    mostrarNotificacion('Error al cargar tus artículos', 'error');
  }
}

function renderizarTablaMisArticulos() {
  const tbody = document.getElementById('tabla-mis-articulos-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (listaMisArticulos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">No has creado ningún borrador todavía.</td></tr>';
    renderizarPaginacion('paginacion-mis-articulos', 0, ARTICULOS_POR_PAGINA_REDACTOR, 1, () => {});
    return;
  }

  const inicio = (paginaActualMisArticulos - 1) * ARTICULOS_POR_PAGINA_REDACTOR;
  const fin = inicio + ARTICULOS_POR_PAGINA_REDACTOR;
  const articulosPagina = listaMisArticulos.slice(inicio, fin);

  articulosPagina.forEach(art => {
    const tr = document.createElement('tr');
    const fecha = new Date(art.creado_en).toLocaleDateString('es-ES');

    tr.innerHTML = `
      <td><strong>${art.titulo}</strong></td>
      <td><span class="categoria-tag" style="font-size:0.7rem;">${art.categoria}</span></td>
      <td>${fecha}</td>
      <td><span class="badge-estado ${art.estado}">${art.estado}</span></td>
      <td>
        <button class="btn-tabla-ver" onclick="previsualizarParaEditor(${art.id})"><i class="fa-regular fa-eye"></i> Ver</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderizarPaginacion(
    'paginacion-mis-articulos',
    listaMisArticulos.length,
    ARTICULOS_POR_PAGINA_REDACTOR,
    paginaActualMisArticulos,
    (nuevaPagina) => {
      paginaActualMisArticulos = nuevaPagina;
      renderizarTablaMisArticulos();
    }
  );
}

// MODERACIÓN EDITORIAL (EDITOR / ADMIN)
async function abrirPanelModeracion() {
  document.getElementById('panel-usuario').classList.remove('activo');
  abrirModal('modal-moderacion');

  try {
    const res = await fetch('/api/publicacion/articulos/revision', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    listaArticulosModeracion = data.articulos || [];
    paginaActualModeracion = 1;
    renderizarTablaModeracion();
  } catch (err) {
    mostrarNotificacion('Error al cargar panel editorial', 'error');
  }
}

function renderizarTablaModeracion() {
  const tbody = document.getElementById('tabla-articulos-revision');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (listaArticulosModeracion.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">No hay artículos registrados.</td></tr>';
    renderizarPaginacion('paginacion-moderacion', 0, ARTICULOS_POR_PAGINA_MODERACION, 1, () => {});
    return;
  }

  const inicio = (paginaActualModeracion - 1) * ARTICULOS_POR_PAGINA_MODERACION;
  const fin = inicio + ARTICULOS_POR_PAGINA_MODERACION;
  const articulosPagina = listaArticulosModeracion.slice(inicio, fin);

  articulosPagina.forEach(art => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${art.titulo}</strong></td>
      <td>${art.autor}</td>
      <td><span class="categoria-tag" style="font-size:0.7rem;">${art.categoria}</span></td>
      <td><strong>${art.estado}</strong></td>
      <td>
        <button class="btn-tabla-ver" onclick="previsualizarParaEditor(${art.id})"><i class="fa-regular fa-eye"></i> Leer</button>
        <button onclick="cambiarEstadoArticulo(${art.id}, 'PUBLICADO')">Aprobar</button>
        <button onclick="cambiarEstadoArticulo(${art.id}, 'RECHAZADO')">Rechazar</button>
        <button onclick="cambiarEstadoArticulo(${art.id}, 'ELIMINADO')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderizarPaginacion(
    'paginacion-moderacion',
    listaArticulosModeracion.length,
    ARTICULOS_POR_PAGINA_MODERACION,
    paginaActualModeracion,
    (nuevaPagina) => {
      paginaActualModeracion = nuevaPagina;
      renderizarTablaModeracion();
    }
  );
}

async function previsualizarParaEditor(id) {
  try {
    const res = await fetch(`/api/publicacion/articulos/previsualizar/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const noticia = data.noticia;

    document.getElementById('lectura-categoria').innerText = `${noticia.categoria} [ESTADO: ${noticia.estado}]`;
    document.getElementById('lectura-titulo').innerText = noticia.titulo;
    document.getElementById('lectura-autor').innerText = noticia.autor;
    document.getElementById('lectura-fecha').innerText = new Date(noticia.creado_en).toLocaleDateString('es-ES', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const imgElem = document.getElementById('lectura-imagen');
    if (noticia.imagen_url) {
      imgElem.src = noticia.imagen_url;
      document.getElementById('lectura-img-contenedor').style.display = 'block';
    } else {
      document.getElementById('lectura-img-contenedor').style.display = 'none';
    }

    document.getElementById('lectura-resumen').innerText = noticia.resumen || '';
    document.getElementById('lectura-contenido').innerText = noticia.contenido;

    abrirModal('modal-lectura');
  } catch (err) {
    mostrarNotificacion(err.message, 'error');
  }
}

async function cambiarEstadoArticulo(id, nuevoEstado) {
  try {
    const res = await fetch(`/api/publicacion/articulos/${id}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nuevoEstado })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    mostrarNotificacion(`Estado actualizado a ${nuevoEstado}`, 'exito');
    abrirPanelModeracion();
    cargarNoticias('TODAS');
    cargarNotificaciones();
  } catch (err) {
    mostrarNotificacion(err.message, 'error');
  }
}

// GESTIÓN DE PERSONAL (ADMINISTRADOR)
async function abrirPanelAdmin() {
  document.getElementById('panel-usuario').classList.remove('activo');
  abrirModal('modal-admin');

  try {
    const res = await fetch('/api/usuarios/lista', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    listaPersonalAdmin = data.usuarios || [];
    paginaActualAdmin = 1;
    renderizarTablaAdmin();
  } catch (e) {
    console.error(e);
    mostrarNotificacion('Error al cargar la lista de personal', 'error');
  }
}

function renderizarTablaAdmin() {
  const tbody = document.getElementById('tabla-usuarios-admin');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (listaPersonalAdmin.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:18px; color:#888;">No hay redactores ni editores asignados aún.</td></tr>';
    renderizarPaginacion('paginacion-personal-admin', 0, PERSONAL_POR_PAGINA, 1, () => {});
    return;
  }

  const inicio = (paginaActualAdmin - 1) * PERSONAL_POR_PAGINA;
  const fin = inicio + PERSONAL_POR_PAGINA;
  const personalPagina = listaPersonalAdmin.slice(inicio, fin);

  personalPagina.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.nombre}</strong></td>
      <td>${u.correo}</td>
      <td><span class="badge-estado ${u.rol}">${u.rol}</span></td>
      <td>
        <button class="btn-quitar-cargo" onclick="removerCargo(${u.id}, '${u.nombre}')">
          <i class="fa-solid fa-user-minus"></i> Quitar Cargo (Volver Lector)
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderizarPaginacion(
    'paginacion-personal-admin',
    listaPersonalAdmin.length,
    PERSONAL_POR_PAGINA,
    paginaActualAdmin,
    (nuevaPagina) => {
      paginaActualAdmin = nuevaPagina;
      renderizarTablaAdmin();
    }
  );
}

async function asignarRolPorCorreo(e) {
  e.preventDefault();
  const inputCorreo = document.getElementById('admin-correo-asignar');
  const selectRol = document.getElementById('admin-nuevo-rol-select');

  const correo = inputCorreo.value;
  const nuevoRol = selectRol.value;

  try {
    const res = await fetch('/api/usuarios/rol', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ correo, nuevoRol })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    mostrarNotificacion(data.mensaje, 'exito');
    inputCorreo.value = '';
    selectRol.value = '';
    abrirPanelAdmin();
  } catch (err) {
    mostrarNotificacion(err.message, 'error');
  }
}

async function removerCargo(usuarioId, nombre) {
  if (!confirm(`¿Deseas retirar el cargo a ${nombre} y dejarlo como Lector común?`)) return;

  try {
    const res = await fetch('/api/usuarios/rol', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ usuarioId, nuevoRol: 'LECTOR' })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    mostrarNotificacion(`Cargo retirado a ${nombre}.`, 'exito');
    abrirPanelAdmin();
  } catch (err) {
    mostrarNotificacion(err.message, 'error');
  }
}

// PANEL ANALÍTICO (EDITOR / ADMIN)
async function abrirPanelMetricas() {
  document.getElementById('panel-usuario').classList.remove('activo');
  abrirModal('modal-metricas');

  try {
    const res = await fetch('/api/metricas/panel', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    listaMetricasAnalitica = data.panelAnalitico || [];
    paginaActualMetricas = 1;

    renderizarTablaMetricas();
  } catch (e) {
    console.error(e);
    mostrarNotificacion('Error al cargar métricas analíticas', 'error');
  }
}

function renderizarTablaMetricas() {
  const tbody = document.getElementById('tabla-metricas-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (listaMetricasAnalitica.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:18px; color:#888;">No hay registros de lectura disponibles aún.</td></tr>';
    renderizarPaginacion('paginacion-metricas', 0, METRICAS_POR_PAGINA, 1, () => {});
    return;
  }

  const inicio = (paginaActualMetricas - 1) * METRICAS_POR_PAGINA;
  const fin = inicio + METRICAS_POR_PAGINA;
  const bloqueActual = listaMetricasAnalitica.slice(inicio, fin);

  bloqueActual.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${m.titulo}</strong></td>
      <td><span class="categoria-tag" style="font-size:0.7rem;">${m.categoria}</span></td>
      <td><strong>${m.total_vistas}</strong></td>
      <td>${m.promedio_segundos || 0}s</td>
    `;
    tbody.appendChild(tr);
  });

  renderizarPaginacion(
    'paginacion-metricas',
    listaMetricasAnalitica.length,
    METRICAS_POR_PAGINA,
    paginaActualMetricas,
    (nuevaPagina) => {
      paginaActualMetricas = nuevaPagina;
      renderizarTablaMetricas();
    }
  );
}

// UTILIDADES DE INTERFAZ Y MODALES
function cambiarCategoria(elemento, categoria) {
  document.querySelectorAll('#lista-categorias li').forEach(li => li.classList.remove('cat-activa'));
  elemento.classList.add('cat-activa');
  cargarNoticias(categoria);
}

function abrirModal(id) { 
  const el = document.getElementById(id);
  if (el) el.classList.remove('oculto'); 
}

function cerrarModal(id) { 
  const el = document.getElementById(id);
  if (el) el.classList.add('oculto'); 
}

function abrirModalEditor() { 
  document.getElementById('panel-usuario').classList.remove('activo'); 
  abrirModal('modal-borrador'); 
}

function abrirModalAuth(tab) {
  abrirModal('modal-auth');
  cambiarTabAuth(tab);
}

function cambiarTabAuth(tab) {
  const formLogin = document.getElementById('form-login');
  const formReg = document.getElementById('form-registro');
  const btnLogin = document.getElementById('tab-login');
  const btnReg = document.getElementById('tab-reg');

  if (tab === 'login') {
    formLogin.classList.remove('oculto');
    formReg.classList.add('oculto');
    btnLogin.classList.add('activo');
    btnReg.classList.remove('activo');
  } else {
    formLogin.classList.add('oculto');
    formReg.classList.remove('oculto');
    btnLogin.classList.remove('activo');
    btnReg.classList.add('activo');
  }
}