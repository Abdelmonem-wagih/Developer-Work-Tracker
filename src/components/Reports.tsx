import React, { useState } from 'react';
import { FileText, Download, FileJson, Table as TableIcon, FileSpreadsheet, Loader2, Trash2, FileCode } from 'lucide-react';
import { db, Activity, Blocker } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export const Reports = () => {
  const [isExporting, setIsExporting] = useState(false);

  const activities = useLiveQuery(() => db.activities.orderBy('startTime').reverse().toArray());
  const blockers = useLiveQuery(() => db.blockers.orderBy('startTime').reverse().toArray());

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportToJSON = async () => {
    setIsExporting(true);
    try {
      const allActivities = await db.activities.toArray();
      const allBlockers = await db.blockers.toArray();
      const now = new Date();

      const formattedActivities = allActivities.map(a => ({
        ...a,
        startTime: `${formatDate(a.startTime)} ${formatTime(a.startTime)}`,
        endTime: a.endTime ? `${formatDate(a.endTime)} ${formatTime(a.endTime)}` : null,
        duration: formatDuration(a.duration || 0)
      }));

      const formattedBlockers = allBlockers.map(b => ({
        ...b,
        startTime: `${formatDate(b.startTime)} ${formatTime(b.startTime)}`,
        endTime: b.endTime ? `${formatDate(b.endTime)} ${formatTime(b.endTime)}` : null,
        duration: formatDuration(b.duration || 0)
      }));

      const data = {
        metadata: {
          reportTitle: "Developer Work Report",
          generatedDate: formatDate(now),
          generatedTime: formatTime(now),
          createdBy: "Abdelmonuem Wagih"
        },
        data: {
          activities: formattedActivities,
          blockers: formattedBlockers,
        }
      };

      downloadFile(JSON.stringify(data, null, 2), `work-tracker-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const allActivities = await db.activities.toArray();
      const allBlockers = await db.blockers.toArray();
      const now = new Date();

      let csvContent = "REPORT INFORMATION\n";
      csvContent += `Report Name,Developer Work Report\n`;
      csvContent += `Generated Date,${formatDate(now)}\n`;
      csvContent += `Generated Time,${formatTime(now)}\n`;
      csvContent += `Created By,Abdelmonuem Wagih\n\n`;

      csvContent += "TYPE,TASK/REASON,PROJECT/TEAM,JIRA KEY,JIRA STATUS,PRIORITY,CATEGORY/IMPACT,START DATE,START TIME,END DATE,END TIME,DURATION,NOTES\n";

      allActivities.forEach(a => {
        csvContent += `Activity,"${a.taskName}","${a.project}","${a.jiraKey || ''}","${a.jiraStatus || ''}","${a.priority}",${a.type},${formatDate(a.startTime)},${formatTime(a.startTime)},${a.endTime ? formatDate(a.endTime) : ''},${a.endTime ? formatTime(a.endTime) : ''},"${formatDuration(a.duration || 0)}","${a.notes || ''}"\n`;
      });

      allBlockers.forEach(b => {
        csvContent += `Blocker,"${b.reason}","${b.team}","","","${b.impact}",${b.impact},${formatDate(b.startTime)},${formatTime(b.startTime)},${b.endTime ? formatDate(b.endTime) : ''},${b.endTime ? formatTime(b.endTime) : ''},"${formatDuration(b.duration || 0)}","${b.notes || ''}"\n`;
      });

      downloadFile(csvContent, `work-report-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToMarkdown = async () => {
    setIsExporting(true);
    try {
      const allActivities = await db.activities.toArray();
      const allBlockers = await db.blockers.toArray();
      const now = new Date();

      const totalWorkSec = allActivities.reduce((acc, curr) => acc + (curr.duration || 0), 0);
      const totalBlockSec = allBlockers.reduce((acc, curr) => acc + (curr.duration || 0), 0);

      let md = `# Developer Work Report\n\n`;
      md += `**Generated Date:** ${formatDate(now)}\n`;
      md += `**Generated Time:** ${formatTime(now)}\n`;
      md += `**Created By:** Abdelmonuem Wagih\n\n`;

      md += `## Summary\n\n`;
      md += `- **Total Working Time:** ${formatDuration(totalWorkSec)}\n`;
      md += `- **Total Blocked Time:** ${formatDuration(totalBlockSec)}\n`;
      md += `- **Activities:** ${allActivities.length}\n`;
      md += `- **Blockers:** ${allBlockers.length}\n\n`;

      md += `## Activity Timeline\n\n`;
      md += `| Task | Project | Start | End | Duration |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      allActivities.forEach(a => {
        md += `| ${a.taskName} | ${a.project} | ${formatTime(a.startTime)} | ${a.endTime ? formatTime(a.endTime) : '-'} | ${formatDuration(a.duration || 0)} |\n`;
      });
      md += `\n`;

      md += `## Blockers\n\n`;
      md += `| Team | Reason | Start | End | Duration |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      allBlockers.forEach(b => {
        md += `| ${b.team} | ${b.reason} | ${formatTime(b.startTime)} | ${b.endTime ? formatTime(b.endTime) : '-'} | ${formatDuration(b.duration || 0)} |\n`;
      });
      md += `\n`;

      md += `## Statistics\n\n`;
      md += `- **Total Activities:** ${allActivities.length}\n`;
      md += `- **Total Blockers:** ${allBlockers.length}\n`;
      md += `- **Working Time:** ${formatDuration(totalWorkSec)}\n`;
      md += `- **Blocked Time:** ${formatDuration(totalBlockSec)}\n`;

      downloadFile(md, `daily-report-${new Date().toISOString().split('T')[0]}.md`, 'text/markdown');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (confirm("CRITICAL ACTION: This will PERMANENTLY DELETE ALL activities and blockers. This cannot be undone. Are you absolutely sure?")) {
      try {
        await db.activities.clear();
        await db.blockers.clear();
        alert("All data has been deleted.");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalWorkSec = activities?.reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0;
  const totalBlockSec = blockers?.reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0;

  const exportFormats = [
    {
      name: 'PDF Report',
      icon: <FileText className="text-red-500" />,
      desc: 'Professional PDF (Print version)',
      action: handlePrint
    },
    {
      name: 'Markdown Report',
      icon: <FileCode className="text-purple-500" />,
      desc: 'Clean MD for Team Lead reports',
      action: exportToMarkdown
    },
    {
      name: 'CSV Export',
      icon: <TableIcon className="text-emerald-500" />,
      desc: 'Raw data for spreadsheet analysis',
      action: exportToCSV
    },
    {
      name: 'Excel Workbook',
      icon: <FileSpreadsheet className="text-blue-500" />,
      desc: 'Compatible with Excel (CSV format)',
      action: exportToCSV
    },
    {
      name: 'JSON Data',
      icon: <FileJson className="text-orange-500" />,
      desc: 'Complete backup with readable values',
      action: exportToJSON
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-card border rounded-2xl p-8 text-center max-w-2xl mx-auto shadow-sm print:hidden">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          {isExporting ? <Loader2 size={32} className="animate-spin" /> : <Download size={32} />}
        </div>
        <h3 className="text-2xl font-bold mb-2">Generate Work Report</h3>
        <p className="text-muted-foreground mb-8">
          Select a format below to export your productivity data.
          PDF reports include a summary of your activities and blockers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exportFormats.map(format => (
            <button
              key={format.name}
              onClick={format.action}
              disabled={isExporting}
              className="flex items-center gap-4 p-4 border rounded-xl hover:bg-secondary transition-all text-left group disabled:opacity-50"
            >
              <div className="p-2 bg-background rounded-lg group-hover:scale-110 transition-transform border">
                {format.icon}
              </div>
              <div>
                <p className="font-semibold text-sm">{format.name}</p>
                <p className="text-xs text-muted-foreground">{format.desc}</p>
              </div>
              <Download size={16} className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t">
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/5 rounded-lg transition-colors mx-auto text-sm font-semibold"
          >
            <Trash2 size={16} />
            Delete All Activity & Blocker Data
          </button>
        </div>
      </div>

      {/* Print-only section for PDF generation */}
      <div className="hidden print:block print:p-0 bg-white text-black min-h-screen">
        <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Developer Work Report</h1>
            <p className="text-gray-600 font-medium">Created By: Abdelmonuem Wagih</p>
          </div>
          <div className="text-right">
            <p className="font-bold">Date: {formatDate(new Date())}</p>
            <p className="text-sm text-gray-500">Time: {formatTime(new Date())}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border p-4 rounded-lg bg-gray-50">
            <p className="text-xs uppercase font-bold text-gray-500">Working Time</p>
            <p className="text-2xl font-mono font-bold">{formatDuration(totalWorkSec)}</p>
          </div>
          <div className="border p-4 rounded-lg bg-gray-50">
            <p className="text-xs uppercase font-bold text-gray-500">Blocked Time</p>
            <p className="text-2xl font-mono font-bold text-red-600">{formatDuration(totalBlockSec)}</p>
          </div>
          <div className="border p-4 rounded-lg bg-gray-50">
            <p className="text-xs uppercase font-bold text-gray-500">Activities</p>
            <p className="text-2xl font-mono font-bold">{activities?.length || 0}</p>
          </div>
          <div className="border p-4 rounded-lg bg-gray-50">
            <p className="text-xs uppercase font-bold text-gray-500">Blockers</p>
            <p className="text-2xl font-mono font-bold">{blockers?.length || 0}</p>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 border-l-4 border-black pl-3 bg-gray-100 py-1">Activities</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2">Jira Key</th>
                <th className="py-2">Task</th>
                <th className="py-2">Project</th>
                <th className="py-2">Type</th>
                <th className="py-2 text-right">Duration</th>
              </tr>
            </thead>
            <tbody>
              {activities?.map((a, i) => (
                <React.Fragment key={a.id}>
                  <tr className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2 font-mono text-xs">{a.jiraKey || '-'}</td>
                    <td className="py-2 font-bold">{a.taskName}</td>
                    <td className="py-2">{a.project}</td>
                    <td className="py-2">{a.type}</td>
                    <td className="py-2 text-right font-mono font-bold">{formatDuration(a.duration || 0)}</td>
                  </tr>
                  {a.description && (
                    <tr className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td colSpan={6} className="pb-1 pt-0 text-xs text-gray-700 px-4">
                        <span className="font-semibold">Description:</span> {a.description}
                      </td>
                    </tr>
                  )}
                  {a.notes && (
                    <tr className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td colSpan={6} className="pb-2 pt-0 text-xs text-gray-500 italic px-4">
                        <span className="font-semibold">Note:</span> {a.notes}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 border-l-4 border-red-600 pl-3 bg-red-50 py-1">Blockers</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-red-600 text-left">
                <th className="py-2">Reason</th>
                <th className="py-2">Team</th>
                <th className="py-2">Impact</th>
                <th className="py-2">Start</th>
                <th className="py-2">End</th>
                <th className="py-2 text-right">Duration</th>
              </tr>
            </thead>
            <tbody>
              {blockers?.map((b, i) => (
                <React.Fragment key={b.id}>
                  <tr className={i % 2 === 0 ? 'bg-red-50/30' : ''}>
                    <td className="py-2 font-bold">{b.reason}</td>
                    <td className="py-2">{b.team}</td>
                    <td className="py-2">{b.impact}</td>
                    <td className="py-2">{formatTime(b.startTime)}</td>
                    <td className="py-2">{b.endTime ? formatTime(b.endTime) : '-'}</td>
                    <td className="py-2 text-right font-mono font-bold text-red-600">{formatDuration(b.duration || 0)}</td>
                  </tr>
                  {b.description && (
                    <tr className={i % 2 === 0 ? 'bg-red-50/30' : ''}>
                      <td colSpan={6} className="pb-1 pt-0 text-xs text-gray-700 px-4">
                        <span className="font-semibold">Description:</span> {b.description}
                      </td>
                    </tr>
                  )}
                  {b.notes && (
                    <tr className={i % 2 === 0 ? 'bg-red-50/30' : ''}>
                      <td colSpan={6} className="pb-2 pt-0 text-xs text-gray-500 italic px-4">
                        <span className="font-semibold">Note:</span> {b.notes}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-20 pt-8 border-t border-dashed text-center text-xs text-gray-400">
          Report generated by JRI Work Tracker - Confidential Professional Report
        </div>
      </div>
    </div>
  );
};
