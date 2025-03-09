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

// Facebook Prophet-like model (simplified implementation)
export const prophetModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  
  // Prophet decomposes time series into trend, seasonality, and holiday components
  // This is a simplified version focusing on trend and seasonality
  
  // 1. Detect trend using linear regression
  const xValues = Array.from({ length: data.length }, (_, i) => i);
  const n = xValues.length;
  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = values.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // 2. Detect weekly seasonality
  const weeklyPattern = detectWeeklyPattern(data, targetCol);
  
  // 3. Detect monthly seasonality (simplified)
  const monthlyFactor = detectMonthlyPattern(data, targetCol);
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  
  for (let i = 1; i <= daysToPredict; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    
    // Trend component
    const trendPrediction = intercept + slope * (n + i - 1);
    
    // Seasonal components
    const dayOfWeek = nextDate.getDay();
    const dayOfMonth = nextDate.getDate();
    
    const weeklySeasonal = weeklyPattern[dayOfWeek] || 0;
    const monthlySeasonal = monthlyFactor * (dayOfMonth / 30);
    
    // Combine components (trend + seasonality)
    const predictedValue = trendPrediction + weeklySeasonal + monthlySeasonal;
    
    predictions.push({
      date: nextDate.toISOString().split('T')[0],
      [targetCol]: parseFloat(predictedValue.toFixed(2)),
      isPrediction: true
    });
  }
  
  return predictions;
  
  // Helper functions for seasonal detection
  function detectWeeklyPattern(data: any[], col: string) {
    const weekdayAvgs = Array(7).fill(0);
    const weekdayCounts = Array(7).fill(0);
    
    // Calculate average for each day of week
    data.forEach(item => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      weekdayAvgs[dayOfWeek] += item[col];
      weekdayCounts[dayOfWeek]++;
    });
    
    // Normalize by counts and calculate deviations from overall mean
    const overallMean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return weekdayAvgs.map((sum, i) => {
      return weekdayCounts[i] > 0 ? (sum / weekdayCounts[i]) - overallMean : 0;
    });
  }
  
  function detectMonthlyPattern(data: any[], col: string) {
    if (data.length < 60) return 0; // Need sufficient data for monthly patterns
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, item) => sum + item[col], 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item[col], 0) / secondHalf.length;
    
    // Detect if there's a strong monthly effect
    return Math.abs(secondAvg - firstAvg) > 0.1 * Math.abs(firstAvg) ? 
      (secondAvg - firstAvg) / 10 : 0;
  }
};

// XGBoost-like model (simplified implementation)
export const xgboostModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  
  // XGBoost is an ensemble of decision trees that improves through gradient boosting
  // This simplified version emulates XGBoost's behavior with boosted decision stumps
  
  // Create 5 "weak learners" with different lookback periods
  const weakLearners = [3, 5, 7, 14, 21].map(window => {
    return {
      window,
      // Each learner's weight is proportional to how "accurate" we consider it
      weight: Math.exp(-0.1 * window), // Give more weight to more recent periods
      predict: (idx: number) => {
        if (idx < window) return values[0]; // Fallback for early predictions
        
        // Calculate average change over this window
        const recentValues = values.slice(idx - window, idx);
        const avgChange = recentValues.reduce((sum, val, i, arr) => {
          return i > 0 ? sum + (val - arr[i-1]) : sum;
        }, 0) / (window - 1);
        
        // Return prediction based on last value + average change
        return values[idx - 1] + avgChange;
      }
    };
  });
  
  // Use boosting: train "residuals" for each learner sequentially
  const residuals = [...values];
  const learnerOutputs: number[][] = [];
  
  // Train each weak learner on residuals
  weakLearners.forEach(learner => {
    const outputs = [];
    
    for (let i = 0; i < values.length; i++) {
      const prediction = learner.predict(i);
      outputs.push(prediction);
      
      // Update residuals for next learner (if not the last one)
      if (learnerOutputs.length < weakLearners.length - 1) {
        residuals[i] -= prediction * learner.weight;
      }
    }
    
    learnerOutputs.push(outputs);
  });
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  let lastValue = values[values.length - 1];
  
  for (let i = 1; i <= daysToPredict; i++) {
    // Calculate prediction as weighted sum of weak learners
    let predictedValue = 0;
    let weightSum = 0;
    
    weakLearners.forEach((learner, idx) => {
      // For prediction, we're predicting future values based on learned patterns
      const learnerPrediction = learnerOutputs[idx][values.length - 1] * 
        (1 + (Math.random() * 0.02 - 0.01) * i); // Add slight randomness for longer horizons
      
      predictedValue += learnerPrediction * learner.weight;
      weightSum += learner.weight;
    });
    
    // Normalize by weight sum and adjust based on last known value
    predictedValue = lastValue + (predictedValue / weightSum - lastValue) * 0.2 * i;
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
};

