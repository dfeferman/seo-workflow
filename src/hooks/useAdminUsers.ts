import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

export type AdminUser = {
  id: string
  email: string
  is_superadmin: boolean
  is_approved: boolean
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: (): Promise<AdminUser[]> => apiClient.admin.getUsers(),
  })
}

function useInvalidateAdminUsers() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  }
}

export function useApproveUser() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: (id: string): Promise<AdminUser> => apiClient.admin.approveUser(id),
    onSuccess: invalidate,
  })
}

export function useRevokeUser() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: (id: string): Promise<AdminUser> => apiClient.admin.revokeUser(id),
    onSuccess: invalidate,
  })
}

export function useSetUserPassword() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }): Promise<AdminUser> =>
      apiClient.admin.setUserPassword(id, password),
    onSuccess: invalidate,
  })
}

export function useDeleteUser() {
  const invalidate = useInvalidateAdminUsers()
  return useMutation({
    mutationFn: (id: string): Promise<void> => apiClient.admin.deleteUser(id),
    onSuccess: invalidate,
  })
}
