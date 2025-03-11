
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessedDataset, generateSampleData, processCSVData } from '@/utils/dataProcessing';
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
        // Handle JSON data
        try {
          // First, try to parse as proper JSON
          const jsonData = JSON.parse(text);
          
          // Check if it's an array of objects
          if (Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object') {
            // Convert JSON to CSV-like format for processing
            const headers = Object.keys(jsonData[0]);
            const csvData = [headers.join(',')];
            
            for (const row of jsonData) {
              const values = headers.map(header => {
                const value = row[header];
                // Properly handle strings with commas by quoting them
                if (typeof value === 'string' && value.includes(',')) {
                  return `"${value}"`;
                }
                return value === null || value === undefined ? '' : value;
              });
              csvData.push(values.join(','));
            }
            
            const csvText = csvData.join('\n');
            const processedData = processCSVData(csvText, file.name);
            
            if (processedData.data.length === 0) {
              throw new Error("No valid data rows could be processed. Please check the file format.");
            }
            
            console.log("Processed JSON data:", {
              rowCount: processedData.data.length,
              columnNames: processedData.meta.columnNames,
              firstRow: processedData.data[0]
            });
            
            setDataset(processedData);
            setModelPredictions([]);
            
            toast({
              title: "Data loaded successfully",
              description: `${processedData.meta.rowCount || 0} rows and ${processedData.meta.columnNames.length || 0} columns imported.`,
            });
          } else {
            throw new Error("JSON data must be an array of objects");
          }
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError);
          
          // Fallback to treating it like CSV
          const processedData = processCSVData(text, file.name);
          
          if (processedData.data.length === 0) {
            throw new Error("No valid data rows could be processed. Please check the file format.");
          }
          
          setDataset(processedData);
          setModelPredictions([]);
          
          toast({
            title: "Data loaded successfully",
            description: `${processedData.meta.rowCount || 0} rows and ${processedData.meta.columnNames.length || 0} columns imported.`,
          });
        }
      } else {
        // Process CSV data
        const processedData = processCSVData(text, file.name);
        
        if (processedData.data.length === 0) {
          throw new Error("No valid data rows could be processed. Please check the file format.");
        }
        
        console.log("Processed CSV data:", {
          rowCount: processedData.data.length,
          columnNames: processedData.meta.columnNames,
          firstRow: processedData.data[0]
        });
        
        setDataset(processedData);
        setModelPredictions([]);
        
        toast({
          title: "Data loaded successfully",
          description: `${processedData.meta.rowCount || 0} rows and ${processedData.meta.columnNames.length || 0} columns imported.`,
        });
      }
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
