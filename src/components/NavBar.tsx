
import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Database, LineChart, Eraser, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const NavItem = ({ to, icon, label, active }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
      active 
        ? "bg-primary text-primary-foreground" 
        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
    )}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </Link>
);

interface NavBarProps {
  currentPath: string;
}

const NavBar = ({ currentPath }: NavBarProps) => {
  const navItems = [
    { to: "/", icon: <Upload size={18} />, label: "Import" },
    { to: "/data", icon: <Database size={18} />, label: "Data" },
    { to: "/visualization", icon: <LineChart size={18} />, label: "Visualization" },
    { to: "/cleaning", icon: <Eraser size={18} />, label: "Cleaning" },
    { to: "/prediction", icon: <TrendingUp size={18} />, label: "Prediction" },
    { to: "/automl", icon: <Sparkles size={18} />, label: "AutoML" },
  ];

  return (
    <div className="bg-card shadow-sm border-b">
      <div className="container h-16 flex items-center">
        <div className="mr-6">
          <h1 className="text-xl font-semibold">Finance Visionary Toolkit</h1>
        </div>
        <nav className="flex flex-1 items-center space-x-1">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={currentPath === item.to}
            />
          ))}
        </nav>
      </div>
    </div>
  );
};

export default NavBar;
