import React, { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

export default function EnhancedPDFViewer({ comparisonData, onBackToResults }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [showDifferences, setShowDifferences] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const baseImageRef = useRef(null);

  const { differences = [], imagesPath = "", diffPath = "", totalPages = 0 } =
    comparisonData || {};

  // Resetear dimensiones cuando cambia la página
  useEffect(() => {
    setImageDimensions({ width: 0, height: 0 });
  }, [currentPage]);

  // Sincronizar scroll entre las dos imágenes
  useEffect(() => {
    const leftRef = leftScrollRef.current;
    const rightRef = rightScrollRef.current;

    if (!leftRef || !rightRef) return;

    const syncScroll = (source, target) => {
      target.scrollTop = source.scrollTop;
      target.scrollLeft = source.scrollLeft;
    };

    const handleLeftScroll = () => syncScroll(leftRef, rightRef);
    const handleRightScroll = () => syncScroll(rightRef, leftRef);

    leftRef.addEventListener("scroll", handleLeftScroll);
    rightRef.addEventListener("scroll", handleRightScroll);

    return () => {
      leftRef.removeEventListener("scroll", handleLeftScroll);
      rightRef.removeEventListener("scroll", handleRightScroll);
    };
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(100);
  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Función helper para normalizar rutas
  const normalizePath = (path, fallbackPath) => {
    if (!path) return fallbackPath;
    // Si ya es una ruta absoluta que empieza con /, devolverla tal cual
    if (path.startsWith('/')) return path;
    // Si es una ruta relativa, construirla con el base path
    return fallbackPath || path;
  };

  // Función helper para obtener ruta SVG como fallback
  const getSvgFallback = (pngPath) => {
    if (!pngPath) return null;
    return pngPath.replace('.png', '.svg');
  };

  const getCurrentPageData = () => {
    // Buscar diferencia para la página actual
    const diff = differences.find((d) => d.page === currentPage);
    
    if (diff) {
      // Usar las rutas del diff si están disponibles
      return {
        ...diff,
        originalImage: normalizePath(
          diff.originalImage,
          diff.originalImage || `${imagesPath}/original/page-${diff.page}.png`
        ),
        modifiedImage: normalizePath(
          diff.modifiedImage,
          diff.modifiedImage || `${imagesPath}/modified/page-${diff.page}.png`
        ),
        diffPath: diff.hasDifference && diff.diffPath 
          ? normalizePath(diff.diffPath, diff.diffPath)
          : null,
        highlightPath: diff.hasDifference && diff.highlightPath 
          ? normalizePath(diff.highlightPath, diff.highlightPath)
          : null,
        // Rutas SVG como fallback
        originalImageSvg: diff.originalImageSvg || getSvgFallback(diff.originalImage) || `${imagesPath}/original/page-${diff.page}.svg`,
        modifiedImageSvg: diff.modifiedImageSvg || getSvgFallback(diff.modifiedImage) || `${imagesPath}/modified/page-${diff.page}.svg`,
        diffPathSvg: diff.diffPathSvg || (diff.hasDifference && diff.diffPath ? getSvgFallback(diff.diffPath) : null),
      };
    }

    // Si no hay diff, usar rutas base
    return {
      page: currentPage,
      hasDifference: false,
      diffPercentage: 0,
      diffPath: null,
      originalImage: `${imagesPath}/original/page-${currentPage}.png`,
      modifiedImage: `${imagesPath}/modified/page-${currentPage}.png`,
      originalImageSvg: `${imagesPath}/original/page-${currentPage}.svg`,
      modifiedImageSvg: `${imagesPath}/modified/page-${currentPage}.svg`,
      diffPathSvg: null,
    };
  };

  const currentPageData = getCurrentPageData();

  // Función helper para manejar errores de carga de imagen con fallback a SVG
  const handleImageError = (e, svgPath) => {
    const img = e.target;
    // Si ya intentamos SVG, mostrar placeholder
    if (img.src.endsWith('.svg') || !svgPath) {
      img.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI0YzRjRGNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSIxMDAiIHk9IjI1MCIgZm9udC1zaXplPSIxOCI+SW1hZ2VuIG5vIGVuY29udHJhZGE8L3RleHQ+PC9zdmc+";
      img.onerror = null; // Prevenir loop infinito
      return;
    }
    // Intentar cargar SVG
    img.src = svgPath;
    img.onerror = () => {
      img.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI0YzRjRGNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB4PSIxMDAiIHk9IjI1MCIgZm9udC1zaXplPSIxOCI+SW1hZ2VuIG5vIGVuY29udHJhZGE8L3RleHQ+PC9zdmc+";
      img.onerror = null;
    };
  };

  if (!comparisonData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-md border border-gray-200">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No hay datos de comparación
          </h2>
          <p className="text-gray-600">
            Por favor, realiza una comparación primero.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">

      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Page Navigation */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Navegación:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="w-9 h-9 p-0 flex items-center justify-center border border-gray-300 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-3">
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const page = Number.parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) setCurrentPage(page);
                  }}
                  className="w-14 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-center text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  min={1}
                  max={totalPages}
                />
                <span className="text-sm text-gray-600">de {totalPages}</span>
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="w-9 h-9 p-0 flex items-center justify-center border border-gray-300 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Zoom:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="w-9 h-9 p-0 flex items-center justify-center border border-gray-300 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="min-w-16 text-center text-sm font-semibold text-gray-900">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="w-9 h-9 p-0 flex items-center justify-center border border-gray-300 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="w-9 h-9 p-0 flex items-center justify-center border border-gray-300 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toggle Differences */}
          <button
            onClick={() => setShowDifferences(!showDifferences)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              showDifferences
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            }`}
          >
            {showDifferences ? (
              <>
                <Eye className="w-4 h-4" />
                Ocultar Diferencias
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Mostrar Diferencias
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content - Two Panels */}
      <div className="flex flex-1 overflow-hidden bg-gray-100">
        {/* Original PDF Panel */}
        <div className="flex flex-1 flex-col border-r border-gray-300 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span>📄</span>
              PDF Original
            </h3>
          </div>
          <div
            ref={leftScrollRef}
            className="flex flex-1 items-start justify-center overflow-auto p-8 bg-gray-50"
            style={{ cursor: zoom > 100 ? "grab" : "default" }}
          >
            <div className="relative">
              <img
                src={currentPageData.originalImage}
                alt="PDF Original"
                className="max-w-none shadow-xl border border-gray-300 rounded-sm"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top left",
                }}
                onError={(e) => handleImageError(e, currentPageData.originalImageSvg)}
              />
            </div>
          </div>
        </div>

        {/* Modified PDF Panel with Differences Overlay */}
        <div className="flex flex-1 flex-col bg-white relative">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span>📝</span>
              PDF Comparado
            </h3>
          </div>
          <div
            ref={rightScrollRef}
            className="flex flex-1 items-start justify-center overflow-auto p-8 relative bg-gray-50"
            style={{ cursor: zoom > 100 ? "grab" : "default" }}
          >
            <div 
              className="relative" 
              style={{ 
                position: "relative",
                display: "inline-block",
                lineHeight: 0
              }}
            >
              {/* Base Modified Image */}
              <img
                ref={baseImageRef}
                src={currentPageData.modifiedImage}
                alt="PDF Comparado"
                className="max-w-none shadow-xl border border-gray-300 rounded-sm"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top left",
                  position: "relative",
                  zIndex: 1,
                  display: "block",
                  margin: 0,
                  padding: 0,
                }}
                onError={(e) => handleImageError(e, currentPageData.modifiedImageSvg)}
                onLoad={(e) => {
                  // Capturar las dimensiones reales de la imagen base
                  const img = e.target;
                  setImageDimensions({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                  });
                }}
              />

              {/* Differences Overlay - Debe estar encima de la imagen modificada con z-index mayor */}
              {showDifferences && (currentPageData.highlightPath || currentPageData.diffPath) && imageDimensions.width > 0 && (
                <div
                  className="absolute top-0 left-0"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top left",
                    zIndex: 10,
                    position: "absolute",
                    pointerEvents: "none",
                    width: `${imageDimensions.width}px`,
                    height: `${imageDimensions.height}px`,
                    overflow: "hidden",
                  }}
                >
                  {/* Si tenemos highlightPath, usarlo directamente (ya tiene rojo) */}
                  {currentPageData.highlightPath ? (
                    <img
                      src={currentPageData.highlightPath}
                      alt="Diferencias"
                      className="max-w-none"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "fill",
                        mixBlendMode: "normal",
                        opacity: 1,
                        display: "block",
                      }}
                      onError={(e) => {
                        console.warn('Error cargando highlightPath, usando diffPath con filtro rojo');
                        // Fallback a diffPath con filtro rojo
                        if (currentPageData.diffPath) {
                          e.target.src = currentPageData.diffPath;
                          e.target.style.filter = "brightness(0) saturate(100%) invert(15%) sepia(100%) saturate(7472%) hue-rotate(359deg) brightness(95%) contrast(118%)";
                          e.target.style.mixBlendMode = "multiply";
                        }
                      }}
                    />
                  ) : (
                    /* Si solo tenemos diffPath (blanco/negro), aplicar filtro para convertir áreas blancas a rojo */
                    <img
                      src={currentPageData.diffPath}
                      alt="Diferencias"
                      className="max-w-none"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "fill",
                        display: "block",
                        // Convertir áreas blancas (diferencias) a rojo brillante
                        // El diff tiene blanco donde hay diferencias, negro donde no
                        // Usamos un filtro que invierte y colorea en rojo
                        filter: "brightness(0) saturate(100%) invert(27%) sepia(100%) saturate(7472%) hue-rotate(359deg) brightness(1.2) contrast(1.2)",
                        mixBlendMode: "screen",
                        opacity: 0.9,
                      }}
                      onError={(e) => {
                        console.warn('Error cargando imagen de diferencias:', currentPageData.diffPath);
                        const svgPath = currentPageData.diffPathSvg || e.target.src.replace(".png", ".svg");
                        e.target.src = svgPath;
                        e.target.onerror = () => {
                          e.target.style.display = "none";
                        };
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info tooltip when differences are shown */}
          {showDifferences && (
            <div 
              className="absolute bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-medium border border-red-700"
              style={{ zIndex: 20 }}
            >
              🔍 Las áreas rojas indican diferencias
            </div>
          )}
        </div>
      </div>
    </div>
  );
}