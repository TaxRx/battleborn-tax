import React, { useState, useEffect } from 'react';
import { Notification } from '../../types/user';
import { advisorService } from '../../services/advisorService';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Get advisorId from auth context
      const advisorId = 'advisor1';
      const notifs = await advisorService.getNotifications(advisorId);
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await advisorService.markNotificationAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      setError('Failed to mark notification as read.');
    }
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => !n.read);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <div className="space-x-2">
          <button
            className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-3 py-1 rounded ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}
      <div className="bg-white rounded-lg shadow divide-y">
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications.</div>
        ) : (
          filteredNotifications.map((notif) => (
            <div key={notif.id} className={`flex items-center justify-between p-4 ${notif.read ? '' : 'bg-blue-50'}`}>
              <div>
                <div className={`font-medium ${notif.read ? 'text-gray-700' : 'text-blue-800'}`}>{notif.message}</div>
                <div className="text-xs text-gray-400 mt-1">{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}</div>
              </div>
              <div>
                {!notif.read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 