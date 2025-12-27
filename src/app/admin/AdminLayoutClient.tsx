"use client";

import { ReactNode, useState } from "react";
import AdminNavClient from "./AdminNavClient";

export default function AdminLayoutClient({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    return (
        <div className="flex min-h-screen w-full bg-primary p-4">
            {/* Mobile sidebar overlay */}
            <div
                className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}
                onClick={() => setSidebarOpen(false)}
            >
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
                <div className="relative flex w-72 h-full">
                    <AdminNavClient mobile={true} setSidebarOpen={setSidebarOpen} expanded={true} />
                </div>
            </div>

            {/* Desktop sidebar - Compact with hover expand */}
            <div
                className={`hidden lg:flex lg:flex-col flex-shrink-0 transition-all duration-300 ${sidebarExpanded ? 'w-64' : 'w-20'}`}
                onMouseEnter={() => setSidebarExpanded(true)}
                onMouseLeave={() => setSidebarExpanded(false)}
            >
                <AdminNavClient mobile={false} expanded={sidebarExpanded} setSidebarOpen={setSidebarOpen} />
            </div>

            {/* Main content - wrapped inside sidebar visually */}
            <div className="flex-1 flex flex-col bg-base-200 rounded-3xl overflow-hidden shadow-2xl ml-0 lg:ml-4">
                {/* Simple Header */}
                <header className="flex h-16 items-center justify-between px-6 bg-base-100 border-b border-base-200">
                    <button
                        className="lg:hidden btn btn-ghost btn-circle"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSidebarOpen(true);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-base-content">Dashboard</h1>
                    <div className="w-10"></div>
                </header>

                <main className="flex-1 p-4 md:p-6 overflow-auto bg-base-200">
                    {children}
                </main>
            </div>
        </div>
    );
}
