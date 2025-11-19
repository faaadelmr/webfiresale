// src/components/ui/RoleSelector.tsx
'use client';

import { Role } from '@/lib/rbac';

interface RoleSelectorProps {
  currentRole: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}

export default function RoleSelector({ currentRole, onChange, disabled }: RoleSelectorProps) {
  const roles: Role[] = ['customer', 'admin', 'superadmin'];

  return (
    <select
      value={currentRole}
      onChange={(e) => onChange(e.target.value as Role)}
      className="select select-bordered w-full max-w-xs"
      disabled={disabled}
    >
      {roles.map(role => (
        <option key={role} value={role}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </option>
      ))}
    </select>
  );
}