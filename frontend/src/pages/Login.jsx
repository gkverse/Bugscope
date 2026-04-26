import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, GitBranch, Mail, Loader } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { authAPI } from '../api/api';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    try {
      const response = await authAPI.login(email, password);
      
      // Store token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Navigate to dashboard
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
      console.error('Login error:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Neon Pulse Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-[100%] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-fuchsia-600/10 blur-[80px] rounded-[100%] translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 z-10">
        
        {/* Left Side: Hero Text */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 space-y-6"
        >
          <div className="mb-4">
             <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-display text-sm tracking-wide">
               <Activity size={16} /> _ system_heartbeat: nominal
             </div>
             <h1 className="text-display text-5xl font-extrabold text-white leading-tight">
               Forensic-grade error analysis for the modern stack.
             </h1>
          </div>
          <p className="text-xl text-on-surface-variant font-light max-w-xl">
             Access your secure terminal to begin deep-packet inspection and real-time trace analysis.
          </p>
          <div className="mt-8 bg-surface-container-lowest border border-outline-variant/20 p-6 rounded-sm font-mono text-sm leading-relaxed max-w-xl shadow-2xl">
             <span className="text-purple-400">async function</span> <span className="text-blue-300">initForensicProbe</span>(target) {'{'}<br/>
             &nbsp;&nbsp;<span className="text-purple-400">const</span> trace = <span className="text-primary">await</span> BugScope.<span className="text-blue-300">capture</span>(target);<br/>
             &nbsp;&nbsp;<span className="text-on-surface-variant/50">// Analyzing latent memory leaks...</span><br/>
             &nbsp;&nbsp;<span className="text-primary">if</span> (trace.severity === <span className="text-green-300">'CRITICAL'</span>) {'{'}<br/>
             &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">return new</span> <span className="text-yellow-200">DiagnosticReport</span>({'{'}<br/>
             &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;origin: trace.source,<br/>
             &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;timestamp: <span className="text-yellow-200">Date</span>.<span className="text-blue-300">now</span>(),<br/>
             &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;status: <span className="text-green-300">'IDENTIFIED'</span><br/>
             &nbsp;&nbsp;&nbsp;&nbsp;{'}'});<br/>
             &nbsp;&nbsp;{'}'}<br/>
             {'}'}
          </div>
        </motion.div>

        {/* Right Side: Auth Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="max-w-md w-full space-y-8"
        >
          <div className="bg-surface-container-high/60 backdrop-blur-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(168,85,247,0.1)] rounded-xl p-8">
          
            <div className="text-center mb-8">
              <h2 className="text-display text-2xl font-extrabold text-white">
                Terminal Access: Authenticate.
              </h2>
              <p className="mt-2 text-center text-sm text-primary">
                Awaiting valid credentials
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                {error}
              </div>
            )}

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-display tracking-widest text-purple-200/70 uppercase">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 text-white p-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-on-surface-variant/30"
                  placeholder="architect@company.com"
                  required
                  disabled={isAuthenticating}
                />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-display tracking-widest text-purple-200/70 uppercase">Master Password</label>
                  <a href="#" className="font-medium text-xs text-fuchsia-400 hover:text-fuchsia-300">Recover?</a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 text-white p-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-on-surface-variant/30"
                  placeholder="••••••••••••"
                  required
                  disabled={isAuthenticating}
                />
              </div>
            </div>

            <div>
              <Button disabled={isAuthenticating} type="submit" fullWidth className="bg-[image:linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] shadow-[0_0_15px_rgba(216,180,254,0.3)] hover:shadow-[0_0_25px_rgba(216,180,254,0.5)] border-0 h-12 text-base gap-2">
                {isAuthenticating ? <Loader className="animate-spin" size={18} /> : 'Authenticate'}
              </Button>
            </div>
            
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-on-surface-variant/50">Or authenticate with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => alert('Launching GitHub OAuth flow...')} variant="secondary" className="border-purple-500/20 hover:bg-purple-500/10 w-full gap-2 text-purple-200">
                <GitBranch size={18} />
                GitHub
              </Button>
              <Button onClick={() => alert('Launching Google OAuth flow...')} variant="secondary" className="border-purple-500/20 hover:bg-purple-500/10 w-full gap-2 text-purple-200">
                <Mail size={18} />
                Google
              </Button>
            </div>
          </form>
          
            <div className="mt-8 text-center text-sm">
              <span className="text-on-surface-variant">New deployment? </span>
              <Link to="/signup" className="text-fuchsia-400 font-medium hover:text-fuchsia-300 hover:underline">
                Create Forensic Account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};