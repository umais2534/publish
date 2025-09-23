import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Mic,
  History,
  PawPrint,
  Building2,
  LogOut,
  Menu,
  FileText,
  Phone,
  NotebookPen,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  FileAudio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {  useNavigate } from "react-router-dom";
import ProfilePage from "../profile/ProfilePage";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [expanded, setExpanded] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const location = useLocation();
  const { logout } = useAuth();

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const toggleSidebar = () => setExpanded(!expanded);
  const handleLogout = () => logout();
const navigate = useNavigate();

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/transcribe", label: "Transcribe", icon: <Mic size={20} /> },
    { path: "/history", label: "History", icon: <History size={20} /> },
    { path: "/calls", label: "Calls", icon: <Phone size={20} /> },
    { path: "/pets", label: "Pets", icon: <PawPrint size={20} /> },
    { path: "/clinics", label: "Clinics", icon: <Building2 size={20} /> },
    { path: "/templates", label: "Templates", icon: <NotebookPen size={20} /> },
    { path: "/files", label: "Files", icon: <FileText size={20} /> },
    
    // { path: "/settings", label: "Files", icon: <FileText size={20}/> }
  ];
// Auto-expand sidebar on screen > 768px
React.useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setExpanded(true);
    }
  };

  window.addEventListener("resize", handleResize);

  // Check once on mount
  handleResize();

  return () => window.removeEventListener("resize", handleResize);
}, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Toggle */}
      <div
        className={cn(
          "absolute justify-end bg-gray-250 text-gray-500",
          expanded ? "left-56" : "left-8"
        )}
      >
        
      </div>

      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        <Menu size={20} />
      </Button>

      {/* Sidebar */}
   <div
  className={cn(
    "fixed inset-y-0 left-0 z-40 bg-[#E6EFFF] border-r shadow-sm transition-all duration-200 md:relative flex flex-col",
    expanded ? "w-60" : "w-16",
    "transition-transform",
    expanded || window.innerWidth >= 640 ? "translate-x-0" : "-translate-x-full"
  )}
>
  {/* Logo */}
  <div className="flex items-center justify-center h-[80px] border-b pt-2">
    <img
      src={expanded ? "/purrscribe.svg" : "/fulllogo_transparent.png"}
      alt="PurrScribe Logo"
      className={cn(expanded ? "w-[100px]" : "w-[150px]", "hidden md:block")}
    />
  </div>

  {/* Navigation Items */}
  <div
  className="flex-1 overflow-y-auto p-4 pt-10"
  style={{
    rowGap: window.innerHeight > 500 ? "1rem" : "0", // 1rem = 16px gap
    display: "flex",
    flexDirection: "column",
  }}
>
    {navigationItems.map((item) => (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
          location.pathname === item.path
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-white hover:text-accent-foreground",
          !expanded && "justify-center px-0"
        )}
      >
        <span className="mr-3">{item.icon}</span>
        {expanded && <span>{item.label}</span>}
      </Link>
    ))}
  </div>

  {/* Logout Button at Bottom */}
  <div className="p-4 border-t">
  <Button
    variant="ghost"
    className={cn(
      "flex items-center w-full justify-start text-muted-foreground hover:text-foreground",
      !expanded && "justify-start"
    )}
    onClick={handleLogout}
  >
    <LogOut size={20} className="mr-2" />
    {expanded && <span>Logout</span>}
  </Button>
</div>

</div>


      {/* Main Content */}
   {/* Main Content */}
<div className="flex-1 overflow-auto relative flex flex-col">

  {/* Header */}
 {/* Header */}
<header
  className="h-30 px-6 flex items-center justify-end border-b shadow-md relative"
  style={{
    background: "linear-gradient(to right, #E6EFFF, #c4dfff, #a3cfff, #82bfff)",
  }}
>
  {/* Mobile Logo Centered */}
  <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
    <img src="/purrscribe.svg" alt="PurrScribe Logo" className="h-13 w-20" />
  </div>

  {/* Profile Avatar & Dropdown */}
  <div className="relative">
    <div onClick={toggleDropdown} className="cursor-pointer">
      <Avatar className="h-12 w-12 py-2">
        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=vet" />
        <AvatarFallback>VT</AvatarFallback>
      </Avatar>
    </div>

  {dropdownOpen && (
  <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-50">
    <button
      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
      onClick={() => {
        setDropdownOpen(false);
        // navigate to settings
        navigate("/profile");// or use `useNavigate()`
      }}
    >
      Settings
    </button>
    <button
      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
      onClick={handleLogout}
    >
      Logout
    </button>
  </div>
)}

  </div>
</header>


  {/* Page Content */}
  <main className="flex-1 md:p-9 px-10 ml-10 sm:px-6 lg:px-20 py-6">
    {children}
  </main>
</div>

    </div>
  );
};

export default DashboardLayout;
