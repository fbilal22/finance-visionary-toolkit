
import React, { useCallback, useState } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Database, FilePlus2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Import = () => {
  const { loadDataset, loadSampleData, isLoading } = useData();
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
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
      <h1 className="text-3xl font-bold mb-6">Import Financial Data</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload size={20} />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Import your financial data from a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center ${
                dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/20'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <Upload 
                  size={48} 
                  className={`${dragActive ? 'text-primary' : 'text-muted-foreground'}`} 
                />
                <div>
                  <p className="text-lg font-medium">
                    Drag & Drop your CSV file here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse files
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isLoading}
                >
                  Select File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={20} />
              Sample Data
            </CardTitle>
            <CardDescription>
              Load sample financial data to explore the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <FilePlus2 size={48} className="text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    No file to upload?
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try our sample stock market dataset to explore the app's features
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleSampleData}
              disabled={isLoading}
            >
              Load Sample Data
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Import;
