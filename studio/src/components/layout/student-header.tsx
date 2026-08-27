
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, ArrowLeft, LogOut, Settings, Video } from 'lucide-react';
import ProfileDialog from './profile-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface StudentHeaderProps {
  showBackButton: boolean;
  onBack: () => void;
  showVideoCallButton?: boolean;
  onJoinVideoCall?: () => void;
  variant?: 'default' | 'catalog';
}

export function StudentHeader({
  showBackButton,
  onBack,
  showVideoCallButton = false,
  onJoinVideoCall,
  variant = 'default',
}: StudentHeaderProps) {
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [studentFirstName, setStudentFirstName] = useState('Student');
  const [studentAvatar, setStudentAvatar] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const name = localStorage.getItem('studentName');
    const avatar = localStorage.getItem('userAvatar');
    if (name) {
        setStudentFirstName(name.split(' ')[0]);
    }
    if (avatar) {
        setStudentAvatar(avatar);
    }
  }, []);

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <>
        <div
          className={`relative flex items-center justify-between px-5 py-4 sm:px-8 ${
            variant === 'catalog' ? 'text-teal-700' : 'text-foreground'
          }`}
        >
            <div className="z-10">
                {showBackButton && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onBack}
                      className={
                        variant === 'catalog'
                          ? 'text-teal-700 hover:bg-teal-50 hover:text-teal-900'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    >
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Button>
                )}
            </div>
            
            <div className="absolute inset-x-0 hidden text-center pointer-events-none sm:block">
                <h1 className={`font-headline text-3xl font-bold sm:text-4xl ${variant === 'catalog' ? 'text-teal-700' : ''}`}>
                  Karibu!
                </h1>
                <p className={variant === 'catalog' ? 'text-lg text-teal-600' : 'text-muted-foreground text-lg'}>
                    I&apos;m syncsenta, your friendly Socratic Mentor.
                </p>
            </div>
            
            <div className="flex items-center gap-2 z-10">
                {showVideoCallButton && (
                    <Button onClick={onJoinVideoCall} className="bg-green-500 hover:bg-green-600">
                        <Video className="mr-2" />
                        Join Video Call
                    </Button>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button
                            variant="outline"
                            className={`flex h-12 items-center gap-2 rounded-full px-4 ${
                              variant === 'catalog'
                                ? 'border-teal-300 bg-teal-400 text-white hover:border-teal-400 hover:bg-teal-500 hover:text-white'
                                : 'bg-background/80 border-border text-foreground hover:bg-muted hover:border-border/80'
                            }`}
                          >
                            <Avatar className="h-8 w-8 bg-white/20">
                               <AvatarImage src={studentAvatar || undefined} alt="Profile Picture" />
                               <AvatarFallback className={variant === 'catalog' ? 'bg-white/25 text-white' : ''}>
                                 {studentFirstName.charAt(0)}
                               </AvatarFallback>
                            </Avatar>
                            <span className="hidden sm:inline">Profile</span>
                          </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                         <DropdownMenuLabel>My Account</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Profile Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout}>
                           <LogOut className="mr-2 h-4 w-4" />
                           <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        {variant === 'catalog' && (
          <div className="px-5 pb-3 text-center sm:hidden">
            <h1 className="font-headline text-2xl font-bold text-teal-700">Karibu!</h1>
            <p className="mt-0.5 text-sm text-teal-600">
              I&apos;m syncsenta, your friendly Socratic Mentor.
            </p>
          </div>
        )}
        <ProfileDialog open={isProfileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
