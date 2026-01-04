/*
 * Copyright (c) 2026 Mid Michigan Connections LLC.
 * This file is part of BogleConvert.
 *
 * BogleConvert is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * BogleConvert is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with BogleConvert. If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react';
import { ViewState, UserProfile } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  user: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, user }) => {
  const navItems = [
    { id: ViewState.PHILOSOPHY, label: 'The Guide', icon: 'menu_book' },
    { id: ViewState.DASHBOARD, label: 'Portfolio', icon: 'pie_chart' },
    { id: ViewState.REPORT, label: 'Stock Report', icon: 'description' },
    { id: ViewState.ANALYSIS, label: 'Analysis', icon: 'analytics' },
    { id: ViewState.SETTINGS, label: 'Settings', icon: 'settings' },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-outline bg-surface p-4 transition-all duration-300 ease-in-out">
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="material-symbols-outlined text-3xl text-secondary">candlestick_chart</span>
        <p className="text-xl font-bold font-display text-white">BogleConvert</p>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              aria-label={item.label}
              onClick={() => onChangeView(item.id)}
              className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive ? 'text-white' : 'text-muted hover:bg-white/5 hover:text-white'
                }`}
            >
              {isActive && (
                <>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 opacity-100" />
                  <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-gradient-to-b from-primary to-secondary" />
                </>
              )}
              <span className={`material-symbols-outlined text-xl ${isActive ? 'fill' : ''}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        {/* Support/Donate Box */}
        <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-4 text-center border border-amber-500/20">
          <div>
            <p className="text-sm font-medium text-white">Enjoying BogleConvert?</p>
            <p className="mt-2 text-xs text-muted leading-relaxed">0% Expense Ratio.<br />Built for the community</p>
          </div>
          <button
            aria-label="Buy me a coffee"
            onClick={() => onChangeView(ViewState.SUPPORT)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-white py-1.5 text-sm font-semibold text-black transition-all hover:bg-amber-50 hover:text-amber-900 group"
          >
            <span className="material-symbols-outlined text-base group-hover:animate-bounce">local_cafe</span>
            <span>Buy me a coffee</span>
          </button>
        </div>

        {/*
        <div className="flex items-center gap-3 border-t border-outline pt-4">
          <img
            alt="User avatar"
            className="h-9 w-9 flex-shrink-0 rounded-full object-cover border border-outline"
            src={user.avatarUrl}
          />
          <div className="flex flex-col items-start overflow-hidden">
            <p className="text-sm font-medium text-white truncate w-full">{user.name}</p>
            <p className="text-xs text-muted truncate w-full">{user.email}</p>
          </div>
        </div>
        */}
        {/* Source Code Link - AGPL Compliance */}
        <a
          href={import.meta.env.VITE_GITHUB_REPO || 'https://github.com/BogleConvert/BogleConvert'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-xs text-muted hover:text-white transition-colors border-t border-outline pt-4"
        >
          <span className="material-symbols-outlined text-base">code</span>
          <span>Source Code (AGPLv3)</span>
        </a>

        {/* Company Attribution */}
        <a
          href="https://midmichiganconnections.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center text-[10px] text-muted/60 hover:text-muted transition-colors mt-2"
        >
          © 2026 Mid Michigan Connections LLC
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
