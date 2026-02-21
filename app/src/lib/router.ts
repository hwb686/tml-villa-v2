// Hash-based router for static deployment compatibility
// This avoids 404 errors on static servers

import { useState, useEffect, useCallback } from 'react';

export function useHashRouter() {
  const [path, setPath] = useState(() => {
    const hash = window.location.hash;
    return hash ? hash.replace('#', '') : '/';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setPath(hash ? hash.replace('#', '') : '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((newPath: string) => {
    window.location.hash = newPath;
    setPath(newPath);
  }, []);

  return { path, navigate };
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
