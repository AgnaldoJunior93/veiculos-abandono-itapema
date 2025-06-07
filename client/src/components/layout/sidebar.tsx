import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Car, 
  Megaphone, 
  FileText,
  Code,
  LayoutDashboard
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Veículos", href: "/vehicles", icon: Car },
  { name: "Relatórios", href: "/reports", icon: FileText },
  { name: "API Access", href: "/api", icon: Code },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive 
                      ? "text-gov-blue bg-blue-50" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
