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
Seguridad y autenticación: bcryptjs, jsonwebtoken, dotenv.
Frontend: HTML5, CSS3, JavaScript.


Base de datos


El sistema utiliza SQLite en modo relacional estricto con verificación de claves foráneas, estructurado en tres entidades principales:
usuarios: Almacena credenciales, correos únicos y roles (ADMINISTRADOR, EDITOR, REDACTOR, LECTOR). Incluye semilla automática del administrador por defecto.
articulos: Almacena el contenido informativo, categorías, URLs de imágenes, marcas de tiempo y el estado del ciclo editorial (BORRADOR, PUBLICADO, RECHAZADO, ELIMINADO), vinculado al autor mediante autor_id.
metricas: Registra las visitas, direcciones IP y segundos de permanencia de lectura vinculados a cada noticia.


La documentación técnica y los diagramas estructurales correspondientes al sistema implementado se encuentran organizados en el directorio docs


Diagrama de Flujo de Datos (DFD)
Vista previa y archivo editable: docs/diagramas/dfd
Modelo Entidad-Relación (E-R)
Vista previa y archivo editable: docs/diagramas/diagrama e-r
Diccionario de Datos
vista previa docs/diagramas/diccionario de datos


requisitos para ejecución: 


instalar node.js
buscar el archivo de entorno en noticiero-backend .env.example y nómbrelo .env abrir el archivo y configurar JWT_SECRET, PORT, ADMIN_EMAIL, ADMIN_PASSWORD
abrir cmd ubicarse en la carpeta del servidor cd ruta/hacia/noticiero-backend 
descargar dependencias del proyecto
npm install
npm test
iniciar el servidor local: node servidor.js


Credenciales predeterminadas para evaluación

Al iniciar el servidor por primera vez, el sistema creará automáticamente la base de datos local y registrará al usuario administrador tomando las credenciales definidas en el archivo .env ubicado en noticiero-backend\.env
ADMIN_EMAIL
ADMIN_PASSWORD


Pruebas


Pruebas de autenticación: Verificación de registro con correos únicos, login con credenciales válidas e invalidación de token al cerrar sesión.
Pruebas de control de acceso: Comprobación del bloqueo inmediato mediante middleware y restricción en interfaz ante intentos de un usuario con rol Lector de ingresar a los paneles de redacción o moderación editorial.
Pruebas de rendimiento: Medición de la eficiencia y tiempos de procesamiento local en memoria (consultas a la base de datos y serialización de noticias locales), garantizando ejecuciones internas fluidas en menos de 100 ms sin la sobrecarga de la capa de transporte HTTP.
Pruebas de seguridad de credenciales: Validación del almacenamiento y protección de contraseñas mediante hashing unidireccional con Bcrypt, verificando la ausencia total de texto plano en la base de datos.


Plan de Mantenimiento

Correctivo : Resolución de errores de sesión donde un token expirado o corrupto impida realizar peticiones protegidas
Adaptativo : Adaptación del diseño responsivo para garantizar la correcta visualización en nuevas resoluciones móviles o navegadores web modernos.
Perfectivo : Refactorización bajo el principio DRY para reutilizar componentes compartidos (funciones modulares de paginación o formateo de fechas).
Preventivo : Generación y respaldo periódico (backup) de copias de seguridad del archivo local de SQLite.


Dificultades

Gestion de almacenamiento y carga de recursos multimedia
Dificultad implementar la subida directa de archivos binarios al servidor implicaba gestionar almacenamiento estatico en disco, procesar tipos MIME pesados y arriesgar la degradación del rendimiento de la base de datos relacional y el límite de almacenamiento del repositorio.
Solución: Se adoptó una arquitectura basada en referencias remotas, permitiendo a los redactores asignar URLs directas de imagen. Esto desacopla el almacenamiento multimedia del backend, reduce la carga sobre SQLite y acelera el tiempo de respuesta al renderizar la portada y los artículos.


Recomendaciones


Migración en Alta Concurrencia: Si el volumen de lectores simultáneos supera la capacidad de concurrencia de SQLite en disco, se recomienda desacoplar la base de datos a un motor cliente-servidor como PostgreSQL o MySQL.
Almacenamiento de Multimedia: En un entorno de producción, delegar la carga de imágenes a un servicio de almacenamiento en la nube o CDN para evitar servir archivos estáticos pesados directamente desde el hilo de Express.
Control de Intentos de Acceso: Incorporar limitadores de tasa (rate limiting) en las rutas de /login y /registro mediante librerías como express-rate-limit para mitigar ataques de fuerza bruta.
Verificación de correo mediante códigos: Implementar un mecanismo de doble factor o validación por correo electrónico que envíe un código temporal (OTP de 6 dígitos) o un token de activación antes de confirmar el alta del usuario. Esto evitará el registro masivo con correos inexistentes o bots automatizados, protegiendo la base de datos contra saturación de registros basura, optimizando el almacenamiento y garantizando la autenticidad de los lectores y redactores en la plataforma.


Conclusiones


La arquitectura modular basada en Node.js, Express y SQLite demostró ser una solución ligera, altamente eficiente y de rápido despliegue para la gestión editorial, cumpliendo con tiempos de respuesta muy inferiores al umbral de 200 ms estipulado en las pruebas no funcionales.
La implementación estricta del middleware de verificación de roles y la autenticación basada en tokens sin estado (JWT) garantizan la segregación de responsabilidades y la integridad de las líneas editoriales del noticiero.
La incorporación de telemetría de lectura aporta valor analítico al medio, permitiendo identificar tendencias reales de interés público a partir del comportamiento de los usuarios en la plataforma.


Equipo


Desarrollador principal: Gustavo Borjas.


Estado del proyecto
Completado y listo para despliegue
