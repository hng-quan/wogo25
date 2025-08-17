import { getItem, setItem } from "@/lib/storage";
import { createContext, useContext, useEffect, useState } from "react";

export const ROLE = {
    WORKER: true,
    CUSTOMER: false
}
const RoleContext = createContext<any>(null);

export const RoleProvider = ({children}: {children: React.ReactNode}) => {
    const [role, setRole] = useState(ROLE.CUSTOMER);
    const toggleRole = async () => {
        setRole(prev => !prev);
        await setItem('role', !role ? ROLE.WORKER : ROLE.CUSTOMER);
    }

    useEffect(() => {
        (async() => {
            const roleStored = await getItem('role');
            if (roleStored) {
                if (roleStored === ROLE.WORKER) {
                    setRole(ROLE.WORKER);
                }
            }
        })();
    }, [])
    return (
        <RoleContext.Provider value={{ role, setRole, toggleRole }}>
            {children}
        </RoleContext.Provider>
    )
}

export const useRole = () =>  useContext(RoleContext);