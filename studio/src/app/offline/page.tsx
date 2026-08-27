'use client';

/**
 * Offline Page
 * 
 * Shown when the user is offline and tries to navigate.
 */

import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <WifiOff className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle>You're Offline</CardTitle>
          <CardDescription>
            It looks like you've lost your internet connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Don't worry! Some features are still available offline:
          </p>
          <ul className="text-sm text-left space-y-2">
            <li>✓ View your learning progress</li>
            <li>✓ Review past conversations</li>
            <li>✓ Browse achievements</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            To start new conversations with syncsenta, please reconnect to the internet.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
