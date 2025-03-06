
export interface FinancialDataPoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  [key: string]: string | number | undefined;
}

export interface DatasetMeta {
  columnNames: string[];
  columnTypes: Record<string, 'numeric' | 'categorical' | 'date' | 'unknown'>;
  rowCount: number;
  missingValues: Record<string, number>;
  summary: Record<string, {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
  }>;
}

export interface ProcessedDataset {
  data: FinancialDataPoint[];
  meta: DatasetMeta;
  fileName: string;
}

// Parse CSV data
export const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split('\n');
  return lines.map(line => 
    line.split(',').map(value => value.trim())
  ).filter(line => line.length > 1 && line.some(cell => cell !== ''));
};

// Determine column types
export const determineColumnTypes = (
  data: string[][],
  headers: string[]
): Record<string, 'numeric' | 'categorical' | 'date' | 'unknown'> => {
  const types: Record<string, 'numeric' | 'categorical' | 'date' | 'unknown'> = {};
  
  headers.forEach((header, index) => {
    // Check first few non-header rows to determine type
    const sampleValues = data.slice(1, Math.min(11, data.length))
      .map(row => row[index])
      .filter(val => val !== undefined && val !== '');
    
    if (sampleValues.length === 0) {
      types[header] = 'unknown';
      return;
    }
    
    // Check if it's a date column
    const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{2}$/;
    if (sampleValues.every(val => datePattern.test(val))) {
      types[header] = 'date';
      return;
    }
    
    // Check if it's a numeric column
    const numericPattern = /^-?\d+(\.\d+)?$/;
    if (sampleValues.every(val => numericPattern.test(val))) {
      types[header] = 'numeric';
      return;
    }
    
    // If small number of unique values relative to sample size, likely categorical
    const uniqueValues = new Set(sampleValues);
    if (uniqueValues.size <= Math.max(5, sampleValues.length * 0.3)) {
      types[header] = 'categorical';
      return;
    }
    
    types[header] = 'unknown';
  });
  
  return types;
};

// Convert raw CSV data to structured dataset
export const processCSVData = (csvText: string, fileName: string): ProcessedDataset => {
  const parsedData = parseCSV(csvText);
  const headers = parsedData[0];
  const dataRows = parsedData.slice(1);
  
  const columnTypes = determineColumnTypes(parsedData, headers);
  
  // Convert to proper data types
  const structuredData: FinancialDataPoint[] = dataRows.map(row => {
    const dataPoint: FinancialDataPoint = { date: '' };
    
    headers.forEach((header, index) => {
      const value = row[index];
      
      if (columnTypes[header] === 'date') {
        dataPoint.date = value;
      } else if (columnTypes[header] === 'numeric') {
        dataPoint[header] = value ? parseFloat(value) : undefined;
      } else {
        dataPoint[header] = value;
      }
    });
    
    return dataPoint;
  });

  // Analyze dataset for metadata
  const missingValues: Record<string, number> = {};
  const summary: Record<string, {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
  }> = {};
  
  headers.forEach(header => {
    missingValues[header] = structuredData.filter(row => 
      row[header] === undefined || row[header] === ''
    ).length;
    
    if (columnTypes[header] === 'numeric') {
      const values = structuredData
        .map(row => row[header] as number)
        .filter(val => val !== undefined) as number[];
      
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / values.length;
        const median = sorted.length % 2 === 0 
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];
        
        // Calculate standard deviation
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        summary[header] = {
          min: sorted[0],
          max: sorted[sorted.length - 1],
          mean,
          median,
          stdDev
        };
      }
    }
  });
  
  return {
    data: structuredData,
    meta: {
      columnNames: headers,
      columnTypes,
      rowCount: structuredData.length,
      missingValues,
      summary
    },
    fileName
  };
};

// Generate sample data for testing
export const generateSampleData = (): ProcessedDataset => {
  const today = new Date();
  const data: FinancialDataPoint[] = [];
  
  // Generate 100 days of sample stock data
  for (let i = 0; i < 100; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const basePrice = 100 + Math.random() * 50;
    const volatility = 2;
    
    const open = basePrice + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility * 2;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    const volume = Math.floor(100000 + Math.random() * 900000);
    
    data.unshift({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
  }
  
  return {
    data,
    meta: {
      columnNames: ['date', 'open', 'high', 'low', 'close', 'volume'],
      columnTypes: {
        date: 'date',
        open: 'numeric',
        high: 'numeric',
        low: 'numeric',
        close: 'numeric',
        volume: 'numeric'
      },
      rowCount: data.length,
      missingValues: {
        date: 0,
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0
      },
      summary: {
        open: {
          min: Math.min(...data.map(d => d.open || 0)),
          max: Math.max(...data.map(d => d.open || 0)),
          mean: data.reduce((sum, d) => sum + (d.open || 0), 0) / data.length,
          median: data.map(d => d.open || 0).sort((a, b) => a - b)[Math.floor(data.length / 2)],
          stdDev: 5
        },
        close: {
          min: Math.min(...data.map(d => d.close || 0)),
          max: Math.max(...data.map(d => d.close || 0)),
          mean: data.reduce((sum, d) => sum + (d.close || 0), 0) / data.length,
          median: data.map(d => d.close || 0).sort((a, b) => a - b)[Math.floor(data.length / 2)],
          stdDev: 5
        }
      }
    },
    fileName: 'sample_stock_data.csv'
  };
};
