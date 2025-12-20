// Server-side settings page with superadmin protection
import { requireAccess } from "@/lib/server-auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
    // Only superadmin can access settings
    await requireAccess('admin-settings');

    return <SettingsClient />;
}
