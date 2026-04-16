import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Notification load error:', err);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    load();

    // Realtime subscription for new notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    // Fallback: poll every 60 seconds in case realtime isn't available
    const intv = setInterval(load, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intv);
    };
  }, [userId, load]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, reload: load };
}
