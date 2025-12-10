import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { auth } from '@/lib/auth';
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('trener@heimdal.no');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const from = location.state?.from?.pathname || '/';
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await auth.login(email, password);
      toast.success('Successfully logged in!');
      // Redirect to the page the user was trying to access, or to the dashboard
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="w-full max-w-md mx-auto shadow-2xl">
                <CardHeader className="text-center">
                  <div className="inline-block mx-auto bg-gradient-to-r from-[#E55A1B] to-[#0B3D91] p-3 rounded-full">
                    <ShieldCheck className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold mt-4">Coach Login</CardTitle>
                  <CardDescription>Access your team's match dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="trener@heimdal.no"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-[#0B3D91] hover:bg-[#0B3D91]/90 text-white" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Log In'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      <Toaster richColors />
    </>
  );
}