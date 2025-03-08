
import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LineChart, ArrowRight } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  linearRegressionModel,
  movingAverageModel,
  exponentialSmoothingModel,
  doubleExponentialSmoothingModel,
  arimaLikeModel,
  seasonalNaiveModel,
  meanReversionModel
} from '@/utils/predictionModels';

type PredictionMethod = 
  | 'linear' 
  | 'movingAverage' 
  | 'exponential' 
  | 'doubleExponential'
  | 'arima'
  | 'seasonal'
  | 'meanReversion';

const predictionMethods = [
  { id: 'linear', name: 'Linear Regression', description: 'Fits a straight line to historical data.' },
  { id: 'movingAverage', name: 'Moving Average', description: 'Uses the average of recent periods to predict future values.' },
  { id: 'exponential', name: 'Exponential Smoothing', description: 'Weights recent observations more heavily than older ones.' },
  { id: 'doubleExponential', name: 'Double Exponential', description: 'Handles data with trends using two smoothing equations.' },
  { id: 'arima', name: 'ARIMA-like', description: 'Simplified version of Auto-Regressive Integrated Moving Average.' },
  { id: 'seasonal', name: 'Seasonal Naive', description: 'Assumes future values follow seasonal patterns from the past.' },
  { id: 'meanReversion', name: 'Mean Reversion', description: 'Assumes prices tend to return to their historical average.' },
];

