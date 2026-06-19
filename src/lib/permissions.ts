export enum Permission {
  None = 0,
  VideoEditor = 1 << 0,
  // ~0 === -1 in two's complement: all bits set, so every hasPermission check passes naturally.
  Admin = ~0,
}

export function hasPermission(permissions: number, flag: Permission): boolean {
  if (flag === Permission.None) return true;
  return (permissions & flag) === flag;
}

export const PERMISSION_LABELS: {flag: Permission; label: string}[] = [
  {flag: Permission.Admin, label: "Admin"},
  {flag: Permission.VideoEditor, label: "Video Editor"},
];
