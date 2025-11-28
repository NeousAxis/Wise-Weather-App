"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map as MapIcon, Bell, MessageSquare } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const pathname = usePathname();
  const { openFeedback } = useUI();
  const { t } = useLanguage();

  const isActive = (path: string) => pathname === path;

  return (
    <footer className="footer">
      <div className="footer-content">
        <Link href="/" className={`footer-item ${isActive('/') ? 'active' : ''}`}>
          <Home size={24} />
          <span>{t.nav?.home || 'Home'}</span>
        </Link>

        <Link href="/map" className={`footer-item ${isActive('/map') ? 'active' : ''}`}>
          <MapIcon size={24} />
          <span>{t.nav?.map || 'Map'}</span>
        </Link>

        <Link href="/alerts" className={`footer-item ${isActive('/alerts') ? 'active' : ''}`}>
          <Bell size={24} />
          <span>{t.nav?.alerts || 'Alerts'}</span>
        </Link>

        <button onClick={openFeedback} className="footer-item">
          <MessageSquare size={24} />
          <span>{t.nav?.feedback || 'Feedback'}</span>
        </button>
      </div>

      <style jsx>{`
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid var(--border);
          padding-bottom: env(safe-area-inset-bottom);
          z-index: 50;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        }
        .footer-content {
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 60px;
          max-width: 600px;
          margin: 0 auto;
        }
        .footer-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #94a3b8;
          font-size: 0.75rem;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          width: 25%;
          transition: color 0.2s;
        }
        .footer-item.active {
          color: var(--primary);
        }
        .footer-item:hover {
          color: var(--accent);
        }
        .footer-item span {
          font-weight: 500;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
