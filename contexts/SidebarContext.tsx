'use client';

import { createContext, useContext } from 'react';

export const SidebarContext = createContext({ expanded: false, setExpanded: (_: boolean) => {} });
export const useSidebar = () => useContext(SidebarContext);
