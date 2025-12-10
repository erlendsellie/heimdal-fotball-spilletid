import { NavLink } from 'react-router-dom';
import { Home, Trophy, Users, Settings, LogOut, Menu, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { auth } from '@/lib/auth';
import { cn } from '@/lib/utils';
const navItems = [
  { to: '/', label: 'Oversikt', icon: Home },
  { to: '/tournament', label: 'Turneringer', icon: Trophy },
  { to: '/team', label: 'Lag', icon: Users },
  { to: '/settings', label: 'Innstillinger', icon: Settings },
];
const NavItem = ({ to, label, icon: Icon }: typeof navItems[0]) => (
  <NavLink
    to={to}
    end // Use `end` for the dashboard link to avoid it being active for all child routes
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-heimdal-red text-white hover:text-white hover:bg-heimdal-red/90"
      )
    }
  >
    <Icon className="h-4 w-4" />
    {label}
  </NavLink>
);
export function Navigation() {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block fixed top-0 left-0 h-full w-64">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 bg-heimdal-green text-white">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <img src="https://via.placeholder.com/150x150/006400/ffffff?text=HF" alt="Heimdal Fotball Logo" className="h-8 w-8 rounded-full border-2 border-heimdal-yellow" />
              <span className="">Heimdal Spilletid</span>
            </NavLink>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map(item => <NavItem key={item.to} {...item} />)}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => auth.logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logg ut
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile Header */}
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium">
              <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
                <img src="https://via.placeholder.com/150x150/006400/ffffff?text=HF" alt="Heimdal Fotball Logo" className="h-8 w-8 rounded-full" />
                <span>Heimdal Spilletid</span>
              </NavLink>
              {navItems.map(item => <NavItem key={item.to} {...item} />)}
            </nav>
            <div className="mt-auto">
              <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => auth.logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logg ut
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="w-full flex-1">
          {/* Optional: Add search or other header items here */}
        </div>
      </header>
      {/* Main Content Wrapper to offset sidebar */}
      <div className="md:pl-64">
        {/* Children will be rendered here by the router */}
      </div>
    </>
  );
}