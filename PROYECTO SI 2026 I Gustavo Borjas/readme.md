RubierReport - Portal Web Editorial y Noticiero Digital

Plataforma web integral para la gestión, redacción, revisión editorial y publicación de noticias estructuradas por categorías de interés general, incorporando analítica de lectura en tiempo real y administración jerárquica de usuarios.

Problema o necesidad que aborda

Los medios de comunicación independientes y portales informativos requieren flujos de trabajo claros para evitar publicaciones no autorizadas, pérdida de borradores editoriales y desorganización en las líneas de aprobación. RubierReport resuelve la necesidad de centralizar el ciclo de vida de una noticia (creación, moderación, publicación y lectura pública) dentro de un entorno web accesible, ligero y con control estricto de roles.

Objetivo

Desarrollar una aplicación web que permita a redactores gestionar borradores informativos, a editores supervisar y aprobar publicaciones, y a los lectores acceder a contenidos clasificados por categorías y tendencias, evaluando la permanencia y recepción del contenido.

Funcionalidades principales

Gestión y control de accesos: Sistema de autenticación con JSON Web Tokens (JWT) y cifrado seguro de contraseñas, permitiendo roles diferenciados: ADMINISTRADOR, EDITOR, REDACTOR y LECTOR.
Redacción editorial: Interfaz dedicada para la creación de borradores con título, categoría, imagen de portada, resumen y cuerpo de texto.
Flujo de moderación: Panel editorial para revisión de artículos con capacidades de aprobación (PUBLICADO), rechazo (RECHAZADO) o baja (ELIMINADO).
Visualización pública y filtrado: Portada interactiva con noticia destacada principal, cuadrícula paginada de artículos secundarios y filtrado dinámico por categorías: Internacional, Política, Economía, Tecnología, Ciencia y Deportes.
Módulo de tendencias: Cálculo y listado lateral del top de noticias más leídas.
Telemetría y analítica: Registro automatizado de vistas y cálculo del tiempo de permanencia de lectura por usuario/artículo mediante eventos de frontend y backend.
Alertas y notificaciones: Contador dinámico e historial desplegable de alertas editoriales y novedades para usuarios autenticados.

Tecnologías utilizadas

Backend: Node.js, Express.js.
Base de datos: SQLite (mediante la librería better-sqlite3).
Seguridad y autenticación: bcryptjs, jsonwebtoken.
Frontend: HTML5, CSS3, JavaScript.

Base de datos

El sistema utiliza SQLite en modo relacional estricto con verificación de claves foráneas (foreign_keys = ON), estructurado en tres entidades principales:
usuarios: Almacena credenciales, correos únicos y roles (ADMINISTRADOR, EDITOR, REDACTOR, LECTOR). Incluye semilla automática del administrador por defecto.
articulos: Almacena el contenido informativo, categorías, URLs de imágenes, marcas de tiempo y el estado del ciclo editorial (BORRADOR, PUBLICADO, RECHAZADO, ELIMINADO), vinculado al autor mediante autor_id.
metricas: Registra las visitas, direcciones IP y segundos de permanencia de lectura vinculados a cada noticia.

requisitos para ejecución: 

instalar node.js
abrir cmd ubicarse en la carpeta del servidor 
cd ruta/hacia/noticiero-backend 
descargar dependencias del proyecto
npm install
iniciar el servidor local
node servidor.js

Credenciales predeterminadas para evaluación

Correo: admin@admin.admin
Contraseña: admin123

Pruebas

Pruebas de autenticación: Verificación de registro con correos únicos, login con credenciales válidas e invalidación de token al cerrar sesión.
Pruebas de control de acceso: Comprobación del bloqueo inmediato mediante middleware y restricción en interfaz ante intentos de un usuario con rol Lector de ingresar a los paneles de redacción o moderación editorial.
Pruebas de rendimiento: Medición del tiempo de respuesta en la carga inicial de la portada y consulta de noticias locales, garantizando entregas fluidas en menos de 200 ms.
Pruebas de seguridad de credenciales: Validación del almacenamiento y protección de contraseñas mediante hashing unidireccional con Bcrypt, verificando la ausencia total de texto plano en la base de datos.

Equipo

Desarrollador principal: Gustavo Borjas.

Estado del proyecto
Completado y listo para despliegue