import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, User, LogIn, Loader2, Truck, Shield, Building2, Users, ClipboardList } from 'lucide-react';
import { useStore, UserRole } from '@/store/useStore';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const demoCredentials: { role: string; username: string; password: string; icon: typeof Shield }[] = [
  { role: 'Ultra Admin', username: 'ultraadmin', password: 'ultra123', icon: Shield },
  { role: 'Super Admin', username: 'superadmin', password: 'super123', icon: Building2 },
  { role: 'CO Office', username: 'cooffice', password: 'co123', icon: ClipboardList },
  { role: 'Admin', username: 'amit_mumbai', password: 'admin123', icon: Users },
];

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; auth?: string }>({});
  
  const { login, currentUser } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (currentUser?.isAuthenticated) {
    return <Navigate to={`/${currentUser.role}/dashboard`} replace />;
  }

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const result = login(username, password);
    
    if (result.success) {
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${username}`,
      });
      
      // Get the updated user to determine redirect
      const state = useStore.getState();
      const role = state.currentUser?.role;
      navigate(`/${role}/dashboard`);
    } else {
      setErrors({ auth: result.error });
      toast({
        title: 'Login failed',
        description: result.error,
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  const handleDemoLogin = async (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setIsLoading(true);
    setErrors({});
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const result = login(demoUsername, demoPassword);
    
    if (result.success) {
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${demoUsername}`,
      });
      
      const state = useStore.getState();
      const role = state.currentUser?.role;
      navigate(`/${role}/dashboard`);
    } else {
      setErrors({ auth: result.error });
      toast({
        title: 'Demo login failed',
        description: 'Please load sample data first from Ultra Admin',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AnimatedBackground />
      
      {/* Theme toggle in corner */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-8 flex flex-col items-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 animate-glow-pulse">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-gradient">Transport</span>
              <span className="text-muted-foreground">Pro</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage your transport data
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Auth error */}
            {errors.auth && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive"
              >
                {errors.auth}
              </motion.div>
            )}

            {/* Username field */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {errors.username && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-destructive"
                >
                  {errors.username}
                </motion.p>
              )}
            </motion.div>

            {/* Password field */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-destructive"
                >
                  {errors.password}
                </motion.p>
              )}
            </motion.div>

            {/* Submit button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="relative w-full overflow-hidden rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-70"
              >
                {isLoading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </motion.div>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Demo credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 space-y-3"
          >
            <p className="text-center text-xs text-muted-foreground">
              Quick login (load sample data from Ultra Admin first)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoCredentials.map((cred) => {
                const Icon = cred.icon;
                return (
                  <motion.button
                    key={cred.username}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDemoLogin(cred.username, cred.password)}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground disabled:opacity-50"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cred.role}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
