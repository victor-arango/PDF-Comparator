# 🖼️ Instalación de Poppler para Windows

## ¿Qué es Poppler?

Poppler es una biblioteca de código abierto para renderizar documentos PDF. Es más ligero y específicamente diseñado para trabajar con PDFs, lo que lo hace una excelente alternativa a ImageMagick para la conversión de PDFs a imágenes.

## Ventajas de Poppler sobre ImageMagick

- ✅ **Más ligero:** Menor uso de memoria y CPU
- ✅ **Específico para PDFs:** Optimizado para documentos PDF
- ✅ **Más rápido:** Conversión más eficiente
- ✅ **Menos dependencias:** No requiere tantas librerías adicionales
- ✅ **Mejor calidad:** Renderizado más preciso de PDFs

## Instalación de Poppler en Windows

### Opción 1: Descarga Directa (Recomendada)

1. **Ve a la página oficial de Poppler:**
   - URL: https://blog.alivate.com.au/poppler-windows/

2. **Descarga la versión para Windows:**
   - Busca "Poppler for Windows"
   - Descarga la versión más reciente (ej: `poppler-25.07.0_x86_64.7z`)

3. **Extrae el archivo:**
   - Extrae el archivo `.7z` a una carpeta como `C:\poppler`
   - Asegúrate de que la estructura sea: `C:\poppler\bin\`

4. **Agrega al PATH del sistema:**
   - Abre "Variables de entorno" en Windows
   - Busca "Path" en Variables del sistema
   - Agrega: `C:\poppler\bin`
   - Reinicia la terminal

### Opción 2: Usando Chocolatey

Si tienes Chocolatey instalado:

```powershell
choco install poppler
```

### Opción 3: Usando Scoop

Si tienes Scoop instalado:

```powershell
scoop install poppler
```

### Opción 4: Usando Conda

Si tienes Conda instalado:

```bash
conda install -c conda-forge poppler
```

## Verificación de la Instalación

Después de instalar Poppler, verifica que funcione:

```bash
# Verificar versión
pdftoppm -v

# Verificar que puede convertir PDFs
pdfinfo -v

# Probar conversión básica
pdftoppm -png archivo.pdf salida
```

## Configuración en la Aplicación

La aplicación ahora detectará automáticamente Poppler y lo usará como método preferido. Si Poppler no está disponible, usará ImageMagick como fallback.

### Verificar desde la aplicación:

```bash
# Endpoint de verificación
curl http://localhost:3002/api/check-poppler
```

### Respuesta esperada:

```json
{
  "success": true,
  "popplerInstalled": true,
  "imagemagickInstalled": false,
  "preferredMethod": "poppler",
  "message": "Poppler está instalado y funcionando (método preferido)"
}
```

## Solución de Problemas

### Error: "pdftoppm no se reconoce"

**Causa:** Poppler no está en el PATH del sistema.

**Solución:**
1. Verifica que `C:\poppler\bin` esté en el PATH
2. Reinicia la terminal completamente
3. Verifica con: `echo $env:PATH` (PowerShell) o `echo %PATH%` (CMD)

### Error: "No se puede encontrar el archivo"

**Causa:** La ruta de instalación es incorrecta.

**Solución:**
1. Verifica que la estructura sea: `C:\poppler\bin\pdftoppm.exe`
2. Ajusta el PATH si es necesario

### Error de permisos

**Causa:** Permisos insuficientes.

**Solución:**
1. Ejecuta la terminal como administrador
2. Verifica permisos de la carpeta de instalación

## Comparación de Métodos

| Característica | Poppler | ImageMagick |
|----------------|---------|-------------|
| Tamaño | ~50MB | ~200MB+ |
| Velocidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Calidad PDF | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Uso de memoria | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Facilidad instalación | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## Reiniciar la Aplicación

Después de instalar Poppler:

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

## Verificar que Funciona

Una vez instalado correctamente, cuando subas PDFs para comparar, deberías ver en la consola del backend:

```
🔍 Iniciando comparación de PDFs...
✅ Poppler está instalado y disponible
✅ Usando Poppler para conversión de PDFs
🌀 Generando imágenes para original con Poppler...
  📄 Convirtiendo 2 páginas con Poppler...
    ✓ Página 1 convertida: [ruta del archivo]
    ✓ Página 2 convertida: [ruta del archivo]
  ✓ 2 imágenes generadas con Poppler (original)
```

En lugar de errores `EPIPE` o placeholders.

---

**¡Con Poppler instalado, la aplicación funcionará de manera más eficiente y rápida!** 🎉

## Enlaces Útiles

- [Poppler para Windows](https://blog.alivate.com.au/poppler-windows/)
- [Documentación oficial de Poppler](https://poppler.freedesktop.org/)
- [pdf-poppler npm package](https://www.npmjs.com/package/pdf-poppler)
