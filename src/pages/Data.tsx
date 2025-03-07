
import React, { useEffect, useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertCircle, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Data = () => {
  const { dataset, isLoading } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('data');

  // Replace useMemo with useEffect to avoid React Router warning
  useEffect(() => {
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

  const { data, meta, fileName } = dataset;
  const { columnNames, columnTypes, rowCount, missingValues, summary } = meta;

  // Display only a subset of rows for performance
  const displayRows = data.slice(0, 100);

  const columnTypeColor = (type: string) => {
    switch (type) {
      case 'numeric': return 'bg-finance-blue text-white';
      case 'date': return 'bg-finance-purple text-white';
      case 'categorical': return 'bg-finance-yellow text-black';
      default: return 'bg-finance-gray text-white';
    }
  };

  // Fix: Get column types for original column names, not the mapped ones
  const getColumnType = (column: string) => {
    // Find original column name if it's been mapped
    for (const [originalCol, mappedCol] of Object.entries(columnNames)) {
      if (mappedCol === column) {
        return columnTypes[originalCol] || 'unknown';
      }
    }
    return columnTypes[column] || 'unknown';
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dataset Overview</h1>
          <p className="text-muted-foreground mt-1">
            <FileText className="inline mr-1" size={16} />
            {fileName} • {rowCount.toLocaleString()} rows • {columnNames.length} columns
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => navigate('/visualization')} variant="outline">
            Visualize Data
          </Button>
          <Button onClick={() => navigate('/cleaning')}>
            Clean Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="data">Raw Data</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="columns">Column Details</TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Raw Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh]">
                <div className="w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columnNames.map((column) => (
                          <TableHead key={column} className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {column}
                              <Badge className={columnTypeColor(columnTypes[column])}>
                                {columnTypes[column]}
                              </Badge>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayRows.map((row, index) => (
                        <TableRow key={index}>
                          {columnNames.map((column) => (
                            <TableCell key={`${index}-${column}`} className="whitespace-nowrap">
                              {row[column] !== undefined ? String(row[column]) : '—'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
              {rowCount > 100 && (
                <p className="text-sm text-muted-foreground mt-4">
                  <InfoIcon className="inline mr-1" size={14} />
                  Showing first 100 rows of {rowCount.toLocaleString()} total rows
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dataset Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Rows</div>
                      <div className="text-2xl font-bold">{rowCount.toLocaleString()}</div>
                    </div>
                    <div className="bg-secondary/50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Columns</div>
                      <div className="text-2xl font-bold">{columnNames.length}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Column Types:</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-finance-blue text-white">
                        {Object.values(columnTypes).filter(type => type === 'numeric').length} Numeric
                      </Badge>
                      <Badge className="bg-finance-purple text-white">
                        {Object.values(columnTypes).filter(type => type === 'date').length} Date
                      </Badge>
                      <Badge className="bg-finance-yellow text-black">
                        {Object.values(columnTypes).filter(type => type === 'categorical').length} Categorical
                      </Badge>
                      <Badge className="bg-finance-gray text-white">
                        {Object.values(columnTypes).filter(type => type === 'unknown').length} Other
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Missing Values:</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column</TableHead>
                          <TableHead>Missing</TableHead>
                          <TableHead>Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(missingValues)
                          .filter(([_, count]) => count > 0)
                          .sort(([_, a], [__, b]) => b - a)
                          .slice(0, 5)
                          .map(([column, count]) => (
                            <TableRow key={column}>
                              <TableCell>{column}</TableCell>
                              <TableCell>{count}</TableCell>
                              <TableCell>{((count / rowCount) * 100).toFixed(2)}%</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    {Object.values(missingValues).every(v => v === 0) && (
                      <p className="text-sm text-muted-foreground">No missing values found in the dataset.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Numeric Columns Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[40vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead>Min</TableHead>
                        <TableHead>Max</TableHead>
                        <TableHead>Mean</TableHead>
                        <TableHead>Median</TableHead>
                        <TableHead>Std Dev</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(summary).map(([column, stats]) => (
                        <TableRow key={column}>
                          <TableCell>{column}</TableCell>
                          <TableCell>{stats.min !== undefined ? stats.min.toFixed(2) : '—'}</TableCell>
                          <TableCell>{stats.max !== undefined ? stats.max.toFixed(2) : '—'}</TableCell>
                          <TableCell>{stats.mean !== undefined ? stats.mean.toFixed(2) : '—'}</TableCell>
                          <TableCell>{stats.median !== undefined ? stats.median.toFixed(2) : '—'}</TableCell>
                          <TableCell>{stats.stdDev !== undefined ? stats.stdDev.toFixed(2) : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle>Column Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Missing Values</TableHead>
                    <TableHead>Missing %</TableHead>
                    <TableHead>Sample Values</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columnNames.map((column) => (
                    <TableRow key={column}>
                      <TableCell className="font-medium">{column}</TableCell>
                      <TableCell>
                        <Badge className={columnTypeColor(columnTypes[column])}>
                          {columnTypes[column]}
                        </Badge>
                      </TableCell>
                      <TableCell>{missingValues[column] || 0}</TableCell>
                      <TableCell>{((missingValues[column] || 0) / rowCount * 100).toFixed(2)}%</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {data.slice(0, 3).map((row, i) => (
                          <span key={i} className="mr-2">
                            {row[column] !== undefined ? String(row[column]) : '—'}
                            {i < 2 ? ', ' : ''}
                          </span>
                        ))}
                        ...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Data;
