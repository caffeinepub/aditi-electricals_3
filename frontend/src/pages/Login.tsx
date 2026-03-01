import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGetAllWorkers } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { data: workers = [], isLoading: workersLoading } = useGetAllWorkers();
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      // Map workers to the format expected by login
      const workerEntries = workers.map((w) => ({
        workerId: w.workerId,
        name: w.name,
        pin: w.pin,
      }));

      const success = login(userId.trim().toUpperCase(), pin, workerEntries);
      if (!success) {
        setError('Invalid ID or PIN. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Aditi Electricals</h1>
        <p className="text-muted-foreground mt-1 text-sm">Worker Management System</p>
      </div>

      <Card className="w-full max-w-sm shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your Employee ID and PIN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="userId">Employee ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="e.g. OWNER001 or W001"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoCapitalize="characters"
                autoComplete="username"
                disabled={isLoggingIn}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoComplete="current-password"
                disabled={isLoggingIn}
                maxLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn || !userId || !pin}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {workersLoading && (
            <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading worker data...
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-6">
        © {new Date().getFullYear()} Aditi Electricals
      </p>
    </div>
  );
}
