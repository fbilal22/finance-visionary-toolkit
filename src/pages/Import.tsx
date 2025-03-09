
import React, { useCallback, useState } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Import = () => {
  const { loadDataset, loadSampleData, isLoading } = useData();
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv') && 
        file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('Please upload a CSV or JSON file');
      return;
    }
    await loadDataset(file);
    navigate('/data');
  }, [loadDataset, navigate]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleSampleData = useCallback(() => {
    loadSampleData();
    navigate('/data');
  }, [loadSampleData, navigate]);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8">Importation de fichiers</h1>
      
      <Card className="border border-dashed">
        <CardContent className="p-0">
          <div
            className={`flex flex-col items-center justify-center py-12 px-4 text-center ${
              dragActive ? 'bg-primary/5' : ''
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <Upload 
              size={48} 
              className={`mb-4 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} 
            />
            
            <h3 className="text-lg font-medium mb-2">
              Cliquez pour importer un fichier CSV, JSON, Excel
            </h3>
            
            <p className="text-sm text-muted-foreground mb-6">
              Formats supportés: .csv, .json
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isLoading}
              >
                Sélectionner un fichier
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSampleData}
                disabled={isLoading}
              >
                Charger des données d'exemple
              </Button>
            </div>
            
            <input
              id="file-upload"
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Import;
