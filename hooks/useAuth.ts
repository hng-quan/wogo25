import { User } from '@/interfaces/modal/user';
import { getItem } from '@/lib/storage';
import { useEffect, useState } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getItem<User>('user').then(user => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  return {user, loading, setUser};
};
