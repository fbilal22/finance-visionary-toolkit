
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessedDataset, generateSampleData } from '@/utils/dataProcessing';
import { toast } from '@/components/ui/use-toast';

interface ModelPrediction {
  modelId: string;
  targetColumn: string;
  predictionDays: number;
  data: any[];
  createdAt: number;
}

interface DataContextType {
  dataset: ProcessedDataset | null;
  isLoading: boolean;
  loadDataset: (file: File) => Promise<void>;
  loadSampleData: () => void;
  clearData: () => void;
  modelPredictions: ModelPrediction[];
  addModelPrediction: (modelId: string, targetColumn: string, predictionDays: number, data: any[]) => void;
  clearModelPredictions: () => void;
  getModelPrediction: (modelId: string, targetColumn: string, predictionDays: number) => ModelPrediction | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [dataset, setDataset] = useState<ProcessedDataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelPredictions, setModelPredictions] = useState<ModelPrediction[]>([]);

  const loadDataset = async (file: File) => {
    try {
      setIsLoading(true);
      console.log("Loading file:", file.name);
      
      // Read the file content
      const text = await file.text();
      
      // Process based on file type
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        // For now, let's handle JSON files similarly to CSV files
        // We'll need to implement a proper JSON parser in dataProcessing.ts later
        const { processCSVData } = await import('@/utils/dataProcessing');
        
        // Process the JSON as if it were CSV for now
        const processed = processCSVData(text, file.name);
        
        if (processed.data.length === 0) {
          throw new Error("No valid data rows could be processed. Please check the file format.");
        }
        
        console.log("Processed JSON data:", {
          rowCount: processed.data.length,
          columnNames: processed.meta.columnNames,
          firstRow: processed.data[0]
        });
        
        setDataset(processed);
      } else {
        // Import the processing function dynamically to reduce initial load time
        const { processCSVData } = await import('@/utils/dataProcessing');
        
        // Process the CSV data
        const processed = processCSVData(text, file.name);
        
        if (processed.data.length === 0) {
          throw new Error("No valid data rows could be processed. Please check the file format.");
        }
        
        console.log("Processed CSV data:", {
          rowCount: processed.data.length,
          columnNames: processed.meta.columnNames,
          firstRow: processed.data[0]
        });
        
        setDataset(processed);
      }
      
      // Clear any existing model predictions when loading new data
      setModelPredictions([]);
      
      toast({
        title: "Data loaded successfully",
        description: `${processed?.meta.rowCount || 0} rows and ${processed?.meta.columnNames.length || 0} columns imported.`,
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "The file could not be processed. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    try {
      setIsLoading(true);
      const sampleData = generateSampleData();
      setDataset(sampleData);
      
      // Clear any existing model predictions when loading sample data
      setModelPredictions([]);
      
      toast({
        title: "Sample Data Loaded",
        description: "Sample financial data has been loaded for demonstration.",
      });
    } catch (error) {
      console.error("Error loading sample data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load sample data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setDataset(null);
    setModelPredictions([]);
    toast({
      title: "Data Cleared",
      description: "All data has been cleared from the application.",
    });
  };

  // Add a new model prediction to the cache
  const addModelPrediction = (modelId: string, targetColumn: string, predictionDays: number, data: any[]) => {
    // Remove any existing prediction with the same parameters
    const filteredPredictions = modelPredictions.filter(
      p => !(p.modelId === modelId && p.targetColumn === targetColumn && p.predictionDays === predictionDays)
    );
    
    // Add the new prediction
    setModelPredictions([
      ...filteredPredictions,
      {
        modelId,
        targetColumn,
        predictionDays,
        data,
        createdAt: Date.now()
      }
    ]);
    
    // If we have more than 20 predictions, remove the oldest ones
    if (filteredPredictions.length >= 20) {
      setModelPredictions(prev => 
        prev.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20)
      );
    }
  };

  // Get a model prediction from the cache if it exists
  const getModelPrediction = (modelId: string, targetColumn: string, predictionDays: number) => {
    return modelPredictions.find(
      p => p.modelId === modelId && p.targetColumn === targetColumn && p.predictionDays === predictionDays
    );
  };

  // Clear all model predictions
  const clearModelPredictions = () => {
    setModelPredictions([]);
  };

  return (
    <DataContext.Provider
      value={{
        dataset,
        isLoading,
        loadDataset,
        loadSampleData,
        clearData,
        modelPredictions,
        addModelPrediction,
        clearModelPredictions,
        getModelPrediction
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
