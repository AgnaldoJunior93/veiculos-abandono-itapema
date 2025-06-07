import { useLogout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { User } from "@shared/schema";

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img 
                className="h-8 w-8 rounded-full" 
                src="https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" 
                alt="Logo Itapema" 
              />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gov-gray">
                Sistema de Veículos Abandonados
              </h1>
              <p className="text-sm text-gray-500">Prefeitura de Itapema</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gov-gray">{user.name}</p>
              <p className="text-xs text-gray-500">{user.type}</p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
