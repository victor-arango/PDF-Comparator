# 📄 Comparador de PDFs - Aplicación Mejorada

Una aplicación web moderna para comparar archivos PDF visualmente con scroll sincronizado y detección de diferencias.

## ✨ Características Principales

- **Subida de dos archivos PDF** simultáneamente
- **Conversión automática a imágenes** de alta calidad
- **Comparación visual lado a lado** con scroll sincronizado
- **Detección de diferencias** con resaltado visual
- **Zoom y navegación** por páginas
- **Reportes HTML** interactivos y descargables
- **Interfaz moderna** y responsive

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn
- ImageMagick (para conversión de PDF a imágenes)

### Instalación de ImageMagick

#### Windows:
1. Descarga ImageMagick desde: https://imagemagick.org/script/download.php#windows
2. Instala el paquete completo
3. Asegúrate de que esté en el PATH del sistema

#### macOS:
```bash
brew install imagemagick
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install imagemagick
```

### Configuración del Proyecto

1. **Clona o descarga el proyecto**

2. **Instala dependencias del backend:**
```bash
cd backend
npm install
```

3. **Instala dependencias del frontend:**
```bash
cd ../frontend
npm install
```

## 🎯 Uso de la Aplicación

### 1. Iniciar el Backend

```bash
cd backend
npm start
```

El servidor se ejecutará en `http://localhost:3002`

### 2. Iniciar el Frontend

```bash
cd frontend
npm run dev
```

La aplicación se abrirá en `http://localhost:3000`

### 3. Usar la Aplicación

1. **Subir archivos:** Selecciona dos archivos PDF (original y modificado)
2. **Comparar:** Haz clic en "Comparar PDFs"
3. **Ver resultados:** Revisa el resumen de diferencias encontradas
4. **Visualización detallada:** Usa el visor interactivo para comparar página por página

## 🔧 Funcionalidades del Visor

### Controles de Navegación
- **Flechas:** Navegar entre páginas
- **Zoom:** Acercar/alejar con botones + y -
- **Reset:** Restablecer zoom al 100%

### Comparación Visual
- **Scroll sincronizado:** Las dos imágenes se desplazan juntas
- **Toggle de diferencias:** Mostrar/ocultar resaltado de diferencias
- **Pantalla completa:** Modo de visualización expandida

### Indicadores Visuales
- **Porcentaje de diferencia** por página
- **Resaltado de áreas modificadas** en rojo
- **Navegación rápida** entre páginas con diferencias

## 📊 Reportes Generados

La aplicación genera reportes HTML que incluyen:

- **Resumen estadístico** de la comparación
- **Vista lado a lado** de cada página
- **Imágenes de diferencias** resaltadas
- **Navegación interactiva** entre páginas
- **Información detallada** de cada diferencia encontrada

## 🛠️ Estructura del Proyecto

```
pdf-comparator/
├── backend/
│   ├── src/
│   │   ├── server.js          # Servidor Express
│   │   └── PDFComparator.js   # Lógica de comparación
│   ├── uploads/               # Archivos temporales
│   ├── output/                # Resultados generados
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.jsx
│   │   │   ├── ComparisonResult.jsx
│   │   │   └── EnhancedPDFViewer.jsx
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 🔍 Tecnologías Utilizadas

### Backend
- **Express.js** - Servidor web
- **Multer** - Manejo de archivos
- **pdf2pic** - Conversión PDF a imágenes
- **odiff-bin** - Comparación de imágenes
- **pdf-lib** - Manipulación de PDFs

### Frontend
- **React** - Framework de UI
- **Vite** - Herramienta de desarrollo
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos

## 🐛 Solución de Problemas

### Error de ImageMagick
Si obtienes errores relacionados con ImageMagick:
1. Verifica que esté instalado correctamente
2. Asegúrate de que esté en el PATH del sistema
3. Reinicia la terminal después de la instalación

### Error de conversión de PDF
Si algunos PDFs no se convierten correctamente:
1. Verifica que el PDF no esté protegido con contraseña
2. Asegúrate de que el archivo no esté corrupto
3. La aplicación creará placeholders para páginas problemáticas

### Problemas de CORS
Si hay problemas de conexión entre frontend y backend:
1. Verifica que ambos servidores estén ejecutándose
2. El backend incluye configuración CORS automática
3. Asegúrate de usar los puertos correctos (3002 para backend, 3000 para frontend)

## 📝 Notas de Desarrollo

- Los archivos se procesan temporalmente y se eliminan después de la comparación
- Las imágenes generadas se almacenan en la carpeta `output/` para referencia
- El sistema maneja automáticamente PDFs con diferentes números de páginas
- Se incluye manejo de errores robusto para casos edge

## 🤝 Contribuciones

Para contribuir al proyecto:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Realiza tus cambios
4. Envía un pull request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.

---

**¡Disfruta comparando tus PDFs de manera visual e interactiva!** 🎉
