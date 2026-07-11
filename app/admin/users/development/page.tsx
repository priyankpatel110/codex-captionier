import { AdminUsersView } from "@/components/admin-users-view"

export default function AdminDevUsersPage() {
  return (
    <AdminUsersView
      environment="development"
      title="Dev Users"
      description="Users signed in through the local/dev Clerk instance (localhost, ngrok testing, etc.)."
    />
  )
}
