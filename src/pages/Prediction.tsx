
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

type PredictionMethod = 'linear' | 'movingAverage' | 'exponential';

const Prediction = () => {
  const { dataset, isLoading } = useData();
  const navigate = useNavigate();
  
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [dateColumn, setDateColumn] = useState<string>('');
  const [predictionDays, setPredictionDays] = useState<number>(7);
  const [predictionMethod, setPredictionMethod] = useState<PredictionMethod>('linear');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Linear regression prediction
  const generateLinearPrediction = (data: any[], targetCol: string, daysToPredict: number) => {
    // Extract x and y data points
    const xValues = Array.from({ length: data.length }, (_, i) => i);
    const yValues = data.map(item => item[targetCol]);
    
    // Calculate linear regression coefficients
    const n = xValues.length;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate predictions
    const predictions = [];
    const lastDate = new Date(data[data.length - 1].date);
    
    for (let i = 1; i <= daysToPredict; i++) {
      const nextX = xValues.length + i - 1;
      const predictedValue = slope * nextX + intercept;
      
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      
      predictions.push({
        date: nextDate.toISOString().split('T')[0],
        [targetCol]: parseFloat(predictedValue.toFixed(2)),
        isPrediction: true
      });
    }
    
    return predictions;
  };

  // Moving average prediction
  const generateMovingAveragePrediction = (data: any[], targetCol: string, daysToPredict: number) => {
    const windowSize = 5; // 5-day moving average
    const values = data.map(item => item[targetCol]);
    
    // Calculate the moving average of the last window
    const lastWindow = values.slice(-windowSize);
    const movingAverage = lastWindow.reduce((sum, val) => sum + val, 0) / windowSize;
    
    // Generate predictions
    const predictions = [];
    const lastDate = new Date(data[data.length - 1].date);
    
    for (let i = 1; i <= daysToPredict; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      
      predictions.push({
        date: nextDate.toISOString().split('T')[0],
        [targetCol]: parseFloat(movingAverage.toFixed(2)),
        isPrediction: true
      });
    }
    
    return predictions;
  };

  // Exponential smoothing prediction
  const generateExponentialPrediction = (data: any[], targetCol: string, daysToPredict: number) => {
    const alpha = 0.3; // Smoothing factor
    const values = data.map(item => item[targetCol]);
    
    // Initialize with the first value
    let forecast = values[0];
    
    // Calculate the exponential smoothing
    for (let i = 1; i < values.length; i++) {
      forecast = alpha * values[i] + (1 - alpha) * forecast;
    }
    
    // Generate predictions
    const predictions = [];
    const lastDate = new Date(data[data.length - 1].date);
    
    for (let i = 1; i <= daysToPredict; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      
      predictions.push({
        date: nextDate.toISOString().split('T')[0],
        [targetCol]: parseFloat(forecast.toFixed(2)),
        isPrediction: true
      });
    }
    
    return predictions;
  };

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
          predictedData = generateLinearPrediction(data, targetColumn, predictionDays);
          break;
        case 'movingAverage':
          predictedData = generateMovingAveragePrediction(data, targetColumn, predictionDays);
          break;
        case 'exponential':
          predictedData = generateExponentialPrediction(data, targetColumn, predictionDays);
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
                    <SelectItem value="linear">Linear Regression</SelectItem>
                    <SelectItem value="movingAverage">Moving Average</SelectItem>
                    <SelectItem value="exponential">Exponential Smoothing</SelectItem>
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
            
            <Button 
              onClick={generatePredictions}
              disabled={isGenerating || !targetColumn || !dateColumn}
              className="mb-6"
            >
              {isGenerating ? "Generating..." : "Generate Predictions"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
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