// Auto ARIMA model (simplified implementation)
export const autoARIMAModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  
  // Auto ARIMA would automatically select appropriate p, d, q parameters
  // This simplified version examines the data characteristics to select basic ARIMA params
  
  // Check if differencing is needed (non-stationarity)
  const needsDifferencing = checkDifferencing(values);
  
  // Select AR and MA orders based on autocorrelation (simplified)
  const { arOrder, maOrder } = selectOrders(values, needsDifferencing);
  
  // Apply the selected model
  return arimaModel(data, targetCol, daysToPredict, arOrder, needsDifferencing ? 1 : 0, maOrder);
  
  // Helper functions
  function checkDifferencing(timeSeries: number[]) {
    // Check for trend using correlation with time
    const n = timeSeries.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    
    // Calculate correlation coefficient
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = timeSeries.reduce((sum, y) => sum + y, 0) / n;
    
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = xValues[i] - xMean;
      const yDiff = timeSeries[i] - yMean;
      
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }
    
    const correlation = numerator / Math.sqrt(xDenominator * yDenominator);
    
    // If strong correlation with time, differencing is needed
    return Math.abs(correlation) > 0.3;
  }
  
  function selectOrders(timeSeries: number[], differenced: boolean) {
    // In a real Auto ARIMA, we'd examine autocorrelation and partial autocorrelation functions
    // This is a simplified approach that just checks recent lags
    
    const workingSeries = differenced ? 
      timeSeries.slice(1).map((val, i) => val - timeSeries[i]) : 
      [...values];
    
    // Check correlation with different lags
    const correlations = [];
    
    for (let lag = 1; lag <= Math.min(5, Math.floor(workingSeries.length / 3)); lag++) {
      const laggedSeries = workingSeries.slice(lag);
      const mainSeries = workingSeries.slice(0, workingSeries.length - lag);
      
      // Calculate correlation
      const n = laggedSeries.length;
      const laggedMean = laggedSeries.reduce((sum, val) => sum + val, 0) / n;
      const mainMean = mainSeries.reduce((sum, val) => sum + val, 0) / n;
      
      let numerator = 0;
      let laggedDenominator = 0;
      let mainDenominator = 0;
      
      for (let j = 0; j < n; j++) {
        const laggedDiff = laggedSeries[j] - laggedMean;
        const mainDiff = mainSeries[j] - mainMean;
        
        numerator += laggedDiff * mainDiff;
        laggedDenominator += laggedDiff * laggedDiff;
        mainDenominator += mainDiff * mainDiff;
      }
      
      const correlation = numerator / Math.sqrt(laggedDenominator * mainDenominator);
      correlations.push(Math.abs(correlation));
    }
    
    // Find strongest correlations
    let arOrder = 1;
    let maOrder = 0;
    
    // Select AR order based on highest correlation
    const maxCorrelationIndex = correlations.indexOf(Math.max(...correlations));
    if (maxCorrelationIndex >= 0) {
      arOrder = maxCorrelationIndex + 1;
    }
    
    // For simplicity, keep MA order low
    maOrder = Math.max(1, arOrder - 1);
    
    return { arOrder, maOrder };
  }
  
  function arimaModel(data: any[], targetCol: string, daysToPredict: number, p: number, d: number, q: number) {
    const values = data.map(item => item[targetCol]);
    
    // Apply differencing if needed
    const workingSeries = d > 0 ? 
      values.slice(d).map((val, i) => val - values[i]) : 
      [...values];
    
    // AR coefficients (simplified estimation)
    const arCoeffs = estimateARCoefficients(workingSeries, p);
    
    // MA coefficients (simplified estimation)
    const maCoeffs = estimateMACoefficients(workingSeries, arCoeffs, q);
    
    // Generate predictions
    const predictions = [];
    const lastDate = new Date(data[data.length - 1].date);
    
    // For forecasting, we need the last p values and last q errors
    const lastValues = values.slice(-p);
    
    // Calculate last q errors
    const errors = [];
    for (let i = p; i < values.length; i++) {
      let arPrediction = 0;
      for (let j = 0; j < p; j++) {
        arPrediction += arCoeffs[j] * values[i - j - 1];
      }
      
      let maPrediction = 0;
      for (let j = 0; j < Math.min(q, errors.length); j++) {
        maPrediction += maCoeffs[j] * errors[j];
      }
      
      const prediction = arPrediction + maPrediction;
      const error = values[i] - prediction;
      errors.unshift(error);
      
      if (errors.length > q) errors.pop();
    }
    
    // Generate forecasts
    const forecastValues = [...lastValues];
    const forecastErrors = [...errors];
    
    for (let i = 1; i <= daysToPredict; i++) {
      let arPrediction = 0;
      for (let j = 0; j < p; j++) {
        arPrediction += arCoeffs[j] * forecastValues[forecastValues.length - j - 1];
      }
      
      let maPrediction = 0;
      for (let j = 0; j < Math.min(q, forecastErrors.length); j++) {
        maPrediction += maCoeffs[j] * forecastErrors[j];
      }
      
      let predictedValue = arPrediction + maPrediction;
      
      // If we used differencing, we need to invert it
      if (d > 0) {
        predictedValue += values[values.length - 1 + (i - 1)];
      }
      
      forecastValues.push(predictedValue);
      forecastErrors.unshift(0); // Assume zero error for future predictions
      
      if (forecastErrors.length > q) forecastErrors.pop();
      
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      
      predictions.push({
        date: nextDate.toISOString().split('T')[0],
        [targetCol]: parseFloat(predictedValue.toFixed(2)),
        isPrediction: true
      });
    }
    
    return predictions;
  }
  
  function estimateARCoefficients(series: number[], p: number) {
    // Simplified Yule-Walker equations (in practice would use more sophisticated methods)
    const coeffs = Array(p).fill(0.5 / p);
    
    // Adjust coefficients based on lag correlations
    for (let i = 0; i < p; i++) {
      const lag = i + 1;
      const laggedSeries = series.slice(lag);
      const mainSeries = series.slice(0, series.length - lag);
      
      const n = laggedSeries.length;
      const laggedMean = laggedSeries.reduce((sum, val) => sum + val, 0) / n;
      const mainMean = mainSeries.reduce((sum, val) => sum + val, 0) / n;
      
      let numerator = 0;
      let laggedDenominator = 0;
      let mainDenominator = 0;
      
      for (let j = 0; j < n; j++) {
        const laggedDiff = laggedSeries[j] - laggedMean;
        const mainDiff = mainSeries[j] - mainMean;
        
        numerator += laggedDiff * mainDiff;
        laggedDenominator += laggedDiff * laggedDiff;
        mainDenominator += mainDiff * mainDiff;
      }
      
      const correlation = numerator / Math.sqrt(laggedDenominator * mainDenominator);
      coeffs[i] = correlation * 0.5;
    }
    
    return coeffs;
  }
  
  function estimateMACoefficients(series: number[], arCoeffs: number[], q: number) {
    // Very simplified MA estimation
    // In practice, this would use more sophisticated methods
    
    // Create errors based on AR model
    const errors = [];
    
    for (let i = arCoeffs.length; i < series.length; i++) {
      let arPrediction = 0;
      for (let j = 0; j < arCoeffs.length; j++) {
        arPrediction += arCoeffs[j] * series[i - j - 1];
      }
      
      const error = series[i] - arPrediction;
      errors.push(error);
    }
    
    // Simplified MA coefficients based on error autocorrelations
    const coeffs = Array(q).fill(0);
    
    for (let i = 0; i < q && i + 1 < errors.length; i++) {
      const lag = i + 1;
      const laggedErrors = errors.slice(lag);
      const mainErrors = errors.slice(0, errors.length - lag);
      
      const n = laggedErrors.length;
      
      if (n > 0) {
        const laggedMean = laggedErrors.reduce((sum, val) => sum + val, 0) / n;
        const mainMean = mainErrors.reduce((sum, val) => sum + val, 0) / n;
        
        let numerator = 0;
        let laggedDenominator = 0;
        let mainDenominator = 0;
        
        for (let j = 0; j < n; j++) {
          const laggedDiff = laggedErrors[j] - laggedMean;
          const mainDiff = mainErrors[j] - mainMean;
          
          numerator += laggedDiff * mainDiff;
          laggedDenominator += laggedDiff * laggedDiff;
          mainDenominator += mainDiff * mainDiff;
        }
        
        // Correlation coefficient as MA parameter (simplified)
        const denom = Math.sqrt(laggedDenominator * mainDenominator);
        coeffs[i] = denom !== 0 ? numerator / denom : 0;
      }
    }
    
    return coeffs;
  }
};

