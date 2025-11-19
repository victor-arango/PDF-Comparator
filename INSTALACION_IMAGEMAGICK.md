# 🖼️ Instalación de ImageMagick para Windows

## Problema Identificado

La aplicación está mostrando errores `EPIPE` al intentar convertir PDFs a imágenes. Esto indica que **ImageMagick no está instalado o no está configurado correctamente** en el sistema.

## Solución: Instalar ImageMagick

### Opción 1: Descarga Directa (Recomendada)

1. **Ve a la página oficial de ImageMagick:**
   - URL: https://imagemagick.org/script/download.php#windows

2. **Descarga la versión para Windows:**
   - Busca "Windows Binary Release"
   - Descarga la versión más reciente (ej: `ImageMagick-7.1.1-15-Q16-HDRI-x64-dll.exe`)

3. **Instala ImageMagick:**
   - Ejecuta el archivo descargado como administrador
   - **IMPORTANTE:** Durante la instalación, marca la casilla "Add application directory to your system path"
   - Si no aparece esta opción, asegúrate de que ImageMagick se instale en `C:\Program Files\ImageMagick-7.x.x-Q16-HDRI\`

4. **Verifica la instalación:**
   - Abre una nueva terminal (PowerShell o CMD)
   - Ejecuta: `magick --version`
   - Deberías ver información sobre la versión instalada

### Opción 2: Usando Chocolatey

Si tienes Chocolatey instalado:

```powershell
choco install imagemagick
```

### Opción 3: Usando Scoop

Si tienes Scoop instalado:

```powershell
scoop install imagemagick
```

## Verificación de la Instalación

Después de instalar ImageMagick, verifica que funcione:

```bash
# Verificar versión
magick --version

# Verificar que puede convertir PDFs
magick -list format | findstr PDF
```

## Reiniciar la Aplicación

1. **Cierra todas las terminales** donde esté ejecutándose la aplicación
2. **Abre nuevas terminales**
3. **Reinicia el backend:**
   ```bash
   cd backend
   npm start
   ```
4. **Reinicia el frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## Solución Alternativa: Usar Ghostscript

Si ImageMagick sigue dando problemas, también necesitarás **Ghostscript**:

1. **Descarga Ghostscript:**
   - URL: https://www.ghostscript.com/download/gsdnld.html
   - Descarga la versión para Windows

2. **Instala Ghostscript** siguiendo las instrucciones del instalador

3. **Verifica la instalación:**
   ```bash
   gswin64c --version
   ```

## Notas Importantes

- **Reinicia la terminal** después de instalar ImageMagick
- **Reinicia la aplicación** después de la instalación
- Si usas VS Code, reinicia también el editor
- La aplicación creará **placeholders SVG** si ImageMagick no está disponible, pero la funcionalidad completa requiere ImageMagick

## Verificar que Funciona

Una vez instalado correctamente, cuando subas PDFs para comparar, deberías ver en la consola del backend:

```
🌀 Generando imágenes para original...
  📄 Procesando página 1/2...
    ✓ Página 1 convertida: [ruta del archivo]
  📄 Procesando página 2/2...
    ✓ Página 2 convertida: [ruta del archivo]
  ✓ 2 imágenes generadas (original)
```

En lugar de errores `EPIPE`.

---

**¡Con ImageMagick instalado, la aplicación funcionará completamente!** 🎉
