
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Upload, 
  Database, 
  BarChart2, 
  Check, 
  TrendingUp, 
  Brain 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/import', label: 'Import', icon: <Upload size={18} /> },
    { path: '/data', label: 'Données', icon: <Database size={18} /> },
    { path: '/visualization', label: 'Visualisation', icon: <BarChart2 size={18} /> },
    { path: '/cleaning', label: 'Nettoyage', icon: <Check size={18} /> },
    { path: '/prediction', label: 'Prédiction', icon: <TrendingUp size={18} /> },
    { path: '/automl', label: 'AutoML', icon: <Brain size={18} /> },
  ];

  return (
    <div className="border-b bg-background">
      <div className="container mx-auto">
        <nav className="flex overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                location.pathname === item.path
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Navigation;
