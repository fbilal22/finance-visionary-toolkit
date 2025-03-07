
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

// Parse CSV data with proper handling of quoted values
export const parseCSV = (csvText: string): string[][] => {
  // Split by lines, accounting for both \r\n and \n line endings
  const lines = csvText.split(/\r?\n/);
  const result: string[][] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
        // Toggle quote state, but don't add the quote character
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // End of cell - only if not inside quotes
        row.push(currentValue.trim());
        currentValue = '';
      } else {
        // Add character to current value, excluding quote characters
        if (!(char === '"' && (i === 0 || i === line.length - 1 || line[i+1] === ','))) {
          currentValue += char;
        }
      }
    }
    
    // Add the last cell
    if (currentValue || row.length > 0) {
      row.push(currentValue.trim());
    }
    
    if (row.length > 0) {
      result.push(row);
    }
  }
  
  console.log("Parsed CSV data:", result.slice(0, 3));
  return result;
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
    
    // Enhanced date pattern detection
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,  // MM/DD/YYYY or DD/MM/YYYY
      /^\d{4}-\d{1,2}-\d{1,2}$/,    // YYYY-MM-DD
      /^\d{1,2}-\d{1,2}-\d{4}$/,    // DD-MM-YYYY or MM-DD-YYYY
      /^\d{1,2}\.\d{1,2}\.\d{4}$/   // DD.MM.YYYY or MM.DD.YYYY
    ];
    
    const potentialDateColumn = header.toLowerCase().includes('date') || 
                               header.toLowerCase() === 'day' ||
                               header.toLowerCase() === 'month' ||
                               header.toLowerCase() === 'year';
    
    const isDateColumn = potentialDateColumn || 
                        sampleValues.some(val => datePatterns.some(pattern => pattern.test(val)));
    
    if (isDateColumn) {
      types[header] = 'date';
      console.log(`Detected date column: ${header}`);
      return;
    }
    
    // Check if it's a numeric column (may include % or currency symbols or suffixes like M, K)
    const isNumeric = sampleValues.every(val => {
      // Check for percentage values like "0.72%"
      if (val.endsWith('%')) {
        const numPart = val.replace('%', '');
        return !isNaN(parseFloat(numPart));
      }
      
      // Check for volume values with suffixes like "11.43M"
      if (/^[\d,.]+[KMB]$/i.test(val)) {
        return true;
      }
      
      // Check for regular numeric values
      const cleanVal = val.replace(/[^\d.-]/g, ''); // Remove currency symbols, commas, etc.
      return !isNaN(parseFloat(cleanVal));
    });
    
    if (isNumeric) {
      types[header] = 'numeric';
      console.log(`Detected numeric column: ${header}`);
      return;
    }
    
    // If small number of unique values relative to sample size, likely categorical
    const uniqueValues = new Set(sampleValues);
    if (uniqueValues.size <= Math.max(5, sampleValues.length * 0.3)) {
      types[header] = 'categorical';
      console.log(`Detected categorical column: ${header}`);
      return;
    }
    
    types[header] = 'unknown';
  });
  
  console.log("Determined column types:", types);
  return types;
};

// Normalize volume values like "11.43M" to actual numbers
const normalizeVolume = (volume: string): number => {
  if (!volume) return 0;
  
  // Remove commas from numbers like "123,456"
  volume = volume.replace(/,/g, '');
  
  // Handle suffixes like M (million), K (thousand), B (billion)
  const suffixMatch = volume.match(/^([\d.]+)([KMB])$/i);
  if (suffixMatch) {
    const number = parseFloat(suffixMatch[1]);
    const suffix = suffixMatch[2].toUpperCase();
    
    if (suffix === 'K') return number * 1000;
    if (suffix === 'M') return number * 1000000;
    if (suffix === 'B') return number * 1000000000;
  }
  
  return parseFloat(volume);
};

// Clean percentage values by removing % sign and converting to decimal
const cleanPercentage = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace('%', '')) / 100;
};

