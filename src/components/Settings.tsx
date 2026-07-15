import React from 'react';
import Dexie from 'dexie';
import { db } from '../db';
import { Trash2, Plus, Database, Shield, Bell, User } from 'lucide-react';

export const Settings = () => {
  const handleReset = async () => {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
      try {
        db.close();
        await Dexie.delete('DeveloperWorkTracker');
        window.location.reload();
      } catch (err) {
        console.error("Reset failed:", err);
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const sections = [
    { title: 'Profile', icon: <User size={18} />, desc: 'Manage your personal information and work hours' },
    { title: 'Projects & Teams', icon: <Database size={18} />, desc: 'Configure projects, epics, and team members' },
    { title: 'Notifications', icon: <Bell size={18} />, desc: 'Stay updated with reminders and focus alerts' },
    { title: 'Security & Privacy', icon: <Shield size={18} />, desc: 'Manage your data and local storage settings' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          {sections.map(s => (
            <button key={s.title} className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
              {s.title}
            </button>
          ))}
        </aside>

        <div className="md:col-span-3 space-y-8">
          <section className="bg-card border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Appearance</h3>
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Adjust the application's visual theme</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-primary-foreground rounded-full" />
              </div>
            </div>
          </section>

          <section className="bg-card border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Projects</h3>
            <div className="space-y-2 mb-4">
              {['Project Alpha', 'Project Beta', 'Client X'].map(p => (
                <div key={p} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                  <span className="text-sm font-medium">{p}</span>
                  <button className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full py-2 border border-dashed rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2">
              <Plus size={16} />
              Add Project
            </button>
          </section>

          <section className="bg-card border-destructive/20 border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Once you delete your data, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Reset All Data
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
