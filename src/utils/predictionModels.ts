
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
