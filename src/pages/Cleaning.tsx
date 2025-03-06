
import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Eraser, Code, Calculator, LineChart, Gauge } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Cleaning = () => {
  const { dataset, isLoading } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('missing');
  
  // Cleaning configuration
  const [selectedColumn, setSelectedColumn] = useState('');
  const [missingStrategy, setMissingStrategy] = useState('mean');
  const [outlierMethod, setOutlierMethod] = useState('zscore');
  const [outlierThreshold, setOutlierThreshold] = useState('3');
  const [normalizeColumns, setNormalizeColumns] = useState<string[]>([]);

  // Redirect if no data
  useMemo(() => {
    if (!isLoading && !dataset) {
      navigate('/');
    }
  }, [dataset, isLoading, navigate]);

  if (!dataset) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            Please upload a CSV file or load sample data to continue.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/')} className="mt-4">
          Go to Import
        </Button>
      </div>
    );
  }

  const { data, meta } = dataset;
  const { columnNames, columnTypes, missingValues } = meta;
  
  // Filter columns by type
  const numericColumns = columnNames.filter(col => columnTypes[col] === 'numeric');
  const columnsWithMissing = Object.entries(missingValues)
    .filter(([_, count]) => count > 0)
    .map(([col]) => col);
  
  // Handle missing values
  const handleFillMissingValues = () => {
    if (!selectedColumn) {
      toast({
        title: "Error",
        description: "Please select a column to process.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Processing Data",
      description: `Filled missing values in '${selectedColumn}' using ${missingStrategy} method.`,
    });
  };
  
  // Handle outlier detection and removal
  const handleOutlierRemoval = () => {
    if (!selectedColumn) {
      toast({
        title: "Error",
        description: "Please select a column to process.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Processing Data",
      description: `Detected and processed outliers in '${selectedColumn}' using ${outlierMethod} method with threshold ${outlierThreshold}.`,
    });
  };
  
  // Handle normalization/standardization
  const handleNormalize = () => {
    if (normalizeColumns.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one column to normalize.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Processing Data",
      description: `Normalized ${normalizeColumns.length} columns: ${normalizeColumns.join(', ')}.`,
    });
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Data Cleaning & Preprocessing</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="missing">
            <Eraser size={16} className="mr-1" />
            Missing Values
          </TabsTrigger>
          <TabsTrigger value="outliers">
            <Gauge size={16} className="mr-1" />
            Outliers
          </TabsTrigger>
          <TabsTrigger value="normalize">
            <Calculator size={16} className="mr-1" />
            Normalize & Scale
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="missing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Missing Values</CardTitle>
                  <CardDescription>
                    Handle missing values in your dataset
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Select Column</label>
                      <Select 
                        value={selectedColumn} 
                        onValueChange={setSelectedColumn}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column with missing values" />
                        </SelectTrigger>
                        <SelectContent>
                          {columnsWithMissing.length > 0 ? (
                            columnsWithMissing.map(col => (
                              <SelectItem key={col} value={col}>
                                {col} ({missingValues[col]} missing)
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No columns with missing values
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Fill Method</label>
                      <Select 
                        value={missingStrategy} 
                        onValueChange={setMissingStrategy}
                        disabled={!selectedColumn || !numericColumns.includes(selectedColumn)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mean">Mean</SelectItem>
                          <SelectItem value="median">Median</SelectItem>
                          <SelectItem value="mode">Mode</SelectItem>
                          <SelectItem value="constant">Constant Value</SelectItem>
                          <SelectItem value="interpolate">Interpolate</SelectItem>
                          <SelectItem value="remove">Remove Rows</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {missingStrategy === 'constant' && (
                      <div>
                        <label className="text-sm font-medium mb-1 block">Constant Value</label>
                        <Input 
                          type="number" 
                          placeholder="Enter value"
                          className="w-full"
                        />
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleFillMissingValues}
                      disabled={!selectedColumn || columnsWithMissing.length === 0}
                      className="w-full"
                    >
                      Process Missing Values
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Columns with Missing Values</CardTitle>
                </CardHeader>
                <CardContent>
                  {columnsWithMissing.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Missing Count</TableHead>
                            <TableHead>Missing %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(missingValues)
                            .filter(([_, count]) => count > 0)
                            .sort(([_, a], [__, b]) => b - a)
                            .map(([column, count]) => (
                              <TableRow key={column}>
                                <TableCell className="font-medium">{column}</TableCell>
                                <TableCell>
                                  <Badge className={
                                    columnTypes[column] === 'numeric' 
                                      ? 'bg-finance-blue text-white' 
                                      : columnTypes[column] === 'date'
                                      ? 'bg-finance-purple text-white'
                                      : 'bg-finance-yellow text-black'
                                  }>
                                    {columnTypes[column]}
                                  </Badge>
                                </TableCell>
                                <TableCell>{count}</TableCell>
                                <TableCell>{((count / data.length) * 100).toFixed(2)}%</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] bg-muted/20 rounded-lg">
                      <Eraser size={48} className="text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No missing values detected in the dataset.<br />
                        Your data is already clean in this regard!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="outliers">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Detect & Remove Outliers</CardTitle>
                  <CardDescription>
                    Find and handle outliers in your dataset
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Select Column</label>
                      <Select 
                        value={selectedColumn} 
                        onValueChange={setSelectedColumn}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {numericColumns.map(col => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Outlier Detection Method</label>
                      <Select 
                        value={outlierMethod} 
                        onValueChange={setOutlierMethod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zscore">Z-Score</SelectItem>
                          <SelectItem value="iqr">IQR (Interquartile Range)</SelectItem>
                          <SelectItem value="percentile">Percentile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Threshold</label>
                      <Input 
                        type="number" 
                        value={outlierThreshold}
                        onChange={(e) => setOutlierThreshold(e.target.value)}
                        placeholder={
                          outlierMethod === 'zscore' 
                            ? 'Z-score (e.g., 3)' 
                            : outlierMethod === 'iqr' 
                            ? 'IQR factor (e.g., 1.5)' 
                            : 'Percentile (e.g., 95)'
                        }
                        className="w-full"
                        min={outlierMethod === 'percentile' ? 50 : 0}
                        max={outlierMethod === 'percentile' ? 100 : undefined}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remove-outliers" />
                      <label
                        htmlFor="remove-outliers"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Remove detected outliers
                      </label>
                    </div>
                    
                    <Button 
                      onClick={handleOutlierRemoval}
                      disabled={!selectedColumn}
                      className="w-full"
                    >
                      Detect Outliers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Outlier Detection Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-[300px] bg-muted/20 rounded-lg">
                    <Gauge size={48} className="text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Select a column and detection method to visualize outliers
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="normalize">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Normalize & Scale Data</CardTitle>
                  <CardDescription>
                    Prepare your data for modeling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Select Columns</label>
                      <ScrollArea className="h-[200px] border rounded-md p-2">
                        <div className="space-y-2">
                          {numericColumns.map(col => (
                            <div key={col} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`normalize-${col}`} 
                                checked={normalizeColumns.includes(col)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNormalizeColumns([...normalizeColumns, col]);
                                  } else {
                                    setNormalizeColumns(normalizeColumns.filter(c => c !== col));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`normalize-${col}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {col}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Scaling Method</label>
                      <Select defaultValue="minmax">
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minmax">Min-Max Scaling (0-1)</SelectItem>
                          <SelectItem value="standard">Standard Scaling (Z-score)</SelectItem>
                          <SelectItem value="robust">Robust Scaling (IQR-based)</SelectItem>
                          <SelectItem value="log">Log Transform</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleNormalize}
                      disabled={normalizeColumns.length === 0}
                      className="w-full"
                    >
                      Apply Normalization
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Original vs. Normalized Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-[300px] bg-muted/20 rounded-lg">
                    <LineChart size={48} className="text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Select columns to normalize and see the comparison
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex gap-2 justify-end mt-6">
        <Button variant="outline" onClick={() => navigate('/visualization')}>
          Back to Visualization
        </Button>
        <Button onClick={() => navigate('/prediction')}>
          Continue to Prediction
        </Button>
      </div>
    </div>
  );
};

export default Cleaning;