// Bayesian Structural Time Series (BSTS) model - simplified implementation
export const bstsModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  
  // BSTS decomposes time series into trend, seasonality, and regression components
  // with uncertainty quantified through Bayesian inference
  
  // 1. Estimate trend component with uncertainty
  const { trendEstimate, trendUncertainty } = estimateTrend(values);
  
  // 2. Estimate seasonal components with uncertainty
  const { weeklySeasonals, weeklyUncertainty } = estimateSeasonality(data, targetCol);
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  
  for (let i = 1; i <= daysToPredict; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    const dayOfWeek = nextDate.getDay();
    
    // Increase uncertainty with forecast horizon
    const horizonUncertainty = Math.sqrt(i) * 0.01;
    
    // Combine components with increasing uncertainty for longer horizons
    const trendValue = trendEstimate.intercept + trendEstimate.slope * (values.length + i);
    const seasonalValue = weeklySeasonals[dayOfWeek];
    
    // Add uncertainty adjustments
    const trendAdjustment = (Math.random() - 0.5) * trendUncertainty * i;
    const seasonalAdjustment = (Math.random() - 0.5) * weeklyUncertainty;
    const horizonAdjustment = (Math.random() - 0.5) * horizonUncertainty * values[values.length - 1];
    
    const predictedValue = trendValue + seasonalValue + trendAdjustment + seasonalAdjustment + horizonAdjustment;
    
    predictions.push({
      date: nextDate.toISOString().split('T')[0],
      [targetCol]: parseFloat(predictedValue.toFixed(2)),
      isPrediction: true
    });
  }
  
  return predictions;
  
  // Helper functions
  function estimateTrend(timeSeries: number[]) {
    const n = timeSeries.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    
    // Linear regression
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = timeSeries.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * timeSeries[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate residuals for uncertainty estimation
    const residuals = timeSeries.map((y, i) => y - (intercept + slope * i));
    const residualVariance = residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2);
    const trendUncertainty = Math.sqrt(residualVariance);
    
    return {
      trendEstimate: { slope, intercept },
      trendUncertainty
    };
  }
  
  function estimateSeasonality(data: any[], col: string) {
    const weeklySeasonals = Array(7).fill(0);
    const weeklyVariances = Array(7).fill(0);
    const weekdayCounts = Array(7).fill(0);
    
    // Detrend the series
    const values = data.map(item => item[col]);
    const { trendEstimate } = estimateTrend(values);
    const detrended = values.map((y, i) => y - (trendEstimate.intercept + trendEstimate.slope * i));
    
    // Calculate average seasonal effects by day of week
    data.forEach((item, idx) => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      weeklySeasonals[dayOfWeek] += detrended[idx];
      weekdayCounts[dayOfWeek]++;
    });
    
    // Normalize by counts
    weeklySeasonals.forEach((sum, i) => {
      weeklySeasonals[i] = weekdayCounts[i] > 0 ? sum / weekdayCounts[i] : 0;
    });
    
    // Calculate variances for each day of week
    data.forEach((item, idx) => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      const diff = detrended[idx] - weeklySeasonals[dayOfWeek];
      weeklyVariances[dayOfWeek] += diff * diff;
    });
    
    // Normalize variances
    weeklyVariances.forEach((sum, i) => {
      weeklyVariances[i] = weekdayCounts[i] > 1 ? sum / (weekdayCounts[i] - 1) : sum;
    });
    
    // Average uncertainty across days
    const weeklyUncertainty = Math.sqrt(
      weeklyVariances.reduce((sum, v) => sum + v, 0) / weeklyVariances.length
    );
    
    return { 
      weeklySeasonals, 
      weeklyUncertainty 
    };
  }
};

