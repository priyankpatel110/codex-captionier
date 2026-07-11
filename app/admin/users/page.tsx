import { AdminUsersView } from "@/components/admin-users-view"

export default function AdminUsersPage() {
  return (
    <AdminUsersView
      environment="production"
      title="Users"
      description="Users signed in through the live production app."
    />
  )
}
