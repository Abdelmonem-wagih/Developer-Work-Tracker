import Dexie, { type Table } from 'dexie';

export type ActivityType =
  | 'Feature Development'
  | 'Bug Fix'
  | 'Refactoring'
  | 'Testing'
  | 'Code Review'
  | 'Documentation'
  | 'Deployment'
  | 'Research'
  | 'Meeting'
  | 'Waiting'
  | 'Break'
  | 'Other';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Activity {
  id?: number;
  type: ActivityType;
  taskName: string;
  project: string;
  epic?: string;
  userStory?: string;
  description?: string;
  priority: Priority;
  tags: string[];
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  notes?: string;
  status: 'active' | 'paused' | 'completed';
}

export interface Blocker {
  id?: number;
  team: string;
  reason: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  notes?: string;
}

export interface Project {
  id?: number;
  name: string;
}

export interface Team {
  id?: number;
  name: string;
}

export class MyDatabase extends Dexie {
  activities!: Table<Activity>;
  blockers!: Table<Blocker>;
  projects!: Table<Project>;
  teams!: Table<Team>;

  constructor() {
    super('DeveloperWorkTracker');
    this.version(4).stores({
      activities: '++id, type, project, status, startTime',
      blockers: '++id, team, startTime',
      projects: '++id, name',
      teams: '++id, name'
    });
  }
}

console.log("[BOOT] Database module loading...");
export const db = new MyDatabase();
console.log("[BOOT] Database instance created");

// Handle database blocking (usually when another tab is open during upgrade)
db.on('blocked', () => {
  console.log("[BOOT] Database upgrade BLOCKED by another tab");
  console.warn('Database upgrade blocked by another tab.');
  // Use a non-blocking way to notify user if possible, but alert is a safe fallback for critical issues
  // Delayed alert to avoid blocking the very first render cycle
  setTimeout(() => {
    alert('A new version of the app is available. Please close all other tabs of this application to update.');
  }, 1000);
});

// We removed the top-level db.open() call to prevent blocking the initial script evaluation.
// Dexie will open automatically on first access.
// If it fails to open, queries will throw, which useLiveQuery handles.
