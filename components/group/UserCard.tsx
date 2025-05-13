"use client";
import { useState } from "react";

export default function UserCard({ user, children }: { user: any; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      tabIndex={0}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-fade-in text-sm">
          <div className="flex items-center gap-3 mb-2">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-10 h-10 rounded-full" />
            ) : (
              <span className="w-10 h-10 rounded-full bg-gray-300 inline-block" />
            )}
            <div>
              <div className="font-bold text-base">{user.display_name || user.bio || user.user_id}</div>
              {user.location && <div className="text-xs text-gray-500">{user.location}</div>}
            </div>
          </div>
          {user.bio && <div className="mb-1 text-gray-700">{user.bio}</div>}
          {user.website && (
            <div className="mb-1">
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Website</a>
            </div>
          )}
          {user.social && (
            <div className="flex gap-2 mt-1">
              {Object.entries(user.social).map(([platform, url]: any) => (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
      <style jsx>{`
        .animate-fade-in { animation: fadeIn 0.15s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </span>
  );
} 