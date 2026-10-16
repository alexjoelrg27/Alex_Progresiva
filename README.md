# EcoRuta · explora Guayaquil

PWA en español para descubrir lugares, guardar un itinerario, tomar notas y registrar visitas. Proyecto académico de la semana 6 de Desarrollo en plataformas. No requiere compilación ni servidor de aplicación.

## Ejecutar

```sh
python3 -m http.server 8080
```

Abre http://localhost:8080. No uses `file://`: los módulos, AJAX y Service Workers necesitan un servidor. Para instalar y trabajar offline, abre una vez con conexión y verifica en **Datos y conexiones** que los archivos estén descargados. Instala desde el botón de la app o el menú del navegador. En Safari iOS: Compartir → Añadir a pantalla de inicio. La oferta de instalación depende del navegador.

## Funciones

- Búsqueda por nombre y sector; filtros por categoría.
- Favoritos, notas y visitas en IndexedDB, con transacciones que confirman la escritura antes de mostrar éxito.
- Exportación del itinerario a JSON.
- Catálogo local equivalente en JSON, CSV, XML y SQLite real mediante sql.js/WebAssembly.
- Firestore REST de Google, solo lectura, paginación y validación de documentos.
- Google Maps JavaScript API con marcadores; enlaces para indicaciones usando Maps URLs.
- Service Worker con precaché del shell, datos y dependencias locales; navegación offline.
- Manifest, iconos PNG instalables y maskable, interfaz adaptable y movimiento reducido.

Los lugares y tiempos son contenido de demostración orientativo. No representan información verificada de horarios, accesibilidad ni tarifas. Los favoritos no se sincronizan entre dispositivos; borrar los datos del navegador los elimina. IndexedDB no es una garantía de conservación permanente: exporta las notas que quieras respaldar.

## Arquitectura y cobertura de la semana 6

| Tema | Implementación |
| --- | --- |
| 6.1 jQuery y transición a MVC | `controller/app.js` coordina modelo y vista usando módulos ES y jQuery local |
| 6.2 DOM, selectores, eventos y delegación | tarjetas dinámicas, `.on()`, `.val()`, `.text()`, `.attr()`, `.prop()`, clases y eventos delegados |
| 6.3 Efectos, encadenamiento y accesibilidad | notificaciones `stop → text → fadeIn → delay → fadeOut`; paneles con `slideToggle`; preferencia de movimiento reducido |
| 6.4 Modelo–Vista–Controlador | `model/` datos, `view/` presentación y `controller/` coordinación; sin eventos JavaScript inline |
| 6.5 Fuentes de datos de solo lectura | AJAX JSON, lector CSV con comillas, DOMParser XML, SQLite parametrizado, Firestore REST |
| Extensión solicitada: IndexedDB | `model/database.js`, almacenes `catalog` y `favorites` |
| Extensión solicitada: PWA | `sw.js`, manifest, iconos y captura del evento de instalación |
| Extensión solicitada: APIs de Google | Maps JavaScript API, Maps URLs y Firestore REST |

El documento presenta ejemplos y preguntas de evaluación: se usan como referencia técnica, no como instrucciones para contestar el cuestionario. MongoDB se menciona como comparación conceptual; no se conecta un servidor MongoDB desde el navegador.

### Flujo

Usuario → evento jQuery → Controlador → Modelo → datos normalizados → Vista.
El catálogo se consulta en modo lectura. Las escrituras solicitadas para notas y favoritos se realizan solamente en IndexedDB.

## Google Maps

En un proyecto propio de Google Cloud habilita **Maps JavaScript API**, configura su facturación y una API key restringida por API y por dominios HTTP (localhost y el futuro dominio de GitHub Pages). Coloca la clave pública en `config.js`, campo `googleMapsApiKey`. No incluyas cuentas de servicio ni claves privadas. El mapa integrado necesita conexión; «Cómo llegar» abre Google Maps sin una clave de Maps JavaScript.

Documentación: https://developers.google.com/maps/documentation/javascript/get-api-key y https://developers.google.com/maps/documentation/urls/guide

## Firestore de solo lectura

No se ha provisionado ninguna base remota ni creado recursos de pago. El adaptador REST está preparado para una base Firestore **Standard / Native** existente, identificador `(default)`. Antes de conectar una base real confirma su edición en Firebase. Configura `firestoreProjectId`, `firestoreApiKey` y `firestoreCollection` en `config.js`. Selecciona Firestore en **Datos y conexiones** y pulsa **Cargar catálogo**.

Crea documentos en `places` usando como ID el campo `id` de `data/places.json`; los demás campos conservan sus nombres y tipos. Publica solamente información que deba ser pública. La clave API no concede acceso ni sustituye las reglas. Reglas sugeridas para un catálogo público Standard (revisar y desplegar en el proyecto real):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /places/{place} {
      allow get: if true;
      allow list: if request.query.limit != null && request.query.limit <= 100;
      allow write: if false;
    }
  }
}
```

El cliente solicita páginas de 100 documentos y limita el catálogo a 500. No hay autenticación ni escritura remota. La API key debe permitir Firestore API y el dominio real; verifica las restricciones con una petición desde el navegador. Se muestran errores reales y se conserva el catálogo anterior si la consulta falla. No hay una conexión simulada ni datos locales etiquetados como remotos.

Documentación REST: https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/list

## Desplegar en GitHub Pages

Repositorio: https://github.com/alexjoelrg27/Alex_Progresiva. El workflow `.github/workflows/pages.yml` está preparado para la rama `main`.

1. Sube el proyecto al repositorio que vayas a usar.
2. En GitHub: Settings → Pages → Source → GitHub Actions.
3. Ejecuta el workflow o haz push a `main`.
4. Abre la URL HTTPS que devuelve el despliegue.

Todas las rutas son relativas: funcionan en `https://usuario.github.io/repositorio/`. El workflow empaqueta solamente los archivos públicos de la app. Cuando cambies archivos precacheados incrementa `CACHE` en `sw.js` (por ejemplo `ecoruta-v2`) para distribuir la actualización. No subir secretos al repositorio.

## Comprobación automática

Con Node.js 20 o superior, ejecuta `npm test`. No requiere instalar paquetes. Comprueba equivalencia JSON/CSV, campos inválidos, escape HTML, el proveedor SQLite con WebAssembly real, errores de configuración y recursos de precaché.

## Comprobación manual

1. Abrir el catálogo: deben aparecer seis lugares; buscar «Peñas» y filtrar Cultura.
2. Guardar un lugar; abrir Mi ruta; añadir nota y marcar visita; recargar y comprobar persistencia.
3. Cargar JSON, CSV, XML y SQLite; todos deben mostrar los mismos seis IDs, SQLite ordenado por nombre.
4. Esperar el estado offline listo, recargar para asegurar control del Service Worker, activar Offline en DevTools y recargar. Catálogo, filtros, favoritos, notas y SQLite deben seguir funcionando.
5. Desconectado: el mapa informa que necesita internet. Sin claves: Maps y Firestore informan de la configuración pendiente.
6. Configurar claves reales y comprobar mapa, marcadores y lectura de Firestore. Estas integraciones no se pueden validar sin el proyecto real.
7. Revisar móvil a 390 px, navegación por teclado y preferencia de movimiento reducido.

Dependencias locales: jQuery 3.7.1 (MIT), sql.js 1.13.0 (MIT; SQLite public domain). Se conservan las cabeceras de licencia de los archivos distribuidos. Las ilustraciones de la interfaz son SVG/CSS propios, sin necesidad de imágenes remotas.
