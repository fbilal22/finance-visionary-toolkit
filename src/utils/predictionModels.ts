/**
 * Financial Time Series Prediction Models
 * This file contains various prediction models for financial time series data.
 */

// Linear regression prediction
export const linearRegressionModel = (data: any[], targetCol: string, daysToPredict: number) => {
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
export const movingAverageModel = (data: any[], targetCol: string, daysToPredict: number, windowSize = 5) => {
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
export const exponentialSmoothingModel = (data: any[], targetCol: string, daysToPredict: number, alpha = 0.3) => {
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

// Double Exponential Smoothing (Holt's method)
export const doubleExponentialSmoothingModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  const alpha = 0.3; // Level smoothing
  const beta = 0.2;  // Trend smoothing
  
  // Initialize level and trend
  let level = values[0];
  let trend = values[1] - values[0];
  
  // Apply double exponential smoothing
  for (let i = 1; i < values.length; i++) {
    const lastLevel = level;
    level = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
  }
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  
  for (let i = 1; i <= daysToPredict; i++) {
    const predictedValue = level + i * trend;
    
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

// ARIMA-like (Auto-Regressive Moving Average) - Simplified
export const arimaLikeModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  const p = 3; // AR order
  const order = p + 1;
  
  // If we don't have enough data points, fallback to exponential smoothing
  if (values.length < order) {
    return exponentialSmoothingModel(data, targetCol, daysToPredict);
  }
  
  // Get the last 'order' values
  const lastValues = values.slice(-order);
  
  // Calculate the AR coefficients (simplified)
  // This is a very simple approach - real ARIMA would use more sophisticated methods
  const diff = [];
  for (let i = 1; i < lastValues.length; i++) {
    diff.push(lastValues[i] - lastValues[i-1]);
  }
  
  const avgDiff = diff.reduce((sum, d) => sum + d, 0) / diff.length;
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  let lastValue = lastValues[lastValues.length - 1];
  
  for (let i = 1; i <= daysToPredict; i++) {
    const predictedValue = lastValue + avgDiff;
    lastValue = predictedValue; // For the next prediction
    
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

// Seasonal-Naive Forecasting (good for data with seasonality)
export const seasonalNaiveModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  
  // Assume weekly seasonality (7 days)
  const seasonLength = 7;
  
  // If we don't have enough data points, fallback to simple moving average
  if (values.length < seasonLength) {
    return movingAverageModel(data, targetCol, daysToPredict);
  }
  
  // Generate predictions based on the same day in the previous week
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  
  for (let i = 1; i <= daysToPredict; i++) {
    // Get the value from seasonLength days ago
    const seasonalIndex = values.length - seasonLength + ((i - 1) % seasonLength);
    const predictedValue = values[seasonalIndex];
    
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

// Mean Reversion (suitable for financial markets)
export const meanReversionModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  
  // Calculate long-term mean
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  
  // Estimate reversion speed (simplified)
  const reversionSpeed = 0.1; // This should ideally be estimated from the data
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  let currentValue = values[values.length - 1];
  
  for (let i = 1; i <= daysToPredict; i++) {
    // Mean reversion formula: next value moves towards mean by reversionSpeed
    const predictedValue = currentValue + reversionSpeed * (mean - currentValue);
    currentValue = predictedValue; // For the next prediction
    
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

// Random Forest-like Ensemble Model (simplified ML approach)
export const randomForestModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  
  // Create multiple "decision trees" (simplified as different moving averages)
  const shortTermMA = calculateMovingAverage(values, 3);
  const mediumTermMA = calculateMovingAverage(values, 7);
  const longTermMA = calculateMovingAverage(values, 14);
  const weightedMA = calculateWeightedMA(values, 5);
  
  // Generate predictions (ensemble of forecasts)
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  
  for (let i = 1; i <= daysToPredict; i++) {
    // Combine "trees" with weights to get final prediction
    const predictedValue = (
      shortTermMA * 0.3 + 
      mediumTermMA * 0.3 + 
      longTermMA * 0.2 + 
      weightedMA * 0.2
    );
    
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    
    predictions.push({
      date: nextDate.toISOString().split('T')[0],
      [targetCol]: parseFloat(predictedValue.toFixed(2)),
      isPrediction: true
    });
  }
  
  return predictions;
  
  // Helper functions for random forest
  function calculateMovingAverage(values: number[], window: number) {
    const lastWindow = values.slice(-window);
    return lastWindow.reduce((sum, val) => sum + val, 0) / window;
  }
  
  function calculateWeightedMA(values: number[], window: number) {
    const lastWindow = values.slice(-window);
    let weightSum = 0;
    let valueSum = 0;
    
    for (let i = 0; i < lastWindow.length; i++) {
      const weight = i + 1;
      weightSum += weight;
      valueSum += lastWindow[i] * weight;
    }
    
    return valueSum / weightSum;
  }
};

// Support Vector Regression (SVR) - simplified ML approach
export const svrModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  
  // Calculate key statistics that SVR would use
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );
  
  // Estimate trend direction and strength
  const recentValues = values.slice(-10);
  const firstHalf = recentValues.slice(0, 5);
  const secondHalf = recentValues.slice(-5);
  
  const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const trendStrength = secondHalfAvg - firstHalfAvg;
  const normalizedTrend = trendStrength / (stdDev || 1); // Avoid division by zero
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  const lastValue = values[values.length - 1];
  
  for (let i = 1; i <= daysToPredict; i++) {
    // SVR prediction formula (simplified)
    // More days out = less certain, so dampen the trend over time
    const dampingFactor = Math.exp(-0.1 * i);
    const predictedChange = normalizedTrend * stdDev * dampingFactor;
    const predictedValue = lastValue + (predictedChange * i);
    
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

// Long Short-Term Memory (LSTM) Neural Network - simplified DL approach
export const lstmModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  
  // LSTM would typically identify patterns with different lookback periods
  // This is a simplified version that tries to emulate that behavior
  
  // Calculate different lookback patterns
  const shortPattern = identifyPattern(values, 3);
  const mediumPattern = identifyPattern(values, 7);
  const longPattern = identifyPattern(values, 14);
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  let lastValue = values[values.length - 1];
  
  for (let i = 1; i <= daysToPredict; i++) {
    // Combine patterns with weights that simulate LSTM's ability
    // to balance short and long-term dependencies
    const shortWeight = Math.exp(-0.2 * i); // Decays faster
    const mediumWeight = Math.exp(-0.1 * i);
    const longWeight = Math.exp(-0.05 * i); // Decays slower
    
    const weightSum = shortWeight + mediumWeight + longWeight;
    
    const predictedChange = (
      (shortPattern * shortWeight) +
      (mediumPattern * mediumWeight) +
      (longPattern * longWeight)
    ) / weightSum;
    
    // Apply the predicted change
    const predictedValue = lastValue + predictedChange;
    lastValue = predictedValue; // For next prediction
    
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    
    predictions.push({
      date: nextDate.toISOString().split('T')[0],
      [targetCol]: parseFloat(predictedValue.toFixed(2)),
      isPrediction: true
    });
  }
  
  return predictions;
  
  // Helper function to identify patterns
  function identifyPattern(values: number[], lookback: number) {
    if (values.length < lookback * 2) {
      return 0; // Not enough data
    }
    
    // Calculate average changes in each lookback period
    const changes = [];
    for (let i = lookback; i < values.length; i++) {
      const change = values[i] - values[i - lookback];
      changes.push(change / lookback); // Normalize by period length
    }
    
    // Average pattern strength
    return changes.reduce((sum, val) => sum + val, 0) / changes.length;
  }
};

// Transformer Neural Network - simplified DL approach 
export const transformerModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  
  // Transformer models use attention mechanisms to weigh different time periods
  // Here we'll simulate this with weighted combinations of historical patterns
  
  // Get the latest value
  const lastValue = values[values.length - 1];
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  
  // Transformer would analyze multiple time scales and how they interact
  // We'll simulate this by calculating multiple indicators with different weights
  
  for (let i = 1; i <= daysToPredict; i++) {
    // 1. Recent trend (last 5 days)
    const recentValues = values.slice(-5);
    const recentTrend = calculateTrend(recentValues);
    
    // 2. Medium-term trend (last 10 days)
    const mediumValues = values.slice(-10);
    const mediumTrend = calculateTrend(mediumValues);
    
    // 3. Long-term trend (last 20 days)
    const longValues = values.slice(-20);
    const longTrend = calculateTrend(longValues);
    
    // 4. Volatility (standard deviation)
    const volatility = calculateVolatility(values.slice(-20));
    
    // 5. Cyclical patterns (if any)
    const cycleFactor = detectCycles(values);
    
    // Combine all factors with attention-like weights
    // The weights would depend on how "important" each factor seems for prediction
    // As we go further in prediction, uncertainty increases, so we reduce weight of short-term factors
    
    const dayFactor = Math.min(i / daysToPredict, 1); // Goes from 0 to 1
    
    const recentWeight = Math.max(0.5 - dayFactor * 0.4, 0.1); // Decreases with time
    const mediumWeight = 0.3;
    const longWeight = 0.1 + dayFactor * 0.2; // Increases with time
    const volatilityWeight = 0.1;
    const cycleWeight = 0.1 + dayFactor * 0.1; // Increases with time
    
    // Calculate predicted change
    const predictedChange = (
      recentTrend * recentWeight +
      mediumTrend * mediumWeight +
      longTrend * longWeight
    ) * (1 + cycleFactor * cycleWeight);
    
    // Apply volatility dampening for further-out predictions
    const uncertaintyFactor = 1 - Math.min(dayFactor * volatility * volatilityWeight, 0.5);
    
    // Calculate prediction
    const predictedValue = lastValue + (predictedChange * i * uncertaintyFactor);
    
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    
    predictions.push({
      date: nextDate.toISOString().split('T')[0],
      [targetCol]: parseFloat(predictedValue.toFixed(2)),
      isPrediction: true
    });
  }
  
  return predictions;
  
  // Helper functions
  function calculateTrend(values: number[]) {
    if (values.length < 2) return 0;
    
    // Simple linear regression slope
    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope || 0; // Avoid NaN
  }
  
  function calculateVolatility(values: number[]) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }
  
  function detectCycles(values: number[]) {
    if (values.length < 10) return 0;
    
    // Simple autocorrelation with lag 7 (weekly pattern)
    // In a real transformer, this would be learned from data
    const lag = Math.min(7, Math.floor(values.length / 3));
    let correlation = 0;
    
    for (let i = lag; i < values.length; i++) {
      correlation += (values[i] - values[i - lag]) * (values[i - 1] - values[i - lag - 1]);
    }
    
    return Math.tanh(correlation / values.length); // Normalize between -1 and 1
  }
};

/**
 * Model Evaluation Utilities
 * These functions help evaluate the performance of prediction models
 */

// Calculate Mean Absolute Error (MAE)
export const calculateMAE = (actual: number[], predicted: number[]): number => {
  if (actual.length !== predicted.length || actual.length === 0) {
    return 0;
  }
  
  const sum = actual.reduce((acc, val, i) => acc + Math.abs(val - predicted[i]), 0);
  return sum / actual.length;
};

// Calculate Mean Squared Error (MSE)
export const calculateMSE = (actual: number[], predicted: number[]): number => {
  if (actual.length !== predicted.length || actual.length === 0) {
    return 0;
  }
  
  const sum = actual.reduce((acc, val, i) => acc + Math.pow(val - predicted[i], 2), 0);
  return sum / actual.length;
};

// Calculate Root Mean Squared Error (RMSE)
export const calculateRMSE = (actual: number[], predicted: number[]): number => {
  return Math.sqrt(calculateMSE(actual, predicted));
};

// Calculate Mean Absolute Percentage Error (MAPE)
export const calculateMAPE = (actual: number[], predicted: number[]): number => {
  if (actual.length !== predicted.length || actual.length === 0) {
    return 0;
  }
  
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }
  
  return count > 0 ? (sum / count) * 100 : 0;
};

// Calculate R-squared (Coefficient of Determination)
export const calculateR2 = (actual: number[], predicted: number[]): number => {
  if (actual.length !== predicted.length || actual.length === 0) {
    return 0;
  }
  
  const meanActual = actual.reduce((sum, val) => sum + val, 0) / actual.length;
  
  const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
  const ssResidual = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
  
  return ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
};

// Calculate Directional Accuracy (DA) - percentage of correctly predicted directions
export const calculateDirectionalAccuracy = (actual: number[], predicted: number[]): number => {
  if (actual.length <= 1 || predicted.length <= 1 || actual.length !== predicted.length) {
    return 0;
  }
  
  let correctDirections = 0;
  
  for (let i = 1; i < actual.length; i++) {
    const actualDirection = actual[i] - actual[i-1];
    const predictedDirection = predicted[i] - predicted[i-1];
    
    if ((actualDirection >= 0 && predictedDirection >= 0) || 
        (actualDirection < 0 && predictedDirection < 0)) {
      correctDirections++;
    }
  }
  
  return (correctDirections / (actual.length - 1)) * 100;
};

// Generate backtesting results for model evaluation
export const generateBacktestResults = (data: any[], targetCol: string, modelFn: Function, testWindowSize: number = 7) => {
  if (data.length < testWindowSize * 2) {
    return {
      mae: 0,
      mse: 0,
      rmse: 0,
      mape: 0,
      r2: 0,
      directionalAccuracy: 0,
      predictedValues: [],
      actualValues: []
    };
  }
  
  // Split data into training and test sets
  const trainingData = data.slice(0, data.length - testWindowSize);
  const testData = data.slice(data.length - testWindowSize);
  
  // Generate predictions using the model
  const predictions = modelFn(trainingData, targetCol, testWindowSize);
  
  // Extract actual and predicted values
  const actualValues = testData.map(item => item[targetCol]);
  const predictedValues = predictions.map(item => item[targetCol]);
  
  // Calculate evaluation metrics
  const mae = calculateMAE(actualValues, predictedValues);
  const mse = calculateMSE(actualValues, predictedValues);
  const rmse = calculateRMSE(actualValues, predictedValues);
  const mape = calculateMAPE(actualValues, predictedValues);
  const r2 = calculateR2(actualValues, predictedValues);
  const directionalAccuracy = calculateDirectionalAccuracy(actualValues, predictedValues);
  
  return {
    mae,
    mse,
    rmse,
    mape,
    r2,
    directionalAccuracy,
    predictedValues,
    actualValues
  };
};

// Get an overall model score (0-100) based on multiple metrics
export const calculateModelScore = (metrics: { 
  mae: number, 
  rmse: number, 
  mape: number, 
  r2: number, 
  directionalAccuracy: number 
}): number => {
  // Define weights for each metric
  const weights = {
    mape: 0.25,      // Lower is better
    r2: 0.25,        // Higher is better
    directionalAccuracy: 0.5  // Higher is better
  };
  
  // Calculate normalized scores (0-100)
  const mapeScore = Math.max(0, 100 - metrics.mape);
  const r2Score = Math.max(0, metrics.r2 * 100);
  const daScore = metrics.directionalAccuracy;
  
  // Calculate weighted score
  const weightedScore = 
    mapeScore * weights.mape +
    r2Score * weights.r2 +
    daScore * weights.directionalAccuracy;
  
  return Math.round(weightedScore);
};
