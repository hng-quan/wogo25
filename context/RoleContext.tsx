import { createContext, useContext, useState } from "react";

export const ROLE = {
    WORKER: true,
    CUSTOMER: false
}
const RoleContext = createContext<any>(null);

export const RoleProvider = ({children}: {children: React.ReactNode}) => {
    const [role, setRole] = useState(ROLE.CUSTOMER);
    return (
        <RoleContext.Provider value={{ role, setRole }}>
            {children}
        </RoleContext.Provider>
    )
}

export const useRole = () =>  useContext(RoleContext);