
"use client";

import Link from "next/link";
import { University, LayoutGrid, PlusSquare, List, User as UserIcon, LogIn, LogOut, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/hooks/useAppContext";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import React from "react";

export function Header() {
  const { user, logout, pendingRequestCount } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: "/", label: "Home", icon: LayoutGrid },
    { href: "/post", label: "Post", icon: PlusSquare },
    { href: "/browse", label: "Browse", icon: List },
  ];

  const handleLogout = () => {
    logout();
  };

  const handleNotificationClick = () => {
    router.push('/profile?tab=requests');
  }

  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
     <SheetClose asChild>
        <Link href={href} className={cn(
            "flex items-center gap-4 px-2.5 py-2 text-muted-foreground hover:text-foreground",
            pathname === href && "text-foreground bg-accent"
        )}>
            {children}
        </Link>
     </SheetClose>
  );

  return (
    <header className="bg-card shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full max-w-xs p-0">
                        <div className="flex h-16 items-center border-b px-4">
                             <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                                <University className="h-6 w-6 text-primary" />
                                <span className="font-headline">RUET Connect</span>
                            </Link>
                        </div>
                        <div className="flex flex-col gap-1 p-2">
                            {navLinks.map((link) => (
                                <NavLink key={link.href} href={link.href}>
                                    <link.icon className="h-5 w-5" />
                                    {link.label}
                                </NavLink>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            <Link href="/" className="hidden md:flex items-center gap-2 font-bold text-lg">
                <University className="h-6 w-6 text-primary" />
                <span className="font-headline">RUET Connect</span>
            </Link>
          </div>
          

          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                asChild
                className={cn(
                  "text-muted-foreground",
                  pathname === link.href && "text-primary bg-accent"
                )}
              >
                <Link href={link.href}>
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="relative" onClick={handleNotificationClick}>
                    <Bell className="h-5 w-5" />
                    {pendingRequestCount > 0 && (
                        <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                            {pendingRequestCount}
                        </span>
                    )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{user.name ? user.name.charAt(0) : user.id.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name || 'Student'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