const Prediction = () => {
  const { dataset, isLoading } = useData();
  const navigate = useNavigate();
  
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [dateColumn, setDateColumn] = useState<string>('');
  const [predictionDays, setPredictionDays] = useState<number>(7);
  const [predictionMethod, setPredictionMethod] = useState<PredictionMethod>('linear');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('chart');
  const [modelComparison, setModelComparison] = useState<Record<string, any[]>>({});

  // Redirect if no data
  useEffect(() => {
    if (!isLoading && !dataset) {
      navigate('/');
    } else if (dataset) {
      // Set default values when dataset loads
      const { meta } = dataset;
      const dateCol = meta.columnNames.find(col => meta.columnTypes[col] === 'date');
      if (dateCol) setDateColumn(dateCol);
      
      const numericCols = meta.columnNames.filter(col => meta.columnTypes[col] === 'numeric');
      if (numericCols.length > 0) setTargetColumn(numericCols[0]);
    }
  }, [dataset, isLoading, navigate]);

  const generatePredictions = () => {
    if (!dataset || !targetColumn || !dateColumn) {
      toast({
        title: "Error",
        description: "Please select target column and date column",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Use last 30 data points for prediction
      const data = dataset.data.slice(-30);
      
      let predictedData;
      
      switch (predictionMethod) {
        case 'linear':
          predictedData = linearRegressionModel(data, targetColumn, predictionDays);
          break;
        case 'movingAverage':
          predictedData = movingAverageModel(data, targetColumn, predictionDays);
          break;
        case 'exponential':
          predictedData = exponentialSmoothingModel(data, targetColumn, predictionDays);
          break;
        case 'doubleExponential':
          predictedData = doubleExponentialSmoothingModel(data, targetColumn, predictionDays);
          break;
        case 'arima':
          predictedData = arimaLikeModel(data, targetColumn, predictionDays);
          break;
        case 'seasonal':
          predictedData = seasonalNaiveModel(data, targetColumn, predictionDays);
          break;
        case 'meanReversion':
          predictedData = meanReversionModel(data, targetColumn, predictionDays);
          break;
      }
      
      // Combine historical and predicted data for visualization
      const combinedData = [...data, ...predictedData];
      setPredictions(combinedData);
      
      toast({
        title: "Predictions Generated",
        description: `Generated ${predictionDays} days of predictions using ${predictionMethod} method.`,
      });
    } catch (error) {
      console.error("Error generating predictions:", error);
      toast({
        title: "Error",
        description: "Failed to generate predictions",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const compareAllModels = () => {
    if (!dataset || !targetColumn || !dateColumn) {
      toast({
        title: "Error",
        description: "Please select target column and date column",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Use last 30 data points for all models
      const data = dataset.data.slice(-30);
      const comparisonResults: Record<string, any[]> = {};
      
      // Generate predictions for all models
      predictionMethods.forEach(method => {
        let predictedData;
        
        switch (method.id) {
          case 'linear':
            predictedData = linearRegressionModel(data, targetColumn, predictionDays);
            break;
          case 'movingAverage':
            predictedData = movingAverageModel(data, targetColumn, predictionDays);
            break;
          case 'exponential':
            predictedData = exponentialSmoothingModel(data, targetColumn, predictionDays);
            break;
          case 'doubleExponential':
            predictedData = doubleExponentialSmoothingModel(data, targetColumn, predictionDays);
            break;
          case 'arima':
            predictedData = arimaLikeModel(data, targetColumn, predictionDays);
            break;
          case 'seasonal':
            predictedData = seasonalNaiveModel(data, targetColumn, predictionDays);
            break;
          case 'meanReversion':
            predictedData = meanReversionModel(data, targetColumn, predictionDays);
            break;
        }
        
        comparisonResults[method.id] = predictedData;
      });
      
      setModelComparison(comparisonResults);
      setActiveTab('comparison');
      
      toast({
        title: "Model Comparison Generated",
        description: `Compared all prediction models for ${predictionDays} days.`,
      });
    } catch (error) {
      console.error("Error generating model comparison:", error);
      toast({
        title: "Error",
        description: "Failed to generate model comparison",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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

  const { meta } = dataset;
  
  // Get numeric columns for target selection
  const numericColumns = meta.columnNames.filter(col => 
    meta.columnTypes[col] === 'numeric'
  );

  // Format tooltip value
  const formatValue = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Prepare data for model comparison chart
  const prepareComparisonData = () => {
    if (Object.keys(modelComparison).length === 0) return [];
    
    const result = [];
    
    // For each day in the prediction period
    for (let i = 0; i < predictionDays; i++) {
      const dayData: Record<string, any> = {
        day: i + 1,
        date: Object.values(modelComparison)[0][i]?.date || `Day ${i + 1}`
      };
      
      // Add prediction for each model
      Object.entries(modelComparison).forEach(([modelId, predictions]) => {
        const predictionValue = predictions[i]?.[targetColumn];
        dayData[modelId] = predictionValue;
      });
      
      result.push(dayData);
    }
    
    return result;
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Prediction</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Series Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-1 block">Target Column</label>
                <Select value={targetColumn} onValueChange={setTargetColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target column" />
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
                <label className="text-sm font-medium mb-1 block">Date Column</label>
                <Select value={dateColumn} onValueChange={setDateColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date column" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.columnNames
                      .filter(col => meta.columnTypes[col] === 'date')
                      .map(col => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Prediction Method</label>
                <Select value={predictionMethod} onValueChange={(value: PredictionMethod) => setPredictionMethod(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {predictionMethods.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Days to Predict</label>
                <Input
                  type="number"
                  value={predictionDays}
                  onChange={(e) => setPredictionDays(parseInt(e.target.value) || 7)}
                  min={1}
                  max={30}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button 
                onClick={generatePredictions}
                disabled={isGenerating || !targetColumn || !dateColumn}
              >
                {isGenerating ? "Generating..." : "Generate Predictions"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={compareAllModels}
                disabled={isGenerating || !targetColumn || !dateColumn}
              >
                Compare All Models
              </Button>
            </div>
            
            {(predictions.length > 0 || Object.keys(modelComparison).length > 0) && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chart">Prediction Chart</TabsTrigger>
                  <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chart" className="mt-4">
                  {predictions.length > 0 && (
                    <div className="bg-finance-chart-bg rounded-lg p-4">
                      <ResponsiveContainer width="100%" height={400}>
                        <RechartsLineChart 
                          data={predictions} 
                          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis 
                            dataKey={dateColumn} 
                            angle={-45} 
                            textAnchor="end" 
                            height={60} 
                            tick={{ fontSize: 12 }} 
                          />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(26, 33, 48, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                            formatter={(value: number) => [formatValue(value), targetColumn]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey={targetColumn} 
                            stroke="#1E88E5" 
                            strokeWidth={2}
                            dot={{ r: 1 }}
                            activeDot={{ r: 5 }}
                            name="Historical"
                            connectNulls={true}
                          />
                          {/* Highlight prediction points */}
                          <Line 
                            type="monotone" 
                            dataKey={(dataPoint) => dataPoint.isPrediction ? dataPoint[targetColumn] : null}
                            stroke="#4CAF50" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 3 }}
                            activeDot={{ r: 7 }}
                            name="Prediction"
                            connectNulls={true}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="comparison" className="mt-4">
                  {Object.keys(modelComparison).length > 0 && (
                    <>
                      <div className="bg-finance-chart-bg rounded-lg p-4 mb-6">
                        <ResponsiveContainer width="100%" height={400}>
                          <RechartsLineChart 
                            data={prepareComparisonData()} 
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis 
                              dataKey="date" 
                              angle={-45} 
                              textAnchor="end" 
                              height={60} 
                              tick={{ fontSize: 12 }} 
                            />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'rgba(26, 33, 48, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                              formatter={(value: number, name: string) => {
                                const methodName = predictionMethods.find(m => m.id === name)?.name || name;
                                return [formatValue(value), methodName];
                              }}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Legend />
                            {predictionMethods.map((method, index) => {
                              // Different colors for each model
                              const colors = ['#1E88E5', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#673AB7', '#FFEB3B'];
                              return (
                                <Line 
                                  key={method.id}
                                  type="monotone" 
                                  dataKey={method.id} 
                                  stroke={colors[index % colors.length]} 
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                  activeDot={{ r: 7 }}
                                  name={method.name}
                                />
                              );
                            })}
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              {predictionMethods.map(method => (
                                <TableHead key={method.id}>{method.name}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {prepareComparisonData().map((day, index) => (
                              <TableRow key={index}>
                                <TableCell>{day.date}</TableCell>
                                {predictionMethods.map(method => (
                                  <TableCell key={method.id}>
                                    {formatValue(day[method.id])}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {predictionMethods.map(method => (
                          <div key={method.id} className="border rounded-lg p-4 flex flex-col h-full">
                            <h3 className="font-medium text-lg mb-2">{method.name}</h3>
                            <p className="text-sm text-muted-foreground mb-auto">{method.description}</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-4 self-start"
                              onClick={() => {
                                setPredictionMethod(method.id as PredictionMethod);
                                generatePredictions();
                                setActiveTab('chart');
                              }}
                            >
                              Use this model
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => navigate('/visualization')}>
            Back to Visualization
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Prediction;
