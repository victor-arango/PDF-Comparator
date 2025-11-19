import React from 'react';
import {
  FileText,
  Search,
  Download,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ComparisonResult({
  comparisonData,
  onViewDetails,
  onNewComparison
}) {
  const {
    timestamp = '10/10/2025, 18:58:40',
    totalPages = 2,
    differencesFound = 3,
    differences = [],
    reportUrl
  } = comparisonData || {};

  const handleDownloadReport = async () => {
    try {
      if (reportUrl) {
        const filename = reportUrl.split('/').pop();
        const response = await fetch(`/api/download-report/${filename}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comparacion-pdfs-${Date.now()}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error descargando reporte:', error);
      alert('Error al descargar el reporte. Por favor, intenta nuevamente.');
    }
  };

  const cleanFolders = async () => {
    try {
      const response = await fetch("/api/cleanFolder");
      console.log(response);
      window.location.href = "/";
    } catch (error) {
      console.log(error);
    }
  };

  // Agrupar diferencias por tipo
  const groupedDifferences = differences.reduce((acc, diff) => {
    const type = diff.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(diff);
    return acc;
  }, {});

  const differenceTypes = Object.keys(groupedDifferences);

  const getTypeInfo = (type) => {
    const typeMap = {
      visual: { label: 'Diferencias Visuales', emoji: '👁️' },
      metadata: { label: 'Metadatos', emoji: '📋' },
      content: { label: 'Contenido', emoji: '📝' },
      page: { label: 'Estructura de Página', emoji: '📄' },
      file: { label: 'Información del Archivo', emoji: '🗂️' },
    };
    return typeMap[type] || { label: type, emoji: '📌' };
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm transition-colors">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-inner">
                <FileText className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resumen</p>
                <h1 className="text-3xl font-semibold text-slate-900">Resultado de la Comparación</h1>
                <p className="text-sm text-slate-500">Generado: {timestamp}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={onNewComparison}
                size="lg"
                className="h-12 rounded-2xl bg-slate-900 px-6 text-base font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800"
              >
                <Plus className="size-4" />
                Nueva Comparación
              </Button>
              <Button
                onClick={cleanFolders}
                size="lg"
                variant="outline"
                className="h-12 rounded-2xl border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Trash2 className="size-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Páginas</p>
                <p className="text-4xl font-semibold text-slate-900">{totalPages}</p>
                <p className="text-sm text-slate-500">Total analizadas</p>
              </div>
              <div className="rounded-full bg-slate-100 p-3 text-slate-600">
                <BarChart3 className="size-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Diferencias</p>
                <p className="text-4xl font-semibold text-slate-900">{differencesFound}</p>
                <p className="text-sm text-slate-500">Cambios detectados</p>
              </div>
              <div className="rounded-full bg-amber-100 p-3 text-amber-500">
                <AlertTriangle className="size-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Estado</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {differencesFound === 0 ? 'Idénticos' : 'Modificado'}
                </p>
                <p className="text-sm text-slate-500">
                  {differencesFound === 0 ? 'Sin cambios' : `${differenceTypes.length} tipos de cambios`}
                </p>
              </div>
              <div
                className={`rounded-full p-3 ${differencesFound === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-500'
                  }`}
              >
                {differencesFound === 0 ? (
                  <CheckCircle className="size-5" />
                ) : (
                  <AlertTriangle className="size-5" />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <div className={`rounded-2xl p-4 ${differencesFound === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
              <Search className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Resumen</p>
              <h2 className="text-2xl font-semibold text-slate-900">Diferencias Detectadas</h2>
            </div>
          </div>

          {differencesFound === 0 ? (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white p-4 text-emerald-500 shadow">
                  <CheckCircle className="size-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-emerald-900">¡PDFs Idénticos!</h3>
                  <p className="text-base leading-relaxed text-slate-600">
                    No se encontraron diferencias entre los documentos. Los archivos son completamente iguales.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {differenceTypes.map((type, idx) => {
                const typeInfo = getTypeInfo(type);
                return (
                  <div key={idx} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                      <span>{typeInfo.emoji}</span>
                      <span>{typeInfo.label}</span>
                      <span className="ml-auto rounded-full bg-slate-100 px-3 py-0.5 text-xs text-slate-500">
                        {groupedDifferences[type].length}
                      </span>
                    </div>
                    <div className="space-y-4 p-5">
                      {groupedDifferences[type].slice(0, 3).map((diff, diffIdx) => (
                        <div key={diffIdx} className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                          <div className="mb-3 text-sm font-semibold text-slate-600">
                            {diff.page && <span className="text-slate-900">Página {diff.page} · </span>}
                            <span className="capitalize">{diff.field.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">Original</p>
                              <p className="mt-2 text-sm font-mono text-rose-800 break-words">{diff.original}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modificado</p>
                              <p className="mt-2 text-sm font-mono text-slate-800 break-words">{diff.modified}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {groupedDifferences[type].length > 3 && (
                        <p className="text-center text-sm text-slate-500">
                          + {groupedDifferences[type].length - 3} diferencias más de este tipo
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 md:flex-row">
          <Button
            size="lg"
            onClick={onViewDetails}
            className="h-14 flex-1 rounded-3xl bg-slate-900 text-base font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800"
          >
            <Search className="size-5" />
            Ver Comparación Visual Completa
            <ArrowRight className="ml-auto size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleDownloadReport}
            className="h-14 flex-1 rounded-3xl border-slate-200 bg-white text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="size-5" />
            Descargar Reporte HTML
          </Button>
        </section>

        <section className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
          <span className="text-lg">💡</span>
          <p>El reporte HTML incluye los PDFs completos y puede abrirse en cualquier navegador.</p>
        </section>
      </div>
    </div>
  );
}