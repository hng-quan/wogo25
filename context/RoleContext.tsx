import { getItem, setItem } from '@/lib/storage';
import { createContext, useContext, useEffect, useState } from 'react';

export const ROLE = {
  WORKER: 'worker',
  CUSTOMER: 'customer',
};
const RoleContext = createContext<any>(null);

export const RoleProvider = ({children}: {children: React.ReactNode}) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<any>(ROLE.CUSTOMER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const userStored = await getItem('user');
      const roleStored = await getItem('role');

      if (userStored) setUser(userStored);
      if (roleStored) setRole(roleStored);

      setLoading(false);
    })();
  }, []);

  const toggleRole = async () => {
    const newRole = role === ROLE.WORKER ? ROLE.CUSTOMER : ROLE.WORKER;
    await setItem('role', newRole);
    setRole(newRole);
  };

  const initialValue = () => {
    setUser(null);
    setRole(ROLE.CUSTOMER);
  };

  return (
    <RoleContext.Provider value={{role, loading, user, setRole, toggleRole, setUser, initialValue}}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
