import React, { useState } from 'react';
import { useJira } from '../hooks/useJira';
import { getJiraConfig } from '../services/jira/config';
import { JiraMyself } from '../types/jira';
import { Settings, CheckCircle, XCircle, RefreshCw, LogOut, ShieldCheck } from 'lucide-react';

export const JiraSettings: React.FC = () => {
  const { testConnection, syncIssues, disconnect, loading, error, issues } = useJira();
  const [connectionResult, setConnectionResult] = useState<JiraMyself | null>(null);
  const config = getJiraConfig();

  const handleTest = async () => {
    const result = await testConnection();
    setConnectionResult(result);
  };

  const lastSync = issues && issues.length > 0
    ? new Date(Math.max(...issues.map(i => i.lastSync))).toLocaleString()
    : 'Never';

  return (
    <div className="bg-card border rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Settings className="text-primary" /> Jira Integration
        </h3>
        {connectionResult && (
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <CheckCircle size={16} /> Connected
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Jira URL</label>
          <div className="bg-secondary/30 p-2 rounded-lg text-sm break-all">{config.url}</div>
        </div>

        <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg flex items-start gap-3">
          <ShieldCheck className="text-primary shrink-0" size={20} />
          <div>
            <p className="text-xs font-bold text-primary uppercase">Secure Connection</p>
            <p className="text-[11px] text-muted-foreground">
              Your Jira Email and API Token are stored securely in Vercel Environment Variables and never exposed to the browser.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-sm flex items-center gap-2">
          <XCircle size={16} /> {error}
        </div>
      )}

      {connectionResult && (
        <div className="bg-green-50 border border-green-100 p-4 rounded-xl space-y-2">
          <p className="text-green-700 font-bold flex items-center gap-1">
            <CheckCircle size={18} /> Connected successfully
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 text-sm gap-y-1">
            <div>
              <span className="text-muted-foreground">Display Name:</span> {connectionResult.displayName}
            </div>
            <div>
              <span className="text-muted-foreground">Account ID:</span> {connectionResult.accountId}
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Email:</span> {connectionResult.emailAddress}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : null}
          Test Connection
        </button>
        <button
          onClick={syncIssues}
          disabled={loading}
          className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-bold border hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : null}
          Sync My Tasks
        </button>
        <button
          onClick={disconnect}
          className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm font-bold hover:bg-destructive/20 transition-colors flex items-center gap-2"
        >
          <LogOut size={16} /> Disconnect
        </button>
      </div>

      <div className="text-[10px] text-muted-foreground pt-2 border-t flex justify-between">
        <span>LAST SYNC: {lastSync}</span>
        <span>{issues?.length || 0} Issues Cached</span>
      </div>
    </div>
  );
};
