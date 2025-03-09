
import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { AlertCircle, LineChart, ArrowRight, BarChart2 } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
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
  meanReversionModel,
  randomForestModel,
  svrModel,
  lstmModel,
  transformerModel,
  prophetModel,
  xgboostModel,
  autoARIMAModel,
  bstsModel,
  gamModel,
  generateBacktestResults,
  calculateModelScore
} from '@/utils/predictionModels';

type PredictionMethod = 
  | 'linear' 
  | 'movingAverage' 
  | 'exponential' 
  | 'doubleExponential'
  | 'arima'
  | 'seasonal'
  | 'meanReversion'
  | 'randomForest'
  | 'svr'
  | 'lstm'
  | 'transformer'
  | 'prophet'
  | 'xgboost'
  | 'autoARIMA'
  | 'bsts'
  | 'gam';

const predictionMethods = [
  { id: 'linear', name: 'Linear Regression', description: 'Fits a straight line to historical data.', category: 'traditional' },
  { id: 'movingAverage', name: 'Moving Average', description: 'Uses the average of recent periods to predict future values.', category: 'traditional' },
  { id: 'exponential', name: 'Exponential Smoothing', description: 'Weights recent observations more heavily than older ones.', category: 'traditional' },
  { id: 'doubleExponential', name: 'Double Exponential', description: 'Handles data with trends using two smoothing equations.', category: 'traditional' },
  { id: 'arima', name: 'ARIMA-like', description: 'Simplified version of Auto-Regressive Integrated Moving Average.', category: 'traditional' },
  { id: 'autoARIMA', name: 'Auto ARIMA', description: 'Automatically selects optimal ARIMA parameters based on data patterns.', category: 'traditional' },
  { id: 'seasonal', name: 'Seasonal Naive', description: 'Assumes future values follow seasonal patterns from the past.', category: 'traditional' },
  { id: 'meanReversion', name: 'Mean Reversion', description: 'Assumes prices tend to return to their historical average.', category: 'traditional' },
  { id: 'randomForest', name: 'Random Forest', description: 'Ensemble learning method that builds multiple decision trees for prediction.', category: 'ml' },
  { id: 'svr', name: 'Support Vector Regression', description: 'Uses support vectors to find an optimal regression line.', category: 'ml' },
  { id: 'xgboost', name: 'XGBoost', description: 'Gradient boosting algorithm that combines multiple weak models into a strong predictor.', category: 'ml' },
  { id: 'prophet', name: 'Prophet', description: 'Decomposable model to handle seasonality, holidays, and trend changes.', category: 'ml' },
  { id: 'gam', name: 'GAM', description: 'Generalized Additive Model that combines multiple non-linear effects.', category: 'ml' },
  { id: 'bsts', name: 'BSTS', description: 'Bayesian Structural Time Series with uncertainty quantification.', category: 'ml' },
  { id: 'lstm', name: 'LSTM Neural Network', description: 'Deep learning model that captures long-term dependencies in time series.', category: 'dl' },
  { id: 'transformer', name: 'Transformer Network', description: 'Advanced deep learning model using attention mechanisms.', category: 'dl' },
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
  const [modelEvaluations, setModelEvaluations] = useState<Record<string, any>>({});
  const [backtestWindowSize, setBacktestWindowSize] = useState<number>(7);

  // Data splitting settings
  const [trainTestSplit, setTrainTestSplit] = useState<number>(80);
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [testingData, setTestingData] = useState<any[]>([]);
  const [selectedPredictionPoint, setSelectedPredictionPoint] = useState<number | null>(null);
  
  useEffect(() => {
    if (!isLoading && !dataset) {
      navigate('/');
    } else if (dataset) {
      const { meta } = dataset;
      const dateCol = meta.columnNames.find(col => meta.columnTypes[col] === 'date');
      if (dateCol) setDateColumn(dateCol);
      
      const numericCols = meta.columnNames.filter(col => meta.columnTypes[col] === 'numeric');
      if (numericCols.length > 0) setTargetColumn(numericCols[0]);
      
      // Split data when dataset changes
      splitData(dataset.data, trainTestSplit);
    }
  }, [dataset, isLoading, navigate]);

  // Effect to split data when trainTestSplit changes
  useEffect(() => {
    if (dataset) {
      splitData(dataset.data, trainTestSplit);
    }
  }, [trainTestSplit, dataset]);

  // Function to split the data into training and testing sets
  const splitData = (data: any[], splitRatio: number) => {
    if (!data || data.length === 0) return;
    
    const splitIndex = Math.floor(data.length * (splitRatio / 100));
    const training = data.slice(0, splitIndex);
    const testing = data.slice(splitIndex);
    
    setTrainingData(training);
    setTestingData(testing);
    
    // Default the selected prediction point to the start of the test set
    if (selectedPredictionPoint === null) {
      setSelectedPredictionPoint(splitIndex);
    }
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

    if (!selectedPredictionPoint) {
      toast({
        title: "Error",
        description: "Please select a prediction starting point",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Use training data up to the selected prediction point
      const dataForPrediction = dataset.data.slice(0, selectedPredictionPoint);
      
      let predictedData;
      
      switch (predictionMethod) {
        case 'linear':
          predictedData = linearRegressionModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'movingAverage':
          predictedData = movingAverageModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'exponential':
          predictedData = exponentialSmoothingModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'doubleExponential':
          predictedData = doubleExponentialSmoothingModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'arima':
          predictedData = arimaLikeModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'autoARIMA':
          predictedData = autoARIMAModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'seasonal':
          predictedData = seasonalNaiveModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'meanReversion':
          predictedData = meanReversionModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'randomForest':
          predictedData = randomForestModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'svr':
          predictedData = svrModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'lstm':
          predictedData = lstmModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'transformer':
          predictedData = transformerModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'prophet':
          predictedData = prophetModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'xgboost':
          predictedData = xgboostModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'bsts':
          predictedData = bstsModel(dataForPrediction, targetColumn, predictionDays);
          break;
        case 'gam':
          predictedData = gamModel(dataForPrediction, targetColumn, predictionDays);
          break;
      }
      
      // Combine historical data and predictions for visualization
      const combinedData = [...dataset.data, ...predictedData];
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

    if (!selectedPredictionPoint) {
      toast({
        title: "Error",
        description: "Please select a prediction starting point",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Use training data for model evaluation
      const dataForEvaluation = dataset.data.slice(0, selectedPredictionPoint);
      const comparisonResults: Record<string, any[]> = {};
      const evaluationResults: Record<string, any> = {};
      
      predictionMethods.forEach(method => {
        let modelFn;
        
        switch (method.id) {
          case 'linear':
            modelFn = linearRegressionModel;
            break;
          case 'movingAverage':
            modelFn = movingAverageModel;
            break;
          case 'exponential':
            modelFn = exponentialSmoothingModel;
            break;
          case 'doubleExponential':
            modelFn = doubleExponentialSmoothingModel;
            break;
          case 'arima':
            modelFn = arimaLikeModel;
            break;
          case 'autoARIMA':
            modelFn = autoARIMAModel;
            break; 
          case 'seasonal':
            modelFn = seasonalNaiveModel;
            break;
          case 'meanReversion':
            modelFn = meanReversionModel;
            break;
          case 'randomForest':
            modelFn = randomForestModel;
            break;
          case 'svr':
            modelFn = svrModel;
            break;
          case 'lstm':
            modelFn = lstmModel;
            break;
          case 'transformer':
            modelFn = transformerModel;
            break;
          case 'prophet':
            modelFn = prophetModel;
            break;
          case 'xgboost':
            modelFn = xgboostModel;
            break;
          case 'bsts':
            modelFn = bstsModel;
            break;
          case 'gam':
            modelFn = gamModel;
            break;
        }
        
        const predictedData = modelFn(dataForEvaluation, targetColumn, predictionDays);
        comparisonResults[method.id] = predictedData;
        
        const evaluation = generateBacktestResults(dataForEvaluation, targetColumn, modelFn, backtestWindowSize);
        const modelScore = calculateModelScore(evaluation);
        
        evaluationResults[method.id] = {
          ...evaluation,
          score: modelScore
        };
      });
      
      setModelComparison(comparisonResults);
      setModelEvaluations(evaluationResults);
      setActiveTab('evaluation');
      
      toast({
        title: "Model Evaluation Complete",
        description: `Compared all prediction models with ${backtestWindowSize}-day backtest window.`,
      });
    } catch (error) {
      console.error("Error generating model comparison:", error);
      toast({
        title: "Error",
        description: "Failed to generate model evaluation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Find the index position based on a date
  const findDataPointIndex = (date: string) => {
    if (!dataset?.data) return 0;
    return dataset.data.findIndex(d => d.date === date);
  };

  // Handle prediction point selection
  const handlePredictionPointChange = (date: string) => {
    const index = findDataPointIndex(date);
    if (index >= 0) {
      setSelectedPredictionPoint(index);
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
  
  const numericColumns = meta.columnNames.filter(col => 
    meta.columnTypes[col] === 'numeric'
  );

  const formatValue = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPercentage = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + '%';
  };

  // Prepare data for visualization
  const prepareDataVisualization = () => {
    if (!dataset?.data || dataset.data.length === 0) return [];
    
    return dataset.data.map((dataPoint, index) => ({
      ...dataPoint,
      isTraining: index < (dataset.data.length * (trainTestSplit / 100)),
      isTesting: index >= (dataset.data.length * (trainTestSplit / 100)),
      isPredictionPoint: selectedPredictionPoint !== null && index === selectedPredictionPoint
    }));
  };

  const prepareComparisonData = () => {
    if (Object.keys(modelComparison).length === 0) return [];
    
    const result = [];
    
    for (let i = 0; i < predictionDays; i++) {
      const dayData: Record<string, any> = {
        day: i + 1,
        date: Object.values(modelComparison)[0][i]?.date || `Day ${i + 1}`
      };
      
      Object.entries(modelComparison).forEach(([modelId, predictions]) => {
        const predictionValue = predictions[i]?.[targetColumn];
        dayData[modelId] = predictionValue;
      });
      
      result.push(dayData);
    }
    
    return result;
  };

  const prepareEvaluationData = () => {
    return Object.entries(modelEvaluations).map(([modelId, evaluation]) => {
      const methodInfo = predictionMethods.find(m => m.id === modelId) || { name: modelId, category: 'unknown' };
      
      return {
        id: modelId,
        name: methodInfo.name,
        category: methodInfo.category,
        mae: evaluation.mae,
        rmse: evaluation.rmse,
        mape: evaluation.mape,
        r2: evaluation.r2,
        directionalAccuracy: evaluation.directionalAccuracy,
        score: evaluation.score
      };
    }).sort((a, b) => b.score - a.score);
  };

  const prepareRadarData = () => {
    const evaluationData = prepareEvaluationData();
    
    const topModels = evaluationData.slice(0, 5);
    
    return [
      {
        metric: "Accuracy",
        fullMark: 100,
        ...topModels.reduce((acc, model) => {
          acc[model.id] = model.directionalAccuracy;
          return acc;
        }, {})
      },
      {
        metric: "Fit (R²)",
        fullMark: 100,
        ...topModels.reduce((acc, model) => {
          acc[model.id] = Math.max(0, model.r2 * 100);
          return acc;
        }, {})
      },
      {
        metric: "Error (MAPE)",
        fullMark: 100,
        ...topModels.reduce((acc, model) => {
          // Invert MAPE because lower is better
          acc[model.id] = Math.max(0, 100 - model.mape);
          return acc;
        }, {})
      },
      {
        metric: "Consistency",
        fullMark: 100,
        ...topModels.reduce((acc, model) => {
          // Calculate consistency score based on MAE/RMSE ratio
          const consistency = model.mae > 0 ? Math.min(100, (model.mae / model.rmse) * 100) : 0;
          acc[model.id] = consistency;
          return acc;
        }, {})
      },
      {
        metric: "Overall Score",
        fullMark: 100,
        ...topModels.reduce((acc, model) => {
          acc[model.id] = model.score;
          return acc;
        }, {})
      }
    ];
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Prediction</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Split Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-1 block">Training/Testing Split Ratio</label>
                  <div className="flex items-center gap-4">
                    <Slider 
                      value={[trainTestSplit]} 
                      onValueChange={(values) => setTrainTestSplit(values[0])}
                      min={50}
                      max={95}
                      step={5}
                      className="flex-1"
                    />
                    <span className="w-16 text-sm font-medium">{trainTestSplit}% / {100-trainTestSplit}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {trainingData.length} samples for training, {testingData.length} samples for testing
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="text-sm font-medium mb-1 block">Prediction Starting Point</label>
                  <Select
                    value={selectedPredictionPoint !== null ? dataset.data[selectedPredictionPoint]?.date : ''}
                    onValueChange={handlePredictionPointChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a starting point for prediction" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {dataset.data.map((dataPoint, index) => (
                        <SelectItem 
                          key={index} 
                          value={dataPoint.date}
                          disabled={index < Math.floor(dataset.data.length * 0.5)} // Disable first half of data
                        >
                          {dataPoint.date} {index === Math.floor(dataset.data.length * (trainTestSplit / 100)) ? '(Train/Test Split)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a point in the dataset where prediction should start
                  </p>
                </div>
              </div>
              
              <div className="bg-finance-chart-bg rounded-lg p-4 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart 
                    data={prepareDataVisualization()} 
                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey={dateColumn} 
                      tick={false}
                    />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(26, 33, 48, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                      formatter={(value: number) => [formatValue(value), targetColumn]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={targetColumn}
                      stroke="#3B82F6" 
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        // Highlight the prediction point with a different marker
                        if (payload.isPredictionPoint) {
                          return (
                            <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="#EF4444" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="8" />
                            </svg>
                          );
                        }
                        // No dots for regular points
                        return null;
                      }}
                    />
                    {/* Line for Training Data */}
                    <Line 
                      type="monotone" 
                      dataKey={(dataPoint) => dataPoint.isTraining ? dataPoint[targetColumn] : null}
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={false}
                      name="Training Data"
                      connectNulls={true}
                    />
                    {/* Line for Testing Data */}
                    <Line 
                      type="monotone" 
                      dataKey={(dataPoint) => dataPoint.isTesting ? dataPoint[targetColumn] : null}
                      stroke="#F97316" 
                      strokeWidth={3}
                      dot={false}
                      name="Testing Data"
                      connectNulls={true}
                    />
                    <Legend />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
        
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
                    <div className="px-2 py-1.5 text-sm font-semibold">Traditional Models</div>
                    {predictionMethods
                      .filter(method => method.category === 'traditional')
                      .map(method => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))
                    }
                    
                    <div className="px-2 py-1.5 text-sm font-semibold mt-2">Machine Learning Models</div>
                    {predictionMethods
                      .filter(method => method.category === 'ml')
                      .map(method => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))
                    }
                    
                    <div className="px-2 py-1.5 text-sm font-semibold mt-2">Deep Learning Models</div>
                    {predictionMethods
                      .filter(method => method.category === 'dl')
                      .map(method => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))
                    }
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
              
              <div>
                <label className="text-sm font-medium mb-1 block">Backtest Window (days)</label>
                <Input
                  type="number"
                  value={backtestWindowSize}
                  onChange={(e) => setBacktestWindowSize(parseInt(e.target.value) || 7)}
                  min={1}
                  max={30}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button 
                onClick={generatePredictions}
                disabled={isGenerating || !targetColumn || !dateColumn || selectedPredictionPoint === null}
              >
                {isGenerating ? "Generating..." : "Generate Predictions"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={compareAllModels}
                disabled={isGenerating || !targetColumn || !dateColumn || selectedPredictionPoint === null}
              >
                Compare & Evaluate Models
                <BarChart2 className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {(predictions.length > 0 || Object.keys(modelComparison).length > 0 || Object.keys(modelEvaluations).length > 0) && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chart">Prediction Chart</TabsTrigger>
                  <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
                  <TabsTrigger value="evaluation">Model Evaluation</TabsTrigger>
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
                            <div className="text-xs text-muted-foreground mt-1 mb-2">
                              {method.category === 'traditional' && 'Traditional statistical model'}
                              {method.category === 'ml' && 'Machine learning model'}
                              {method.category === 'dl' && 'Deep learning model'}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2 self-start"
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
                
                <TabsContent value="evaluation" className="mt-4">
                  {Object.keys(modelEvaluations).length > 0 && (
                    <>
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="text-lg">Model Performance Scores</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-lg bg-finance-chart-bg p-4 mb-6">
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart
                                data={prepareEvaluationData()}
                                margin={{ top: 10, right: 30, left: 0, bottom: 80 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis 
                                  dataKey="name" 
                                  angle={-45} 
                                  textAnchor="end" 
                                  height={80} 
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                  label={{ value: 'Score (higher is better)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                                  domain={[0, 100]}
                                />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: 'rgba(26, 33, 48, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                                />
                                <Bar 
                                  dataKey="score" 
                                  fill="#8B5CF6" 
                                  name="Model Score" 
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Evaluation Metrics</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="border rounded-lg overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Model</TableHead>
                                    <TableHead>MAPE</TableHead>
                                    <TableHead>R²</TableHead>
                                    <TableHead>Dir. Accuracy</TableHead>
                                    <TableHead>Score</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {prepareEvaluationData().map((model) => (
                                    <TableRow key={model.id}>
                                      <TableCell className="font-medium">{model.name}</TableCell>
                                      <TableCell>{formatPercentage(model.mape)}</TableCell>
                                      <TableCell>{formatValue(model.r2)}</TableCell>
                                      <TableCell>{formatPercentage(model.directionalAccuracy)}</TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold">{model.score}</span>
                                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full ${
                                                model.score >= 80 ? 'bg-green-500' : 
                                                model.score >= 60 ? 'bg-yellow-500' : 
                                                model.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                              }`}
                                              style={{ width: `${model.score}%` }}
                                            />
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Model Performance Comparison</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-lg bg-finance-chart-bg p-4">
                              <ResponsiveContainer width="100%" height={300}>
                                <RadarChart outerRadius={90} data={prepareRadarData()}>
                                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                  <PolarAngleAxis dataKey="metric" />
                                  <PolarRadiusAxis domain={[0, 100]} />
                                  {prepareEvaluationData().slice(0, 5).map((model, index) => {
                                    const colors = ['#8B5CF6', '#D946EF', '#F97316', '#0EA5E9', '#10B981'];
                                    return (
                                      <Radar
                                        key={model.id}
                                        name={model.name}
                                        dataKey={model.id}
                                        stroke={colors[index % colors.length]}
                                        fill={colors[index % colors.length]}
                                        fillOpacity={0.2}
                                      />
                                    );
                                  })}
                                  <Legend />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(26, 33, 48, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                                  />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Evaluation Criteria Explained</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-2">Mean Absolute Percentage Error (MAPE)</h4>
                              <p className="text-sm text-muted-foreground">
                                Measures the percentage difference between predicted and actual values. Lower values indicate better performance.
                              </p>
                            </div>
                            
                            <div className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-2">R-squared (R²)</h4>
                              <p className="text-sm text-muted-foreground">
                                Measures how well the model fits the data. Values closer to 1 indicate better fit.
                              </p>
                            </div>
                            
                            <div className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-2">Directional Accuracy</h4>
                              <p className="text-sm text-muted-foreground">
                                Percentage of correctly predicted price movements (up or down). Higher values indicate better trend prediction.
                              </p>
                            </div>
                            
                            <div className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-2">Model Score</h4>
                              <p className="text-sm text-muted-foreground">
                                Overall performance score (0-100) calculated from MAPE, R², and directional accuracy. Higher values indicate better overall performance.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {predictionMethods.map(method => (
                          <div key={method.id} className="border rounded-lg p-4 flex flex-col h-full">
                            <h3 className="font-medium text-lg mb-2">{method.name}</h3>
                            <p className="text-sm text-muted-foreground mb-auto">{method.description}</p>
                            <div className="text-xs text-muted-foreground mt-1 mb-2">
                              {method.category === 'traditional' && 'Traditional statistical model'}
                              {method.category === 'ml' && 'Machine learning model'}
                              {method.category === 'dl' && 'Deep learning model'}
                            </div>
                            {modelEvaluations[method.id] && (
                              <div className="mt-1 mb-2 flex items-center gap-2">
                                <span className="text-sm font-medium">Score:</span>
                                <span className={`text-sm font-bold ${
                                  modelEvaluations[method.id].score >= 80 ? 'text-green-500' : 
                                  modelEvaluations[method.id].score >= 60 ? 'text-yellow-500' : 
                                  modelEvaluations[method.id].score >= 40 ? 'text-orange-500' : 'text-red-500'
                                }`}>
                                  {modelEvaluations[method.id].score}
                                </span>
                              </div>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2 self-start"
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
