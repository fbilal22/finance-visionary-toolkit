
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessedDataset, generateSampleData } from '@/utils/dataProcessing';
import { toast } from '@/components/ui/use-toast';

interface DataContextType {
  dataset: ProcessedDataset | null;
  isLoading: boolean;
  loadDataset: (file: File) => Promise<void>;
  loadSampleData: () => void;
  clearData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [dataset, setDataset] = useState<ProcessedDataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadDataset = async (file: File) => {
    try {
      setIsLoading(true);
      console.log("Loading file:", file.name);
      
      // Read the file content
      const text = await file.text();
      
      // Import the processing function dynamically to reduce initial load time
      const { processCSVData } = await import('@/utils/dataProcessing');
      
      // Process the CSV data
      const processed = processCSVData(text, file.name);
      
      if (processed.data.length === 0) {
        throw new Error("No valid data rows could be processed. Please check the file format.");
      }
      
      console.log("Processed data:", {
        rowCount: processed.data.length,
        columnNames: processed.meta.columnNames,
        firstRow: processed.data[0]
      });
      
      setDataset(processed);
      
      toast({
        title: "Data Loaded Successfully",
        description: `${processed.meta.rowCount} rows and ${processed.meta.columnNames.length} columns imported.`,
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error Loading Data",
        description: error instanceof Error ? error.message : "The file couldn't be processed. Please check the format.",
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
    toast({
      title: "Data Cleared",
      description: "All data has been cleared from the application.",
    });
  };

  return (
    <DataContext.Provider
      value={{
        dataset,
        isLoading,
        loadDataset,
        loadSampleData,
        clearData,
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
