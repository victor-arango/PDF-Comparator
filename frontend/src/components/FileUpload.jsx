import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';

export default function FileUpload({ onCompare, loading }) {
  const [originalFile, setOriginalFile] = useState(null);
  const [modifiedFile, setModifiedFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!originalFile || !modifiedFile) {
      alert('Por favor selecciona ambos archivos PDF');
      return;
    }

    await onCompare(originalFile, modifiedFile);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Comparador de PDFs
          </h1>
          <p className="text-gray-600">
            Sube dos archivos PDF para compararlos visualmente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📄 PDF Original
            </label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-all">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setOriginalFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {originalFile ? originalFile.name : 'Haz clic o arrastra el archivo aquí'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📝 PDF Modificado
            </label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-all">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setModifiedFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {modifiedFile ? modifiedFile.name : 'Haz clic o arrastra el archivo aquí'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !originalFile || !modifiedFile}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {loading ? 'Comparando...' : 'Comparar PDFs'}
          </button>
        </form>
      </div>
    </div>
  );
}