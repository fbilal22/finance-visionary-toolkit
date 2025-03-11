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

export const parseCSV = (csvText: string): string[][] => {
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
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = '';
      } else {
        if (!(char === '"' && (i === 0 || i === line.length - 1 || line[i+1] === ','))) {
          currentValue += char;
        }
      }
    }
    
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

export const determineColumnTypes = (
  data: string[][],
  headers: string[]
): Record<string, 'numeric' | 'categorical' | 'date' | 'unknown'> => {
  const types: Record<string, 'numeric' | 'categorical' | 'date' | 'unknown'> = {};
  
  headers.forEach((header, index) => {
    const sampleValues = data.slice(1, Math.min(11, data.length))
      .map(row => row[index])
      .filter(val => val !== undefined && val !== '');
    
    if (sampleValues.length === 0) {
      types[header] = 'unknown';
      return;
    }
    
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      /^\d{4}-\d{1,2}-\d{1,2}$/,
      /^\d{1,2}-\d{1,2}-\d{4}$/,
      /^\d{1,2}\.\d{1,2}\.\d{4}$/,
      /^\d{4}\/\d{1,2}\/\d{1,2}$/,
      /^\d{1,2}\s+[a-zA-Z]{3,}\s+\d{4}$/,
      /^[a-zA-Z]{3,}\s+\d{1,2},?\s+\d{4}$/
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
    
    const isNumeric = sampleValues.every(val => {
      if (val.endsWith('%')) {
        const numPart = val.replace('%', '');
        return !isNaN(parseFloat(numPart));
      }
      
      if (/^[\d,.]+[KMB]$/i.test(val)) {
        return true;
      }
      
      const cleanVal = val.replace(/[^\d.-]/g, '');
      return !isNaN(parseFloat(cleanVal));
    });
    
    if (isNumeric) {
      types[header] = 'numeric';
      console.log(`Detected numeric column: ${header}`);
      return;
    }
    
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

const normalizeVolume = (volume: string): number => {
  if (!volume) return 0;
  
  volume = volume.replace(/,/g, '');
  
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

const cleanPercentage = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace('%', '')) / 100;
};

const parseDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('/');
      if (parts.length === 3 && parseInt(parts[0]) <= 12) {
        const [month, day, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      return dateStr;
    }
    
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
      return dateStr.replace(/\//g, '-');
    }
    
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return dateStr;
  } catch (error) {
    console.error("Error parsing date:", dateStr, error);
    return dateStr;
  }
};

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
  
  let dateColumnIndex = headers.findIndex(
    header => columnTypes[header] === 'date' || 
              header.toLowerCase().includes('date')
  );
  
  console.log('Date column index:', dateColumnIndex, 'Column name:', headers[dateColumnIndex]);
  
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
      columnMapping[header] = header;
    }
  });
  
  console.log("Column mapping:", columnMapping);
  
  const structuredData: FinancialDataPoint[] = dataRows.map(row => {
    const dataPoint: FinancialDataPoint = { date: '' };
    
    headers.forEach((header, index) => {
      const value = row[index];
      if (value === undefined || value === '') return;
      
      const mappedField = columnMapping[header];
      
      if (mappedField === 'date' && value) {
        dataPoint.date = parseDate(value);
      } else if (mappedField === 'volume' && value) {
        dataPoint[mappedField] = normalizeVolume(value);
      } else if (mappedField === 'change' && value) {
        dataPoint[mappedField] = cleanPercentage(value);
      } else if (columnTypes[header] === 'numeric' && value) {
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

  const validData = structuredData.filter(item => item.date && item.date !== '');
  
  const derivedColumnNames = Object.values(columnMapping);
  
  const missingValues: Record<string, number> = {};
  const summary: Record<string, {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
  }> = {};
  
  derivedColumnNames.forEach(mappedCol => {
    missingValues[mappedCol] = 0;
  });
  
  validData.forEach(row => {
    derivedColumnNames.forEach(column => {
      if (row[column] === undefined || row[column] === '') {
        missingValues[column] = (missingValues[column] || 0) + 1;
      }
    });
  });
  
  derivedColumnNames.forEach(column => {
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
    columnNames: derivedColumnNames,
    firstRow: validData[0]
  });
  
  return {
    data: validData,
    meta: {
      columnNames: derivedColumnNames,
      columnTypes,
      rowCount: validData.length,
      missingValues,
      summary
    },
    fileName
  };
};

export const generateSampleData = (): ProcessedDataset => {
  const today = new Date();
  const data: FinancialDataPoint[] = [];
  
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
