import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { startOfDay, endOfDay, isToday } from 'date-fns';

export const useStats = () => {
  const activities = useLiveQuery(() =>
    db.activities.where('startTime').between(startOfDay(new Date()), endOfDay(new Date())).toArray()
  );

  const blockers = useLiveQuery(() =>
    db.blockers.where('startTime').between(startOfDay(new Date()), endOfDay(new Date())).toArray()
  );

  if (!activities || !blockers) return null;

  const totalTime = activities.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const focusTime = activities
    .filter(a => ['Feature Development', 'Bug Fix', 'Refactoring', 'Testing'].includes(a.type))
    .reduce((acc, curr) => acc + (curr.duration || 0), 0);

  const meetingTime = activities
    .filter(a => a.type === 'Meeting')
    .reduce((acc, curr) => acc + (curr.duration || 0), 0);

  const blockedTime = blockers.reduce((acc, curr) => acc + (curr.duration || 0), 0);

  const completedActivities = activities.filter(a => a.status === 'completed').length;

  return {
    totalTime,
    focusTime,
    blockedTime,
    meetingTime,
    completedActivities,
    activities,
    blockers
  };
};