// Generalized Additive Model (GAM) - simplified implementation
export const gamModel = (data: any[], targetCol: string, daysToPredict: number) => {
  const values = data.map(item => item[targetCol]);
  
  // GAM models the response as a sum of smooth functions of predictors
  // y = α + f₁(x₁) + f₂(x₂) + ... + fₚ(xₚ) + ε
  
  // 1. Linear trend component
  const trendFunc = fitLinearTrend(values);
  
  // 2. Day-of-week effect (categorical)
  const dowEffects = fitDayOfWeekEffect(data, targetCol);
  
  // 3. Recent momentum effect (non-linear)
  const momentumFunc = fitMomentumEffect(values);
  
  // 4. Long-term level effect (non-linear)
  const levelFunc = fitLevelEffect(values);
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(data[data.length - 1].date);
  const lastValues = values.slice(-10); // Last values for momentum calculation
  
  for (let i = 1; i <= daysToPredict; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    const dayOfWeek = nextDate.getDay();
    
    // Combine all components
    const trendComponent = trendFunc(values.length + i);
    const dowComponent = dowEffects[dayOfWeek];
    const momentumComponent = momentumFunc(calculateMomentum(lastValues));
    const levelComponent = levelFunc(values[values.length - 1]);
    
    const predictedValue = trendComponent + dowComponent + momentumComponent + levelComponent;
    
    predictions.push({
      date: nextDate.toISOString().split('T')[0],
      [targetCol]: parseFloat(predictedValue.toFixed(2)),
      isPrediction: true
    });
    
    // Update last values for next prediction
    lastValues.push(predictedValue);
    lastValues.shift();
  }
  
  return predictions;
  
  // Helper functions for fitting components
  function fitLinearTrend(timeSeries: number[]) {
    const n = timeSeries.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    
    // Simple linear regression
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = timeSeries.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * timeSeries[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Return trend function
    return (x: number) => intercept + slope * x;
  }
  
  function fitDayOfWeekEffect(data: any[], col: string) {
    const values = data.map(item => item[col]);
    
    // Detrend the series
    const trendFunc = fitLinearTrend(values);
    const detrended = values.map((y, i) => y - trendFunc(i));
    
    // Calculate effect by day of week
    const dowSums = Array(7).fill(0);
    const dowCounts = Array(7).fill(0);
    
    data.forEach((item, idx) => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay();
      dowSums[dayOfWeek] += detrended[idx];
      dowCounts[dayOfWeek]++;
    });
    
    // Calculate average effect for each day
    return dowSums.map((sum, i) => 
      dowCounts[i] > 0 ? sum / dowCounts[i] : 0
    );
  }
  
  function fitMomentumEffect(timeSeries: number[]) {
    // A function that returns higher values for strong momentum
    // and lower values for weak momentum
    return (momentum: number) => {
      // Non-linear transformation: stronger effect for extreme momentum
      return momentum * (1 + 0.2 * Math.abs(momentum));
    };
  }
  
  function fitLevelEffect(timeSeries: number[]) {
    const mean = timeSeries.reduce((sum, val) => sum + val, 0) / timeSeries.length;
    const stdDev = Math.sqrt(
      timeSeries.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / timeSeries.length
    );
    
    // A function that adjusts predictions based on level
    return (level: number) => {
      // Mean reversion effect: if current level is high, predict lower future values
      const zScore = (level - mean) / stdDev;
      return -0.05 * zScore * level;
    };
  }
  
  function calculateMomentum(recentValues: number[]) {
    if (recentValues.length < 3) return 0;
    
    // Short-term momentum: last value vs average of previous values
    const last = recentValues[recentValues.length - 1];
    const prevAvg = recentValues.slice(0, -1).reduce((sum, val) => sum + val, 0) / 
                   (recentValues.length - 1);
    
    return (last - prevAvg) / Math.abs(prevAvg || 1);
  }
};

// Model evaluation functions
// ... keep existing code (calculateMAE, calculateMSE, calculateRMSE, calculateMAPE, calculateR2, other evaluation functions)
