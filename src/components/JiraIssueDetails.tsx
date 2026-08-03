import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  ExternalLink,
  RefreshCw,
  User,
  Clock,
  Tag,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  History,
  Paperclip,
  GitBranch,
  Users,
  Activity,
  Link as LinkIcon,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Figma,
  Share2,
  Lock,
  Eye,
  ThumbsUp,
  ArrowUpRight,
  Timer,
  Play,
  Square,
  History as HistoryIcon,
  HardDrive,
  Terminal,
  Database,
  Hash
} from 'lucide-react';
import { jiraService } from '../services/jira/jiraService';
import { format, isValid, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface JiraIssueDetailsProps {
  issueKey: string;
  onBack: () => void;
}

export const JiraIssueDetails: React.FC<JiraIssueDetailsProps> = ({ issueKey, onBack }) => {
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [transitions, setTransitions] = useState<any[]>([]);

  // Timer state
  const activeActivity = useLiveQuery(
    () => db.activities.where('jiraKey').equals(issueKey).and(a => a.status === 'active').first(),
    [issueKey]
  );

  const fetchIssueDetails = useCallback(async () => {
    console.log(`[JiraDetails] Debug: Starting fetch for ${issueKey}`);
    setLoading(true);
    setError(null);
    try {
      const data = await jiraService.getIssue(issueKey);
      console.log('[JiraDetails] Raw API Response:', data);

      if (!data) {
        throw new Error('No data received from Jira API');
      }

      setIssue(data);
      setTransitions(data.transitions || []);
      setError(null);
    } catch (err: any) {
      console.error('[JiraDetails] Error in fetchIssueDetails:', err);
      setError(err.message || 'Failed to load issue details');
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    fetchIssueDetails();
  }, [fetchIssueDetails]);

  // ROBUST MODEL MAPPING
  const model = useMemo(() => {
    if (!issue) return null;

    console.log('[JiraDetails] Parsing Model from source:', issue.fields ? 'fields' : 'root');

    const f = issue.fields || {}; // Fallback to root if fields missing (though unlikely in standard Jira API)
    const names = issue.names || {};
    const rendered = issue.renderedFields || {};

    // Helper for custom fields
    const getCF = (name: string) => {
      const key = Object.keys(names).find(k => names[k].toLowerCase() === name.toLowerCase());
      return key ? f[key] : null;
    };

    try {
      return {
        key: issue.key || issueKey,
        summary: f.summary || 'No Summary',
        description: f.description || null,
        renderedDescription: rendered.description || null,
        status: f.status?.name || 'Unknown',
        statusCategory: f.status?.statusCategory?.name || 'indeterminate',
        priority: f.priority?.name || 'Medium',
        priorityIcon: f.priority?.iconUrl,
        issueType: f.issuetype?.name || 'Task',
        issueTypeIcon: f.issuetype?.iconUrl,
        project: f.project?.name || 'Unknown',
        projectKey: f.project?.key,

        assignee: f.assignee || null,
        reporter: f.reporter || null,
        creator: f.creator || null,

        created: f.created || null,
        updated: f.updated || null,
        duedate: f.duedate || null,

        labels: Array.isArray(f.labels) ? f.labels : [],
        components: Array.isArray(f.components) ? f.components : [],
        versions: Array.isArray(f.versions) ? f.versions : [],
        fixVersions: Array.isArray(f.fixVersions) ? f.fixVersions : [],

        storyPoints: getCF('Story Points') || getCF('Story Point Estimate') || null,
        sprint: getCF('Sprint'),
        epic: getCF('Epic Link') || f.parent || null,

        timeEstimate: f.timeestimate || 0,
        timeOriginalEstimate: f.timeoriginalestimate || 0,
        timeSpent: f.timespent || 0,

        comments: f.comment?.comments || [],
        renderedComments: rendered.comment?.comments || [],
        commentTotal: f.comment?.total || 0,

        attachments: Array.isArray(f.attachment) ? f.attachment : [],
        subtasks: Array.isArray(f.subtasks) ? f.subtasks : [],
        issuelinks: Array.isArray(f.issuelinks) ? f.issuelinks : [],

        watchers: issue.watchersData || { watchCount: 0, isWatching: false, watchers: [] },
        worklogs: issue.worklogsData?.worklogs || [],
        history: issue.changelog?.histories || [],
        remoteLinks: Array.isArray(issue.remoteLinks) ? issue.remoteLinks : [],

        raw: issue
      };
    } catch (e) {
      console.error('[JiraDetails] Parsing Error:', e);
      throw e;
    }
  }, [issue, issueKey]);

  const handleTransition = async (id: string) => {
    try {
      await jiraService.doTransition(issueKey, id);
      await fetchIssueDetails();
    } catch (err: any) {
      alert('Transition failed: ' + err.message);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const adfBody = {
        type: "doc",
        version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text: newComment }] }]
      };
      await jiraService.addComment(issueKey, adfBody);
      setNewComment('');
      await fetchIssueDetails();
    } catch (err: any) {
      alert('Comment failed: ' + err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const startTimer = async () => {
    if (!model) return;
    await db.activities.add({
      type: 'Feature Development',
      taskName: model.summary,
      project: model.project,
      startTime: new Date(),
      status: 'active',
      jiraKey: issueKey,
      jiraStatus: model.status,
      jiraType: model.issueType,
      priority: 'Medium',
      tags: []
    });
  };

  const stopTimer = async () => {
    if (!activeActivity) return;
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeActivity.startTime.getTime()) / 1000);
    await db.activities.update(activeActivity.id!, {
      endTime,
      duration: (activeActivity.duration || 0) + duration,
      status: 'completed'
    });
  };

  const renderAdf = (node: any): React.ReactNode => {
    if (!node) return null;
    if (Array.isArray(node)) return node.map((child, i) => <React.Fragment key={i}>{renderAdf(child)}</React.Fragment>);
    if (node.content && Array.isArray(node.content)) {
      const content = node.content.map((child: any, i: number) => <React.Fragment key={i}>{renderAdf(child)}</React.Fragment>);
      switch (node.type) {
        case 'doc': return <div className="space-y-3">{content}</div>;
        case 'paragraph': return <p className="min-h-[1.5em]">{content}</p>;
        case 'heading':
          const Tag = `h${node.attrs?.level || 1}` as any;
          return <Tag className="font-bold mt-4 mb-2">{content}</Tag>;
        case 'bulletList': return <ul className="list-disc pl-5 space-y-1">{content}</ul>;
        case 'orderedList': return <ol className="list-decimal pl-5 space-y-1">{content}</ol>;
        case 'listItem': return <li>{content}</li>;
        case 'blockquote': return <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2">{content}</blockquote>;
        case 'codeBlock': return <pre className="bg-secondary/50 p-3 rounded-lg overflow-x-auto font-mono text-sm my-2"><code>{content}</code></pre>;
        default: return content;
      }
    }
    if (node.type === 'text') {
      let element: React.ReactNode = node.text;
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          if (mark.type === 'strong') element = <strong className="font-bold">{element}</strong>;
          if (mark.type === 'em') element = <em className="italic">{element}</em>;
          if (mark.type === 'code') element = <code className="bg-secondary px-1 rounded font-mono text-sm">{element}</code>;
          if (mark.type === 'link') element = <a href={mark.attrs?.href} target="_blank" rel="noreferrer" className="text-primary hover:underline">{element}</a>;
        });
      }
      return element;
    }
    return null;
  };

  const figmaLinks = useMemo(() => {
    if (!model) return [];
    const links: string[] = [];
    const figmaRegex = /https:\/\/www\.figma\.com\/(file|proto|design)\/([a-zA-Z0-9]+)\/([^\s?#"]+)/g;

    // Check description
    const descString = JSON.stringify(model.description || '');
    const descMatches = descString.match(figmaRegex) || [];
    links.push(...descMatches.map(l => l.replace(/\\"/g, '')));

    // Check remote links
    model.remoteLinks.forEach((link: any) => {
      const url = link.object?.url || '';
      if (url.includes('figma.com')) links.push(url);
    });

    // Check comments
    const commentsString = JSON.stringify(model.comments || '');
    const commentMatches = commentsString.match(figmaRegex) || [];
    links.push(...commentMatches.map(l => l.replace(/\\"/g, '')));

    return Array.from(new Set(links));
  }, [model]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <RefreshCw size={40} className="text-primary animate-spin" />
      <p className="text-muted-foreground animate-pulse font-medium">Fetching comprehensive issue data...</p>
    </div>
  );

  if (error || !model) return (
    <div className="flex items-center justify-center h-[80vh] p-4">
      <div className="bg-destructive/10 border border-destructive/20 text-destructive p-8 rounded-3xl text-center max-w-md w-full">
        <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold mb-2">Sync Failed</h3>
        <p className="text-sm opacity-80 mb-8">{error}</p>
        <div className="flex flex-col gap-2">
          <button onClick={fetchIssueDetails} className="w-full py-3 bg-destructive text-white rounded-xl font-bold flex items-center justify-center gap-2"><RefreshCw size={18} /> Retry Sync</button>
          <button onClick={onBack} className="w-full py-3 bg-secondary text-foreground rounded-xl font-bold">Back to Dashboard</button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText size={16} /> },
    { id: 'comments', label: `Comments (${model.commentTotal})`, icon: <MessageSquare size={16} /> },
    { id: 'activity', label: 'Activity & History', icon: <Activity size={16} /> },
    { id: 'attachments', label: `Attachments (${model.attachments.length})`, icon: <Paperclip size={16} /> },
    { id: 'people', label: 'People', icon: <Users size={16} /> },
    { id: 'worklogs', label: 'Worklogs', icon: <Clock size={16} /> },
    { id: 'debug', label: 'Dev Debug', icon: <Terminal size={16} /> },
  ];

  const estimationSeconds = model.timeOriginalEstimate || (typeof model.storyPoints === 'number' ? model.storyPoints * 3600 * 8 : 0);
  const elapsedSeconds = (activeActivity?.duration || 0) + (activeActivity ? Math.floor((new Date().getTime() - activeActivity.startTime.getTime()) / 1000) : 0);
  const consumedPercent = estimationSeconds > 0 ? (elapsedSeconds / estimationSeconds) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
      {/* Timer Alert */}
      {consumedPercent >= 80 && (
        <div className={cn(
          "px-4 py-2 text-center text-xs font-bold uppercase tracking-widest animate-pulse",
          consumedPercent >= 100 ? "bg-red-500 text-white" : consumedPercent >= 90 ? "bg-orange-500 text-white" : "bg-yellow-500 text-black"
        )}>
          {consumedPercent >= 100 ? "Estimation Exceeded!" : `Warning: ${Math.floor(consumedPercent)}% estimation consumed`}
        </div>
      )}

      <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-background/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onBack} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X size={20} /></button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              {model.issueTypeIcon && <img src={model.issueTypeIcon} alt="" className="w-4 h-4" />}
              <span className="font-mono text-xs font-bold bg-secondary px-2 py-1 rounded">{model.key}</span>
            </div>
            <h1 className="text-lg font-bold truncate">{model.summary}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activeActivity ? (
            <button onClick={stopTimer} className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg animate-pulse">
              <Square size={14} fill="currentColor" /> Stop Timer
            </button>
          ) : (
            <button onClick={startTimer} className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-bold shadow-lg hover:bg-green-600 transition-colors">
              <Play size={14} fill="currentColor" /> Start Timer
            </button>
          )}
          <button onClick={fetchIssueDetails} className="p-2 hover:bg-secondary rounded-lg transition-colors"><RefreshCw size={18} /></button>
          {import.meta.env.VITE_JIRA_URL && (
            <a href={`${import.meta.env.VITE_JIRA_URL}/browse/${model.key}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow-sm">
              <ExternalLink size={14} /> Open in Jira
            </a>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex gap-1 border-b pb-px overflow-x-auto no-scrollbar sticky top-0 bg-background z-10">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative shrink-0",
                    activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.icon} {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Description</h3>
                      {model.renderedDescription ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none bg-card border p-6 rounded-3xl" dangerouslySetInnerHTML={{ __html: model.renderedDescription }} />
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none bg-card border p-6 rounded-3xl">
                          {model.description ? renderAdf(model.description) : <p className="italic text-muted-foreground">No description provided.</p>}
                        </div>
                      )}
                    </section>

                    {figmaLinks.length > 0 && (
                      <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2"><Figma size={14} className="text-[#F24E1E]" /> Figma Designs</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {figmaLinks.map((link, i) => (
                            <a key={i} href={link} target="_blank" rel="noreferrer" className="flex flex-col p-4 bg-card border rounded-2xl hover:border-primary/50 transition-all group shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 bg-[#F24E1E]/10 rounded-lg flex items-center justify-center"><Figma size={18} className="text-[#F24E1E]" /></div>
                                <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <span className="font-bold text-sm truncate">Design File {i + 1}</span>
                              <span className="text-xs text-muted-foreground truncate">{link}</span>
                            </a>
                          ))}
                        </div>
                      </section>
                    )}

                    {model.subtasks.length > 0 && (
                      <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Subtasks</h3>
                        <div className="space-y-2">
                          {model.subtasks.map((st: any) => (
                            <div key={st.id} className="flex items-center justify-between p-3 bg-card border rounded-xl hover:bg-secondary/20 cursor-pointer transition-colors group">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-[10px] font-bold opacity-60 bg-secondary px-1.5 py-0.5 rounded">{st.key}</span>
                                <span className="text-sm font-medium">{st.fields?.summary}</span>
                              </div>
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-secondary rounded-full">{st.fields?.status?.name}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {/* COMMENTS */}
                {activeTab === 'comments' && (
                  <div className="space-y-6">
                    <div className="bg-card border rounded-3xl p-4 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <textarea placeholder="Add a comment..." className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none min-h-[100px]" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                      <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <div className="flex gap-2">
                          <button className="p-1.5 hover:bg-secondary rounded text-muted-foreground"><Paperclip size={16} /></button>
                          <button className="p-1.5 hover:bg-secondary rounded text-muted-foreground"><User size={16} /></button>
                        </div>
                        <button onClick={handleAddComment} disabled={!newComment.trim() || isSubmittingComment} className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-2">
                          {isSubmittingComment ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />} Comment
                        </button>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {model.comments.map((comment: any, idx: number) => (
                        <div key={comment.id} className="flex gap-4">
                          <div className="shrink-0">
                            {comment.author?.avatarUrls?.['48x48'] ? <img src={comment.author.avatarUrls['48x48']} alt="" className="w-10 h-10 rounded-full shadow-sm" /> : <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">{comment.author?.displayName?.charAt(0)}</div>}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm">{comment.author?.displayName}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">{format(new Date(comment.created), 'MMM d, yyyy HH:mm')}</span>
                            </div>
                            {model.renderedComments[idx] ? (
                              <div className="bg-secondary/10 p-4 rounded-2xl border text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: model.renderedComments[idx].body }} />
                            ) : (
                              <div className="bg-secondary/10 p-4 rounded-2xl border text-sm leading-relaxed">{renderAdf(comment.body)}</div>
                            )}
                          </div>
                        </div>
                      )).reverse()}
                    </div>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-8">
                    <div className="space-y-6 pl-4 border-l-2 border-secondary/50 ml-2 py-4">
                      {model.history.map((history: any) => (
                        <div key={history.id} className="relative">
                          <div className="absolute -left-[25px] top-1 w-4 h-4 bg-background border-2 border-primary rounded-full" />
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{history.author?.displayName}</span>
                              <span className="text-[10px] text-muted-foreground font-bold">{format(new Date(history.created), 'MMM d, HH:mm')}</span>
                            </div>
                            <div className="space-y-1">
                              {history.items?.map((item: any, i: number) => (
                                <div key={i} className="text-xs text-foreground/80 bg-secondary/10 p-2 rounded-xl inline-flex flex-wrap gap-x-2 items-center">
                                  <span>Changed <span className="font-bold">{item.field}</span></span>
                                  {item.fromString && <><span className="opacity-50 line-through">{item.fromString}</span><ChevronRight size={10} className="opacity-30" /></>}
                                  <span className="font-bold text-primary">{item.toString}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )).reverse()}
                    </div>
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {model.attachments.map((att: any) => (
                      <div key={att.id} className="group bg-card border rounded-2xl overflow-hidden hover:border-primary/50 transition-all shadow-sm">
                        <div className="aspect-video bg-secondary/30 flex items-center justify-center relative">
                          {att.mimeType?.startsWith('image/') ? <img src={att.content} className="w-full h-full object-cover" alt="" /> : <FileText size={32} className="text-muted-foreground" />}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a href={att.content} target="_blank" rel="noreferrer" className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md"><Eye size={18} /></a>
                            <a href={att.content} download className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md"><Paperclip size={18} /></a>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-bold truncate">{att.filename}</p>
                          <p className="text-[10px] text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'people' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Primary Roles</h3>
                      <div className="space-y-4">
                        {[
                          { label: 'Assignee', user: model.assignee },
                          { label: 'Reporter', user: model.reporter },
                          { label: 'Creator', user: model.creator }
                        ].map(role => (
                          <div key={role.label} className="flex items-center gap-4 p-4 bg-card border rounded-3xl shadow-sm">
                            <div className="shrink-0">
                              {role.user?.avatarUrls?.['48x48'] ? <img src={role.user.avatarUrls['48x48']} className="w-12 h-12 rounded-full border-2 border-primary/10" alt="" /> : <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold">?</div>}
                            </div>
                            <div>
                              <p className="font-bold">{role.user?.displayName || 'Unassigned'}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{role.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Watchers ({model.watchers.watchCount})</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {model.watchers.watchers?.map((w: any) => (
                          <div key={w.accountId} className="flex items-center gap-3 p-3 bg-secondary/10 rounded-2xl">
                            <img src={w.avatarUrls?.['24x24']} className="w-6 h-6 rounded-full" alt="" />
                            <span className="text-sm font-medium">{w.displayName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'worklogs' && (
                  <div className="space-y-6">
                    {model.worklogs.map((wl: any) => (
                      <div key={wl.id} className="flex gap-4 p-4 bg-card border rounded-2xl shadow-sm">
                        <img src={wl.author?.avatarUrls?.['48x48']} className="w-10 h-10 rounded-full" alt="" />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-sm">{wl.author?.displayName}</span>
                            <span className="text-xs font-bold text-primary">{wl.timeSpent}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-2">{format(new Date(wl.started), 'MMM d, yyyy')}</p>
                          <div className="text-sm text-foreground/80">{renderAdf(wl.comment)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'debug' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-card border p-4 rounded-2xl"><p className="text-[10px] font-bold text-muted-foreground uppercase">Fetch Time</p><p className="text-xl font-bold">{model.raw._metadata?.fetchTimeMs}ms</p></div>
                      <div className="bg-card border p-4 rounded-2xl"><p className="text-[10px] font-bold text-muted-foreground uppercase">Response Size</p><p className="text-xl font-bold">{(JSON.stringify(model.raw).length / 1024).toFixed(1)} KB</p></div>
                      <div className="bg-card border p-4 rounded-2xl"><p className="text-[10px] font-bold text-muted-foreground uppercase">Mapped Fields</p><p className="text-xl font-bold">{Object.keys(model).length}</p></div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold flex items-center gap-2"><Terminal size={16} /> Raw JSON</h4>
                      <pre className="bg-zinc-950 text-zinc-400 p-6 rounded-3xl overflow-auto max-h-[600px] text-[10px] font-mono border border-zinc-800 shadow-2xl">
                        {JSON.stringify(model.raw, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <aside className="w-full lg:w-80 border-l bg-card/30 overflow-y-auto p-6 space-y-10 backdrop-blur-sm">
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</h3>
            <div className="relative group">
              <button className="w-full flex items-center justify-between p-4 bg-card border-2 border-primary/10 rounded-2xl hover:bg-secondary/20 transition-all font-bold text-sm shadow-sm">
                <span className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", model.statusCategory === 'done' ? 'bg-green-500' : model.statusCategory === 'indeterminate' ? 'bg-blue-500' : 'bg-zinc-400')} />
                  {model.status}
                </span>
                <ChevronDown size={16} className="text-muted-foreground transition-transform group-focus-within:rotate-180" />
              </button>
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all z-30 translate-y-2 group-focus-within:translate-y-0">
                {transitions.length > 0 ? transitions.map((t: any) => (
                  <button key={t.id} onClick={() => handleTransition(t.id)} className="w-full text-left px-5 py-3 text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-colors border-b last:border-0 border-secondary/50">{t.name}</button>
                )) : <div className="p-4 text-xs italic text-muted-foreground">No available transitions.</div>}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Attributes</h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><AlertCircle size={14} /> Priority</span>
                <span className="font-bold flex items-center gap-2">{model.priorityIcon && <img src={model.priorityIcon} className="w-4 h-4" alt="" />}{model.priority}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Tag size={14} /> Labels</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                  {model.labels.length > 0 ? model.labels.map((l: string) => <span key={l} className="text-[9px] font-bold px-2 py-0.5 bg-secondary rounded-full border border-border/50">{l}</span>) : <span className="text-xs text-muted-foreground italic">None</span>}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Clock size={14} /> Story Points</span>
                <span className="font-bold">{model.storyPoints || <span className="text-muted-foreground italic font-normal text-xs">Unestimated</span>}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar size={14} /> Due Date</span>
                <span className="font-bold">{model.duedate ? format(new Date(model.duedate), 'MMM d, yyyy') : <span className="text-muted-foreground italic font-normal text-xs">Not set</span>}</span>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Time Tracking</h3>
            <div className="bg-secondary/10 rounded-2xl p-4 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground"><span>Estimation</span><span>{model.timeOriginalEstimate ? `${(model.timeOriginalEstimate / 3600).toFixed(1)}h` : '0h'}</span></div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: model.timeOriginalEstimate ? '100%' : '0%' }} /></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground"><span>Elapsed (Local)</span><span>{Math.floor(elapsedSeconds / 3600)}h {Math.floor((elapsedSeconds % 3600) / 60)}m</span></div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden"><div className={cn("h-full", consumedPercent >= 100 ? "bg-red-500" : consumedPercent >= 90 ? "bg-orange-500" : "bg-green-500")} style={{ width: `${Math.min(consumedPercent, 100)}%` }} /></div>
              </div>
            </div>
          </section>

          <section className="pt-6 border-t space-y-3">
            <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest text-muted-foreground"><span>Created</span><span>{model.created ? format(new Date(model.created), 'MMM d, yyyy') : 'Unknown'}</span></div>
            <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest text-muted-foreground"><span>Updated</span><span>{model.updated ? format(new Date(model.updated), 'MMM d, yyyy') : 'Unknown'}</span></div>
          </section>
        </aside>
      </div>
    </div>
  );
};
