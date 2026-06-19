"use client";

import {useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ThemeToggle} from "./theme-toggle";
import {OpenGifameLogo} from "./opengifame-logo";
import {signOut, useSession} from "next-auth/react";
import {UserAvatar} from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Dialog, DialogContent, DialogTrigger} from "@/components/ui/dialog";
import {ChevronDown, LogIn, LogOut, Upload, User} from "lucide-react";
import {SignInForm} from "@/components/sign-in-form";
import {hasPermission, Permission} from "@/lib/permissions";

export function Header() {
  const {data: session, status} = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center space-x-6 shrink-0">
          <Link href="/" className="flex items-center space-x-2">
            <OpenGifameLogo className="h-8 w-8 shrink-0"/>
            <span className="text-xl font-bold">OpenGifame</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link
              href="/trending"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Trending
            </Link>
            {session && hasPermission(session.user.permissions, Permission.VideoEditor) && (
              <Link
                href="/videos"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Videos
              </Link>
            )}
            {session && hasPermission(session.user.permissions, Permission.Admin) && (
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Upload Button - Center */}
        {session && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <Button asChild>
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4"/>
                Upload
              </Link>
            </Button>
          </div>
        )}

        <div className="flex items-center space-x-3 shrink-0">
          <ThemeToggle/>
          {status === "loading" ? null : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 p-1"
                >
                  <UserAvatar
                    src={session.user?.image}
                    name={session.user?.name}
                    size={32}
                  />
                  <ChevronDown className="h-3 w-3 opacity-50"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {(session.user?.slug ?? session.user?.id) && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/@${session.user.slug ?? session.user.id}`}
                      className="flex items-center"
                    >
                      <User className="mr-2 h-4 w-4"/>
                      Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator/>
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="flex items-center text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4"/>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <LogIn className="mr-2 h-4 w-4"/>
                  Sign In
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <SignInForm
                  className="p-2"
                  onSuccess={() => setDialogOpen(false)}
                  onNavigate={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}
