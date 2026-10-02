"use client"

import { createContext, useContext } from "react"
import { useActiveSection } from "@/hooks/useActiveSection"
import type { ReactNode, RefCallback } from "react"

type RegisterSection = (id: string) => RefCallback<HTMLElement>;

const ActiveIdContext = createContext<string | null>(null);
const RegisterContext = createContext<RegisterSection | null>(null);

export type ActiveSectionProviderProps = {
  order: readonly string[];
  children: ReactNode;
};

export function ActiveSectionProvider({
    order, 
    children,
}: ActiveSectionProviderProps) {
    const { activeId, refFor } = useActiveSection(order);

    return (
        <RegisterContext.Provider value={refFor}>
            <ActiveIdContext.Provider value={activeId}>
                {children}
            </ActiveIdContext.Provider>
        </RegisterContext.Provider>
    )
}

export function useActiveSectionId(): string | null {
    return useContext(ActiveIdContext);
}


export function useSectionRef(id: string): RefCallback<HTMLElement> {
    const register = useContext(RegisterContext);

    if (register === null )  {
        throw new Error("useSectionRef harus dipakai di dalam ActiveSectionProvider")
    }

    return register(id);
}

