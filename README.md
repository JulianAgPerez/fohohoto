# Fohohoto

Fohohoto es una aplicación web para subir imágenes y aplicar efectos navideños utilizando la API de Cloudinary. Los usuarios pueden elegir entre diferentes fondos y transformaciones para sus imágenes.

## Características

- Subida de imágenes (JPEG, PNG, WEBP).
- Transformaciones con efectos navideños: fondo con nieve, regalos, Santa Claus, entre otros.
- Vista previa de la imagen original y la transformada.
- Opción para descargar la imagen transformada.

## Tecnologías Utilizadas

### Frontend
- **React** (con TypeScript): Desarrollo de la interfaz de usuario.
- **Tailwind CSS**: Estilización moderna y responsiva.
- **Framer Motion**: Animaciones.
- **TsParticles**: Efecto de nieve.

### API y Servicios
- **Cloudinary**: Almacenamiento, manipulación y transformación de imágenes.

### Otras Herramientas
- **Vite**: Herramienta de desarrollo.

## Requisitos Previos

1. Tener una cuenta en [Cloudinary](https://cloudinary.com/).
2. Configurar los siguientes valores en un archivo `.env` en la raíz del proyecto:

```env
VITE_CLOUDNAME=<tu_nombre_de_cloudinary>
VITE_UPLOAD_PRESET=<tu_preset_de_subida>
```

## Instalación y Uso

1. Clonar el repositorio:

```bash
git clone https://github.com/JulianAgPerez/fohohoto.git
```

2. Instalar las dependencias:

```bash
npm install
```

3. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

4. Abrir en el navegador:

```
http://localhost:5173
```

## Cómo Funciona

1. El usuario sube una imagen.
2. Selecciona un efecto navideño de la lista desplegable.
3. La imagen se sube a Cloudinary y se transforma con el efecto seleccionado.
4. La imagen transformada se muestra como vista previa y está disponible para descargar.

## Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).

---

¡Disfruta de tus imágenes navideñas transformadas! 🎄🎅
