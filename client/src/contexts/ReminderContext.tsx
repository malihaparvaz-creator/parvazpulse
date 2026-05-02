import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTodayEntry, getSettings, updateSettings } from '@/lib/store';
import { toast } from 'sonner';

interface ReminderContextType {
  reminderShown: boolean;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const [reminderShown, setReminderShown] = useState(false);

  useEffect(() => {
    const checkReminder = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Check if it's after 7 PM
      const isAfter7PM = hour >= 19;
      
      if (!isAfter7PM) return;

      const settings = getSettings();
      const today = new Date().toISOString().split('T')[0];
      
      // Check if reminder was already shown today
      if (settings.lastReminderDate === today) {
        return;
      }

      // Check if user has entered anything today
      const entry = getTodayEntry();
      if (entry.isUserEntered) {
        return; // User already entered, no reminder needed
      }

      // Show reminder
      if (!reminderShown) {
        // Show in-app toast
        toast.info('Don\'t forget to log your day!', {
          description: 'Take 2 minutes to reflect before the night slips away.',
          duration: 10000,
        });

        // Request notification permission and show push notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Parvaz Pulse', {
            body: 'Don\'t forget to log your day! Take 2 minutes to reflect before the night slips away.',
            icon: '/icon-192x192.png',
            tag: 'parvaz-reminder',
            requireInteraction: true,
          });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification('Parvaz Pulse', {
                body: 'Don\'t forget to log your day! Take 2 minutes to reflect before the night slips away.',
                icon: '/icon-192x192.png',
                tag: 'parvaz-reminder',
                requireInteraction: true,
              });
            }
          });
        }

        setReminderShown(true);
        
        // Mark reminder as shown for today
        updateSettings({ lastReminderDate: today });
      }
    };

    // Check every minute
    const interval = setInterval(checkReminder, 60000);
    
    // Also check immediately on mount
    checkReminder();
    
    return () => clearInterval(interval);
  }, [reminderShown]);

  return (
    <ReminderContext.Provider value={{ reminderShown }}>
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminder() {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminder must be used within ReminderProvider');
  }
  return context;
}
