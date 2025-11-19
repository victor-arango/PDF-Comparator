import { useState } from 'react';
import ComparisonResult from './components/ComparisonResult';
import EnhancedPDFViewer from './components/EnhancedPDFViewer';
import FileUpload from './components/FileUpload';
import './App.css';
import { ArrowLeft } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState('upload'); // 'upload', 'result', 'viewer'
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async (originalFile, modifiedFile) => {
    const formData = new FormData();
    formData.append('original', originalFile);
    formData.append('modified', modifiedFile);

    setLoading(true);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setComparisonData(result.data);
        setStep('result');
      } else {
        alert(result.message || 'Error al comparar PDFs');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión con el servidor. Verifica que el backend esté ejecutándose.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    setStep('viewer');
  };

  const handleNewComparison = () => {
    setStep('upload');
    setComparisonData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {step === 'upload' && (
        <FileUpload onCompare={handleCompare} loading={loading} />
      )}

      {step === 'result' && comparisonData && (
        <ComparisonResult
          comparisonData={comparisonData}
          onViewDetails={handleViewDetails}
          onNewComparison={handleNewComparison}
        />
      )}

      {step === 'viewer' && comparisonData && (
        <div>

          <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('result')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Resumen
              </button>
            </div>
          </header>

          <EnhancedPDFViewer comparisonData={comparisonData} />
        </div>
      )}
    </div>
  );
}