import { Code2, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="flex h-11 items-center px-3 gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden h-8 w-8 p-0"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          <h1 className="text-base font-bold">CICI</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <>
              <span className="text-xs text-white hidden sm:inline">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" className="h-8" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline text-xs">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
