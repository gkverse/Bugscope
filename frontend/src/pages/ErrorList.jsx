import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Terminal,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Loader,
} from 'lucide-react';
import { GlassPanel } from '../components/GlassPanel';
import { Button } from '../components/ui/Button';
import { errorAPI } from '../api/api';

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const getStatus = (error) => {
  if (error.status === 'resolved' || error.status === 'ignored') return 'resolved';
  if (error.severity === 'critical' || error.severity === 'high') return 'critical';
  return 'warning';
};

const StatusIcon = ({ status }) => {
  if (status === 'critical') return <ShieldAlert className="text-error" size={16} />;
  if (status === 'warning') return <AlertTriangle className="text-yellow-400" size={16} />;
  return <CheckCircle className="text-tertiary" size={16} />;
};

const StatusBadge = ({ status }) => {
  const styles = {
    critical: 'bg-error/10 text-error border-error/20',
    warning: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    resolved: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  };
  return (
    <div
      className={`inline-flex px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold tracking-wider border ${styles[status]}`}
    >
      {status}
    </div>
  );
};

export const ErrorList = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const res = await errorAPI.getErrors();
        setErrors(res.data.errors || []);
      } catch (err) {
        setFetchError('Failed to load errors. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchErrors();
  }, []);

  const filtered = errors.filter(
    (e) =>
      e.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.environment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-10 max-w-6xl mx-auto h-full flex flex-col">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-display text-3xl font-bold mb-2">
            NEON_PULSE_ISSUES
          </h1>
          <p className="text-on-surface-variant text-sm">
            Real-time captured error sequences for forensic analysis.
          </p>
        </motion.div>

        <div className="flex gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
              size={16}
            />
            <input
              type="text"
              placeholder="Search traces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface-container-lowest border-b-2 border-outline-variant/30 text-white focus:outline-none focus:border-primary transition-colors text-sm w-64"
            />
          </div>
          <Button
            variant="secondary"
            className="gap-2 aspect-square p-0 w-10 flex items-center justify-center"
          >
            <Filter size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pr-2">

        {loading && (
          <div className="flex items-center justify-center h-40 gap-3 text-on-surface-variant">
            <Loader size={20} className="animate-spin text-primary" />
            <span>Loading error sequences...</span>
          </div>
        )}

        {fetchError && (
          <div className="text-error text-center mt-10 p-4 border border-error/20 rounded bg-error/5">
            {fetchError}
          </div>
        )}

        {!loading && !fetchError && filtered.length === 0 && (
          <div className="text-on-surface-variant text-center mt-10">
            No errors found. System is clean.
          </div>
        )}

        {!loading && !fetchError && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((error, idx) => {
              const status = getStatus(error);
              return (
                <motion.div
                  key={error._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
<Link to={`/app/errors/${error._id}`} className="block">
                    <GlassPanel
                      hoverEffect
                      className="p-4 flex items-center gap-6 border-l-2 !border-l-transparent hover:!border-l-primary transition-all"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-sm bg-surface-container flex items-center justify-center border border-outline-variant/10">
                        <StatusIcon status={status} />
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">

                        <div>
                          <div className="text-xs font-display tracking-widest text-primary mb-1 uppercase opacity-70">
                            {error._id.slice(-6).toUpperCase()}
                          </div>
                          <div className="font-medium text-white flex items-center gap-2">
                            <Terminal size={14} className="text-on-surface-variant" />
                            {error.message?.length > 30
                              ? error.message.slice(0, 30) + '...'
                              : error.message}
                          </div>
                        </div>

                        <div className="hidden md:block">
                          <div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">
                            Environment
                          </div>
                          <div className="text-sm text-on-surface font-mono">
                            {error.environment || 'production'}
                          </div>
                        </div>

                        <div className="hidden md:block">
                          <div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">
                            Occurrences
                          </div>
                          <div className="text-sm text-white font-mono">
                            {error.count}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-on-surface-variant mb-1">
                            {timeAgo(error.lastOccurrence || error.updatedAt)}
                          </div>
                          <StatusBadge status={status} />
                        </div>

                      </div>
                    </GlassPanel>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};