// Hash-based router for static deployment compatibility
// This avoids 404 errors on static servers

import { useState, useEffect, useCallback } from 'react';

// 解析 URL 查询参数
function parseQuery(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!search) return params;
  
  const searchParams = new URLSearchParams(search);
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

export function useHashRouter() {
  const [path, setPath] = useState(() => {
    const hash = window.location.hash;
    return hash ? hash.replace('#', '') : '/';
  });
  
  const [query, setQuery] = useState<Record<string, string>>(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    return queryIndex > -1 ? parseQuery(hash.substring(queryIndex)) : {};
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const fullPath = hash ? hash.replace('#', '') : '/';
      setPath(fullPath);
      
      const queryIndex = fullPath.indexOf('?');
      setQuery(queryIndex > -1 ? parseQuery(fullPath.substring(queryIndex)) : {});
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((newPath: string) => {
    window.location.hash = newPath;
    setPath(newPath);
    
    const queryIndex = newPath.indexOf('?');
    setQuery(queryIndex > -1 ? parseQuery(newPath.substring(queryIndex)) : {});
  }, []);

  return { path, query, navigate };
}

// Admin router with hash support
export function useAdminHashRouter() {
  const [path, setPath] = useState(() => {
    const hash = window.location.hash;
    const fullPath = hash ? hash.replace('#', '') : '/admin/dashboard';
    // Extract admin sub-path
    return fullPath.replace('/admin', '').replace(/^\//, '') || 'dashboard';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const fullPath = hash ? hash.replace('#', '') : '/admin/dashboard';
      setPath(fullPath.replace('/admin', '').replace(/^\//, '') || 'dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((newPath: string) => {
    const fullPath = `/admin/${newPath}`;
    window.location.hash = fullPath;
    setPath(newPath);
  }, []);

  return { path, navigate };
}

// Helper to create hash links
export function getHashLink(path: string): string {
  return `#${path}`;
}