// Convert raw CSV data to structured dataset
export const processCSVData = (csvText: string, fileName: string): ProcessedDataset => {
  const parsedData = parseCSV(csvText);
  if (parsedData.length < 2) {
    throw new Error("CSV file is empty or could not be parsed correctly");
  }
  
  const headers = parsedData[0];
  const dataRows = parsedData.slice(1);
  
  console.log("Headers:", headers);
  console.log("Sample data row:", dataRows[0]);
  
  const columnTypes = determineColumnTypes(parsedData, headers);
  
  // Find the date column
  let dateColumnIndex = headers.findIndex(
    header => columnTypes[header] === 'date' || 
              header.toLowerCase().includes('date')
  );
  
  console.log('Date column index:', dateColumnIndex, 'Column name:', headers[dateColumnIndex]);
  
  // Map column names to standard financial data fields
  const columnMapping: Record<string, string> = {};
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase();
    
    if (lowerHeader === 'date' || lowerHeader.includes('date')) {
      columnMapping[header] = 'date';
    } else if (lowerHeader === 'price' || lowerHeader === 'close') {
      columnMapping[header] = 'close';
    } else if (lowerHeader === 'open') {
      columnMapping[header] = 'open';
    } else if (lowerHeader === 'high') {
      columnMapping[header] = 'high';
    } else if (lowerHeader === 'low') {
      columnMapping[header] = 'low';
    } else if (lowerHeader === 'vol.' || lowerHeader === 'volume') {
      columnMapping[header] = 'volume';
    } else if (lowerHeader.includes('change') || lowerHeader.includes('%')) {
      columnMapping[header] = 'change';
    } else {
      // Keep original name for other columns
      columnMapping[header] = header;
    }
  });
  
  console.log("Column mapping:", columnMapping);
  
  // Convert to proper data types
  const structuredData: FinancialDataPoint[] = dataRows.map(row => {
    const dataPoint: FinancialDataPoint = { date: '' };
    
    // Process each column
    headers.forEach((header, index) => {
      const value = row[index];
      if (value === undefined || value === '') return; // Skip undefined or empty values
      
      const mappedField = columnMapping[header];
      
      if (mappedField === 'date' && value) {
        // Convert MM/DD/YYYY to YYYY-MM-DD format
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
          const parts = value.split('/');
          if (parts.length === 3) {
            const [month, day, year] = parts;
            dataPoint.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else {
            dataPoint.date = value;
          }
        } else {
          dataPoint.date = value;
        }
      } else if (mappedField === 'volume' && value) {
        dataPoint[mappedField] = normalizeVolume(value);
      } else if (mappedField === 'change' && value) {
        dataPoint[mappedField] = cleanPercentage(value);
      } else if (columnTypes[header] === 'numeric' && value) {
        // Handle numeric values, removing any non-numeric characters except decimal point
        const cleanValue = value.replace(/[^\d.-]/g, '');
        const numValue = parseFloat(cleanValue);
        if (!isNaN(numValue)) {
          dataPoint[mappedField] = numValue;
        }
      } else {
        dataPoint[mappedField] = value;
      }
    });
    
    return dataPoint;
  });

  // Filter out any rows with invalid date
  const validData = structuredData.filter(item => item.date && item.date !== '');

  // Analyze dataset for metadata
  const missingValues: Record<string, number> = {};
  const summary: Record<string, {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
  }> = {};
  
  // Initialize missing values counters for all columns
  columnNames = Object.values(columnMapping);
  columnNames.forEach(mappedCol => {
    missingValues[mappedCol] = 0;
  });
  
  // Count missing values
  validData.forEach(row => {
    columnNames.forEach(column => {
      if (row[column] === undefined || row[column] === '') {
        missingValues[column] = (missingValues[column] || 0) + 1;
      }
    });
  });
  
  // Generate summary statistics for numeric columns
  columnNames.forEach(column => {
    // Find the original column for type checking
    const originalCol = Object.keys(columnMapping).find(key => columnMapping[key] === column);
    
    if (originalCol && columnTypes[originalCol] === 'numeric') {
      const values = validData
        .map(row => row[column] as number)
        .filter(val => val !== undefined && !isNaN(val)) as number[];
      
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
        
        summary[column] = {
          min: sorted[0],
          max: sorted[sorted.length - 1],
          mean,
          median,
          stdDev
        };
      }
    }
  });
  
  console.log("Processed data:", {
    rowCount: validData.length,
    columnNames: columnNames,
    firstRow: validData[0]
  });
  
  return {
    data: validData,
    meta: {
      columnNames,
      columnTypes,
      rowCount: validData.length,
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
