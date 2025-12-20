// Server-side admin layout with RBAC protection
import { ReactNode } from "react";
import { requireAccess } from "@/lib/server-auth";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Server-side check: require access to 'admin' resource
  // This will redirect to /unauthorized if user is customer
  await requireAccess('admin');

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
