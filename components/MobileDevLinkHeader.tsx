'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MobileDevLinkHeader() {
  if (process.env.NODE_ENV !== 'development') return null;
  
  const pathname = usePathname();
  const [ip, setIp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    fetch('/api/local-ip')
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => setIp(null));
  }, []);
  
  if (!ip) return null;
  
  const mobileURL = `http://${ip}:3001${pathname}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mobileURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <button
      onClick={handleCopy}
      className="fixed bottom-4 left-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-2 py-1 rounded shadow-lg z-50 transition-colors"
      style={{ fontSize: '10px' }}
    >
      {copied ? '✓ Copied!' : 'Copy Mobile URL'}
    </button>
  );
}
