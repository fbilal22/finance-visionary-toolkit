
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Upload, ClipboardCheck, LineChart } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Finance Visionary Toolkit</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced financial data analysis, visualization, and predictive modeling platform for data-driven decisions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader>
              <Upload className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Data Import</CardTitle>
              <CardDescription>
                Upload and manage your financial datasets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Import CSV files, process raw data, and prepare your datasets for analysis with our intuitive import tools.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/import" className="w-full">
                <Button variant="default" className="w-full">
                  Import Data
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader>
              <ClipboardCheck className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Data Cleaning</CardTitle>
              <CardDescription>
                Advanced data preprocessing tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Handle missing values, detect outliers using statistical methods, and normalize your financial data for better results.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/cleaning" className="w-full">
                <Button variant="default" className="w-full">
                  Clean Data
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader>
              <LineChart className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Data Visualization</CardTitle>
              <CardDescription>
                Interactive financial visualizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Explore your data through line charts, candlestick charts, scatter plots, and other financial visualization tools.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/visualization" className="w-full">
                <Button variant="default" className="w-full">
                  Visualize Data
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Data Exploration</CardTitle>
              <CardDescription>
                Analyze and understand your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Discover patterns, analyze distributions, and calculate key financial metrics to gain deeper insights.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/data" className="w-full">
                <Button variant="default" className="w-full">
                  Explore Data
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="border border-border hover:shadow-md transition-shadow">
            <CardHeader>
              <TrendingUp className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Predictive Models</CardTitle>
              <CardDescription>
                Build and evaluate predictive models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Develop financial forecasting models with various algorithms and statistical validation techniques.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/prediction" className="w-full">
                <Button variant="default" className="w-full">
                  Predict Trends
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
