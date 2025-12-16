"use client";

import { ReactNode, useState } from "react";
import AdminNavClient, { AdminHeaderClient } from "./AdminNavClient";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`} onClick={() => setSidebarOpen(false)}>
        <div className="fixed inset-0 bg-black/50"></div>
        <div className="relative flex w-64 h-full bg-base-100 border-r">
          <AdminNavClient mobile={true} setSidebarOpen={setSidebarOpen} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-10 bg-base-100 border-r">
        <AdminNavClient mobile={false} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        <AdminHeaderClient setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 md:p-8 bg-base-200">
          {children}
        </main>
      </div>
    </div>
  );
}
