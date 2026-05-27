import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../components/GlassPanel';
import { Button } from '../components/ui/Button';
import { UserPlus, Shield, MoreVertical, Loader, X, Mail } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const Team = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/users?projectId=project1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(res.data.data || []);
      } catch (err) {
        setError('Failed to load team members. You may not have permission.');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }

    try {
      setInviteLoading(true);
      setInviteError(null);
      setInviteSuccess(null);

      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/invitations/send`,
        {
          email: inviteEmail,
          projectId: 'project1',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setInviteSuccess(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteSuccess(null);
        }, 2000);
      }
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-xl"
        >
          <h1 className="text-display text-3xl font-bold mb-2">
            Team Forensic Unit
          </h1>
          <p className="text-on-surface-variant">
            Authorize and manage personnel within the forensics environment.
            Control access levels, monitor operator status, and verify clearance
            protocols across the dashboard nodes.
          </p>
        </motion.div>

        <Button
          onClick={() => setShowInviteModal(true)}
          className="gap-2"
        >
          <UserPlus size={16} />
          EXPAND UNIT ACCESS
        </Button>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowInviteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-8 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-display text-xl font-bold text-white">
                Invite Team Member
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-on-surface-variant hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase font-display tracking-widest text-on-surface-variant mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                  <input
                    type="email"
                    placeholder="newmember@bugscope.com"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      setInviteError(null);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/30 text-white rounded-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {inviteError && (
                <div className="text-error text-sm bg-error/10 border border-error/20 rounded p-2">
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="text-tertiary text-sm bg-tertiary/10 border border-tertiary/20 rounded p-2">
                  ✓ {inviteSuccess}
                </div>
              )}

              <Button type="submit" disabled={inviteLoading} fullWidth className="mt-2">
                {inviteLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader size={14} className="animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Member Table */}
      <GlassPanel className="p-0 border-outline-variant/30 mb-8">
        <div className="p-6 border-b border-outline-variant/20">
          <h2 className="text-display text-xl font-bold text-white">
            Member Access Control
          </h2>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-on-surface-variant">
            <Loader size={20} className="animate-spin text-primary" />
            <span>Loading team members...</span>
          </div>
        )}

        {error && (
          <div className="text-error text-center py-8 text-sm px-6">
            {error}
          </div>
        )}

        {!loading && !error && members.length === 0 && (
          <div className="text-on-surface-variant text-center py-8 text-sm">
            No team members found.
          </div>
        )}

        {!loading && !error && members.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                  <th className="px-6 py-4 text-xs font-display tracking-widest uppercase text-on-surface-variant">
                    User
                  </th>
                  <th className="px-6 py-4 text-xs font-display tracking-widest uppercase text-on-surface-variant">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-display tracking-widest uppercase text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-display tracking-widest uppercase text-on-surface-variant text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {members.map((member, idx) => (
                  <motion.tr
                    key={member._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border-b border-outline-variant/10 last:border-0 transition-colors hover:bg-surface-container/40"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {member.name}
                      </div>
                      <div className="text-sm font-mono text-on-surface-variant/70 mt-1">
                        {member.email}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-surface-container-highest border border-outline-variant/20 text-sm">
                        {member.role === 'admin' && (
                          <Shield size={12} className="text-tertiary" />
                        )}
                        <span
                          className={
                            member.role === 'admin'
                              ? 'text-tertiary'
                              : 'text-on-surface'
                          }
                        >
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs uppercase tracking-wider font-semibold ${
                          member.isActive
                            ? 'text-primary'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => alert('Managing: ' + member.name)}
                        className="text-primary hover:text-primary-container transition-colors mr-4"
                      >
                        Manage
                      </button>
                      <button className="p-2 hover:bg-surface-container rounded-sm text-on-surface-variant hover:text-white transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {/* Global Protocols */}
      <GlassPanel className="p-6">
        <h3 className="text-display text-xl font-bold text-white mb-4">
          Global Protocols
        </h3>
        <h4 className="text-md font-medium text-primary mb-2">
          Deployment Rights
        </h4>
        <p className="text-on-surface-variant text-sm max-w-3xl leading-relaxed">
          Only admins can manage team members and change roles. Contributors
          have read-only access to error logs and cannot modify team settings.
        </p>
      </GlassPanel>

    </div>
  );
};