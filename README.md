# Biblioteca GLB

Biblioteca personal de modelos 3D `.glb`: súbelos, guárdalos, búscalos y visualízalos en 3D — todo en tu navegador, sin cuentas ni servidores.

por jpecina

## Qué hace

- **Subir GLB**: arrastrar y soltar o selector de archivos, solo `.glb`, máx. **200 MB** por archivo (como Meshy). Valida la cabecera `glTF` y muestra errores claros si el archivo no es válido o está dañado.
- **Estadísticas reales**: al subir, el archivo se parsea con `THREE.GLTFLoader` y se calculan mallas, triángulos, vértices, materiales, texturas, animaciones y dimensiones (bounding box).
- **Miniatura automática**: cada modelo se renderiza una vez en un WebGL offscreen y se guarda como imagen JPEG. Si ese render falla, la tarjeta muestra un placeholder y al abrir el detalle la miniatura se regenera automáticamente (nunca queda una miniatura rota en silencio).
- **Biblioteca**: rejilla de tarjetas con miniatura, nombre, tamaño, fecha y categoría.
- **Buscar y filtrar**: buscador por nombre, descripción, categoría y etiquetas; filtro por categoría (Personaje, Vehículo, Edificio, Objeto, Naturaleza, Otro); ordenar por fecha, nombre o tamaño.
- **Visor de detalle**: Three.js + OrbitControls (girar / zoom / desplazar), rotación automática, alambre, rejilla, fondo claro/oscuro/estudio, reproducción de animaciones (play/pausa + selector de clip), restablecer vista, panel de estadísticas, descarga del GLB original, edición de nombre/descripción/categoría/etiquetas, eliminar, y **«Usar esta vista como miniatura»**.
- **Idioma**: ES / EN (botón arriba a la derecha).

## Privacidad y almacenamiento

No hay backend. Los GLB (ArrayBuffer), los metadatos y las miniaturas se guardan en **IndexedDB** de tu navegador (`glb-library`, dos stores: `models` y `blobs`). Nada sale de tu máquina. Consecuencias honestas:

- La biblioteca vive **solo en ese navegador y ese dispositivo**; no se sincroniza entre dispositivos.
- Borrar los datos del sitio borra también la biblioteca. Haz copia de tus GLB originales.

## Limitaciones conocidas

- GLB con compresión **Draco** o texturas **KTX2** no se pueden leer (el loader no lleva esos decodificadores); la subida muestra un error en ese caso.
- Los modelos muy grandes pueden tardar en parsearse y ocupar memoria/RAM del navegador; el límite por archivo es 200 MB.

## Desarrollo local

```bash
npm install
npm run dev
```

## Despliegue en Vercel (pasos exactos)

El repo ya está en GitHub: **https://github.com/jpecinagithub/glb-library**

1. Entra en [vercel.com](https://vercel.com) y abre el equipo **`jpecina-gmailcoms-projects`** (arriba a la izquierda, selector de equipo).
2. **Add New → Project → Import Git Repository** y elige `jpecinagithub/glb-library`.
3. **Framework Preset: Vite** (lo detecta solo). Build Command: `npm run build`. Output Directory: `dist`. No hace falta tocar nada más.
4. **No hay variables de entorno** (la app no tiene backend ni claves).
5. Pulsa **Deploy**. La URL será algo como `https://glb-library.vercel.app` (o el dominio que Vercel asigne).
6. Cada `git push` a `main` redespliega automáticamente.

## Build

```bash
npm run build   # tsc -b && vite build
```

## Stack

Vite + React 19 + TypeScript + Three.js (`GLTFLoader`, `OrbitControls`). Sin backend, sin dependencias de servidor.
