
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import { Brain } from 'lucide-react';

const AutoML = () => {
  const { dataset } = useData();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">AutoML</h1>
      
      {!dataset ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain size={20} />
              No Data Available
            </CardTitle>
            <CardDescription>
              Please import data first to use AutoML features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Visit the Import page to upload a dataset or load sample data before using AutoML features.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>AutoML Features</CardTitle>
              <CardDescription>
                Automatically build and evaluate machine learning models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                AutoML features will be available in a future update. This will include automated:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Feature selection and engineering</li>
                <li>Model selection and hyperparameter tuning</li>
                <li>Ensemble model creation</li>
                <li>Model evaluation and comparison</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AutoML;
