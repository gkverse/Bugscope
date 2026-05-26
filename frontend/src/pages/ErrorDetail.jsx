import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Server,
  Code2,
  AlertOctagon,
  Activity,
  Loader,
  MessageSquare,
  Send,
} from 'lucide-react';
import { GlassPanel } from '../components/GlassPanel';
import { Button } from '../components/ui/Button';
import { errorAPI, commentAPI } from '../api/api';

const getStatusBadgeStyle = (severity) => {
  if (severity === 'critical' || severity === 'high')
    return 'bg-error/10 text-error border-error/20';
  if (severity === 'medium')
    return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
  return 'bg-tertiary/10 text-tertiary border-tertiary/20';
};

const getStatusTextStyle = (status) => {
  if (status === 'resolved') return 'text-tertiary border-tertiary/30';
  if (status === 'investigating') return 'text-yellow-400 border-yellow-400/30';
  return 'text-error border-error/30';
};

export const ErrorDetail = () => {
  const { id } = useParams();

  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await errorAPI.getErrorDetails(id);
        const data = res.data.data;
        setError(data.error);
        setComments(data.comments?.data || []);
        if (data.error?.aiExplanation) {
          setAiResult({
            explanation: data.error.aiExplanation,
            fixes: data.error.suggestedFixes || [],
          });
        }
      } catch (err) {
        console.error('Failed to fetch error details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleExplain = async () => {
    try {
      setAiLoading(true);
      const res = await errorAPI.explainError(id);
      setAiResult({
        explanation: res.data.explanation,
        fixes: res.data.suggestedFixes || [],
      });
    } catch (err) {
      console.error('AI explanation failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      setCommentLoading(true);
      const res = await commentAPI.addComment(id, newComment);
      setComments((prev) => [res.data.comment, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-3 text-on-surface-variant">
        <Loader size={24} className="animate-spin text-primary" />
        <span>Loading error data...</span>
      </div>
    );
  }

  if (!error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-error">Error not found.</p>
        <Link to="/app/errors">
          <Button variant="secondary">Back to Error Logs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto flex flex-col h-full overflow-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between border-b border-outline-variant/30 pb-6 mb-8"
      >
        <div className="flex items-center gap-4">
          <Link to="/app/errors">
            <Button variant="secondary" className="px-3">
              <ArrowLeft size={18} />
            </Button>
          </Link>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-display text-2xl font-bold">
                {error.message}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold tracking-wider border inline-flex items-center gap-1 ${getStatusBadgeStyle(error.severity)}`}
              >
                <AlertOctagon size={10} />
                {error.severity}
              </span>
            </div>

            <div className="text-xs font-mono text-on-surface-variant flex gap-4">
              <span className="flex items-center gap-1">
                <Server size={12} /> {error.environment}
              </span>
              <span className="flex items-center gap-1 text-primary">
                <Clock size={12} /> {new Date(error.createdAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                Occurrences:
                <strong className="text-white ml-1">{error.count}</strong>
              </span>
            </div>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-sm text-xs uppercase font-bold border ${getStatusTextStyle(error.status)}`}
        >
          {error.status}
        </span>
      </motion.div>

      {/* Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 flex flex-col gap-6"
        >

          {/* Stack Trace */}
          <GlassPanel className="p-0 border-outline-variant/30 flex flex-col bg-surface-container-lowest">
            <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
              <h3 className="text-display text-sm font-semibold flex items-center gap-2">
                <Code2 size={16} className="text-primary" />
                Stack Trace
              </h3>
              <span className="text-xs font-mono text-on-surface-variant bg-surface px-2 py-1 rounded-sm border border-outline-variant/20">
                {error.environment}
              </span>
            </div>

            <div className="p-6 overflow-auto font-mono text-sm leading-relaxed text-on-surface-variant/90 max-h-72">
              <div className="text-error mb-4 font-bold bg-error/5 p-3 rounded-sm border border-error/10">
                {error.message}
              </div>
              <pre className="whitespace-pre-wrap font-mono">
                {(error.stack || 'No stack trace available').split('\n').map((line, i) => (
                  <div
                    key={i}
                    className={`py-0.5 ${
                      line.trim().startsWith('at ')
                        ? 'text-on-surface-variant'
                        : 'text-white'
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </pre>
            </div>
          </GlassPanel>

          {/* Comments */}
          <GlassPanel className="p-0 border-outline-variant/30">
            <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant/20">
              <h3 className="text-display text-sm font-semibold flex items-center gap-2">
                <MessageSquare size={16} className="text-primary" />
                Comments ({comments.length})
              </h3>
            </div>

            <div className="p-4 flex flex-col gap-4">

              {/* Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 text-white text-sm focus:outline-none focus:border-primary transition-colors rounded-sm"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={commentLoading}
                  className="px-3"
                >
                  {commentLoading
                    ? <Loader size={16} className="animate-spin" />
                    : <Send size={16} />
                  }
                </Button>
              </div>

              {/* List */}
              {comments.length === 0 ? (
                <p className="text-on-surface-variant text-sm text-center py-4">
                  No comments yet.
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c._id}
                    className="border border-outline-variant/20 rounded-sm p-3 bg-surface-container-lowest"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-primary">
                        {c.authorName || c.author}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface">{c.content}</p>
                  </div>
                ))
              )}

            </div>
          </GlassPanel>

        </motion.div>

        {/* Right Column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-6"
        >

          {/* Metadata */}
          <GlassPanel className="p-0 border-outline-variant/30">
            <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant/20">
              <h3 className="text-display text-sm font-semibold">
                Subject_Intelligence
              </h3>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[
                ['Severity',    error.severity],
                ['Priority',    error.priority],
                ['Status',      error.status],
                ['Environment', error.environment],
                ['Occurrences', error.count],
                ['First Seen',  new Date(error.createdAt).toLocaleDateString()],
                ['Last Seen',   new Date(error.updatedAt).toLocaleDateString()],
              ].map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-col border-b border-outline-variant/10 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-[10px] uppercase font-display tracking-widest text-on-surface-variant mb-1">
                    {key}
                  </span>
                  <span className="font-mono text-sm text-white break-all">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* AI Analysis */}
          <GlassPanel className="p-6 flex flex-col items-center text-center bg-[image:linear-gradient(180deg,var(--color-surface-container),var(--color-surface-container-lowest))]">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(30,149,242,0.2)]">
              <Activity className="text-primary" size={28} />
            </div>

            <h4 className="text-display font-medium text-lg mb-2">
              Automated RCA Analysis
            </h4>

            {aiResult ? (
              <div className="text-left w-full mt-2">
                <p className="text-sm text-on-surface-variant mb-3 leading-relaxed">
                  {aiResult.explanation}
                </p>
                {aiResult.fixes?.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-primary mb-2">
                      Suggested Fixes
                    </p>
                    <ul className="space-y-1">
                      {aiResult.fixes.map((fix, i) => (
                        <li
                          key={i}
                          className="text-xs text-on-surface-variant border border-outline-variant/20 rounded-sm p-2"
                        >
                          {fix}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                  BugScope AI will analyze this error and suggest root cause fixes.
                </p>
                <Button
                  onClick={handleExplain}
                  disabled={aiLoading}
                  fullWidth
                  variant="secondary"
                  className="border-primary/20 text-primary hover:bg-primary/10"
                >
                  {aiLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader size={14} className="animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    'Trigger Deep Analysis'
                  )}
                </Button>
              </>
            )}
          </GlassPanel>

        </motion.div>
      </div>
    </div>
  );
};