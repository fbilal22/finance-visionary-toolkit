
import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, BarChart, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, ResponsiveContainer, Scatter, ScatterChart as RechartsScatterChart, Cell } from 'recharts';
import { AlertCircle, TrendingUp, BarChart3, CandlestickChart, ScatterChart } from 'lucide-react';

const Visualization = () => {
  const { dataset, isLoading } = useData();
  const navigate = useNavigate();
  const [chartType, setChartType] = useState('line');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [additionalSeries, setAdditionalSeries] = useState<string[]>([]);

  // Redirect if no data
  useMemo(() => {
    if (!isLoading && !dataset) {
      navigate('/');
    }
  }, [dataset, isLoading, navigate]);

  // Initialize default axes when dataset loads
  useMemo(() => {
    if (dataset) {
      const { columnNames, columnTypes } = dataset.meta;
      
      // Set date column as default X-axis if available
      const dateColumn = columnNames.find(col => columnTypes[col] === 'date');
      if (dateColumn) setXAxis(dateColumn);
      
      // Set first numeric column as default Y-axis
      const numericColumns = columnNames.filter(col => columnTypes[col] === 'numeric');
      if (numericColumns.length > 0) {
        setYAxis(numericColumns[0]);
        
        // Set second and third numeric columns as additional series if available
        if (numericColumns.length > 1) {
          setAdditionalSeries([numericColumns[1]]);
          if (numericColumns.length > 2) {
            setAdditionalSeries([numericColumns[1], numericColumns[2]]);
          }
        }
      }
    }
  }, [dataset]);

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
  const { columnNames, columnTypes } = meta;
  
  // Filter numeric columns for Y-axis
  const numericColumns = columnNames.filter(col => columnTypes[col] === 'numeric');
  
  // Check if we have OHLC data for candlestick
  const hasOHLCData = numericColumns.includes('open') && 
                       numericColumns.includes('high') && 
                       numericColumns.includes('low') && 
                       numericColumns.includes('close');

  // Generate chart data (limit to 100 points for performance)
  const chartData = data.slice(-100);
  
  // Generate a palette of colors based on finance theme
  const colors = ['#1E88E5', '#4CAF50', '#E53935', '#FFB300', '#8E24AA', '#607D8B'];

  // Create a formatter for the tooltip values
  const formatValue = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  const renderChart = () => {
    if (!xAxis || !yAxis) {
      return (
        <div className="flex items-center justify-center h-80 bg-muted/20 rounded-lg">
          <p className="text-muted-foreground">Select X and Y axes to visualize data</p>
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={xAxis} 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tick={{ fontSize: 12 }} 
              />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(26, 33, 48, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                formatter={(value: number) => [formatValue(value), yAxis]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={yAxis} 
                stroke={colors[0]} 
                strokeWidth={2}
                dot={{ r: 1 }}
                activeDot={{ r: 5 }}
              />
              {additionalSeries.map((series, index) => (
                series && (
                  <Line
                    key={series}
                    type="monotone"
                    dataKey={series}
                    stroke={colors[(index + 1) % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 1 }}
                    activeDot={{ r: 5 }}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={xAxis} 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tick={{ fontSize: 12 }} 
              />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(26, 33, 48, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                formatter={(value: number) => [formatValue(value), yAxis]}
              />
              <Legend />
              <Bar dataKey={yAxis} fill={colors[0]} />
              {additionalSeries.map((series, index) => (
                series && (
                  <Bar
                    key={series}
                    dataKey={series}
                    fill={colors[(index + 1) % colors.length]}
                  />
                )
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <defs>
                {[yAxis, ...additionalSeries.filter(Boolean)].map((key, index) => (
                  <linearGradient key={key} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={xAxis} 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tick={{ fontSize: 12 }} 
              />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(26, 33, 48, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                formatter={(value: number) => [formatValue(value), yAxis]}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey={yAxis} 
                stroke={colors[0]} 
                fillOpacity={1} 
                fill={`url(#color0)`} 
              />
              {additionalSeries.map((series, index) => (
                series && (
                  <Area
                    key={series}
                    type="monotone"
                    dataKey={series}
                    stroke={colors[(index + 1) % colors.length]}
                    fillOpacity={1}
                    fill={`url(#color${index + 1})`}
                  />
                )
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        );
        
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                type="number" 
                dataKey={xAxis} 
                name={xAxis} 
                tick={{ fontSize: 12 }} 
              />
              <YAxis type="number" dataKey={yAxis} name={yAxis} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: 'rgba(26, 33, 48, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                formatter={(value: number) => [formatValue(value), yAxis]}
              />
              <Legend />
              <Scatter 
                name={`${xAxis} vs ${yAxis}`} 
                data={chartData}
                fill={colors[0]}
              />
            </RechartsScatterChart>
          </ResponsiveContainer>
        );
        
      case 'candlestick':
        if (!hasOHLCData) {
          return (
            <div className="flex items-center justify-center h-80 bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">
                Candlestick chart requires 'open', 'high', 'low', and 'close' columns
              </p>
            </div>
          );
        }
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={xAxis} 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tick={{ fontSize: 12 }} 
              />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(26, 33, 48, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                formatter={(value: number) => [formatValue(value), '']}
              />
              <Legend />
              {/* High-Low line */}
              {chartData.map((entry, index) => (
                <Line
                  key={`hl-${index}`}
                  dataKey="high"
                  stroke="transparent"
                  dot={false}
                >
                  <defs>
                    <marker id="dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5">
                      <circle cx="5" cy="5" r="5" fill="red" />
                    </marker>
                  </defs>
                  {chartData.map((entry, idx) => {
                    const fill = entry.close >= entry.open ? colors[1] : colors[2];
                    return (
                      <Line
                        key={`hl-${idx}`}
                        x1={idx}
                        y1={entry.low}
                        x2={idx}
                        y2={entry.high}
                        stroke={fill}
                      />
                    );
                  })}
                </Line>
              ))}
              {/* Candle bodies */}
              {chartData.map((entry, index) => {
                const fill = entry.close >= entry.open ? colors[1] : colors[2];
                return (
                  <Bar
                    key={`candle-${index}`}
                    dataKey={entry.close >= entry.open ? 'close' : 'open'}
                    stackId={`stack-${index}`}
                    fill={fill}
                    stroke={fill}
                  >
                    <Cell 
                      height={Math.abs(entry.close - entry.open)} 
                      fill={fill} 
                    />
                  </Bar>
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Data Visualization</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Chart Configuration</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant={chartType === 'line' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setChartType('line')}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Line
                </Button>
                <Button 
                  variant={chartType === 'bar' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Bar
                </Button>
                <Button 
                  variant={chartType === 'area' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setChartType('area')}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Area
                </Button>
                <Button 
                  variant={chartType === 'scatter' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setChartType('scatter')}
                >
                  <ScatterChart className="h-4 w-4 mr-1" />
                  Scatter
                </Button>
                <Button 
                  variant={chartType === 'candlestick' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setChartType('candlestick')}
                >
                  <CandlestickChart className="h-4 w-4 mr-1" />
                  Candlestick
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-1 block">X-Axis</label>
                <Select value={xAxis} onValueChange={setXAxis}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select X-axis column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columnNames.map(col => (
                      <SelectItem key={col} value={col}>
                        {col} {columnTypes[col] === 'date' ? '(Date)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Y-Axis</label>
                <Select value={yAxis} onValueChange={setYAxis}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Y-axis column" />
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
                <label className="text-sm font-medium mb-1 block">Additional Series</label>
                <Select 
                  value={additionalSeries[0] || ''}
                  onValueChange={(value) => {
                    if (value) {
                      setAdditionalSeries([value, additionalSeries[1] || '']);
                    } else {
                      // Use 'none' as placeholder value
                      setAdditionalSeries([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add another series (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {numericColumns
                      .filter(col => col !== yAxis)
                      .map(col => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="bg-finance-chart-bg rounded-lg p-4">
              {renderChart()}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => navigate('/data')}>
            Back to Data
          </Button>
          <Button onClick={() => navigate('/cleaning')}>
            Continue to Data Cleaning
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Visualization;
