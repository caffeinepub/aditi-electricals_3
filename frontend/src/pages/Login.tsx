import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGetAllWorkers } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Zap } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { data: workers = [], isLoading: workersLoading } = useGetAllWorkers();
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim() || !pin.trim()) {
      setError('Please enter your Employee ID and PIN.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const workerList = workers.map(w => ({
        workerId: w.workerId,
        name: w.name,
        pin: w.pin,
        active: w.active,
      }));
      const success = await login(employeeId, pin, workerList);
      if (!success) {
        setError('Invalid Employee ID or PIN. Please try again.');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-[var(--header-bg)] text-[var(--header-fg)] py-4 px-6 header-shadow">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Zap className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-wide">Aditi Electricals</h1>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md card-shadow border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-[var(--header-bg)] flex items-center justify-center mb-3">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to Aditi Electricals</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="e.g. OWNER001 or W001"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  disabled={loading}
                  className="h-11"
                  maxLength={8}
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loading || workersLoading}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
                ) : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Aditi Electricals. Built with ❤️ using{' '}
          <a href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
