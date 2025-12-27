// Server-side theme page with admin protection
import { requireAccess } from "@/lib/server-auth";
import ThemeClient from "./ThemeClient";

export default async function ThemePage() {
    // Only admin/superadmin can access theme settings
    await requireAccess('admin');

    return <ThemeClient />;
}
