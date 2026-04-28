import { useState } from 'react'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useAuth } from '@/hooks/useAuth'
import {
  useAdminUsers,
  useApproveUser,
  useDeleteUser,
  useRevokeUser,
  useSetUserPassword,
} from '@/hooks/useAdminUsers'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { user } = useAuth()
  const { data: users = [], isLoading, error } = useAdminUsers()
  const approveUser = useApproveUser()
  const revokeUser = useRevokeUser()
  const setUserPassword = useSetUserPassword()
  const deleteUser = useDeleteUser()
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; email: string } | null>(null)

  if (!user?.is_superadmin) {
    return <Navigate to="/" />
  }

  const busyUserId =
    (approveUser.isPending ? approveUser.variables : null) ??
    (revokeUser.isPending ? revokeUser.variables : null) ??
    (deleteUser.isPending ? deleteUser.variables : null) ??
    (setUserPassword.isPending ? setUserPassword.variables?.id ?? null : null)

  const handlePasswordSubmit = async (userId: string) => {
    setPasswordError(null)
    if (newPassword.length < 8) {
      setPasswordError('Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    try {
      await setUserPassword.mutateAsync({ id: userId, password: newPassword })
      setNewPassword('')
      setPasswordUserId(null)
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : 'Passwort konnte nicht gesetzt werden.')
    }
  }

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="px-8 py-6 max-w-5xl mx-auto w-full">
        <div className="rounded-xl border border-slate-100 bg-white p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Nutzerverwaltung</h1>
            <p className="text-sm text-slate-500 mt-2">
              Du kannst Accounts freigeben, sperren, loeschen und Passwoerter direkt setzen.
            </p>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {error instanceof Error ? error.message : 'Nutzer konnten nicht geladen werden.'}
            </p>
          )}

          {isLoading ? (
            <p className="text-sm text-slate-500">Nutzer werden geladen...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-3 pr-4 font-medium">E-Mail</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Rolle</th>
                    <th className="py-3 pr-4 font-medium">Erstellt</th>
                    <th className="py-3 font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => {
                    const isBusy = busyUserId === row.id
                    const isPasswordOpen = passwordUserId === row.id

                    return (
                      <tr key={row.id} className="border-b border-slate-100 align-top">
                        <td className="py-4 pr-4">
                          <div className="font-medium text-slate-900">{row.email}</div>
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              row.is_approved
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {row.is_approved ? 'Freigegeben' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-slate-600">
                          {row.is_superadmin ? 'Superadmin' : 'User'}
                        </td>
                        <td className="py-4 pr-4 text-slate-600">
                          {new Date(row.created_at).toLocaleString('de-DE')}
                        </td>
                        <td className="py-4">
                          {row.is_superadmin ? (
                            <span className="text-xs text-slate-400">Keine Aktion</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {row.is_approved ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => revokeUser.mutate(row.id)}
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Zugriff entziehen
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => approveUser.mutate(row.id)}
                                  className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                >
                                  Freigeben
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setPasswordError(null)
                                  setNewPassword('')
                                  setPasswordUserId((current) => (current === row.id ? null : row.id))
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Passwort setzen
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => setDeleteCandidate({ id: row.id, email: row.email })}
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                Nutzer loeschen
                              </button>
                            </div>
                          )}
                          {isPasswordOpen && (
                            <div className="mt-3 max-w-sm rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <label className="block text-xs font-medium text-slate-700 mb-2" htmlFor={`password-${row.id}`}>
                                Neues Passwort fuer {row.email}
                              </label>
                              <input
                                id={`password-${row.id}`}
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={8}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                placeholder="Mindestens 8 Zeichen"
                              />
                              {passwordError && (
                                <p className="mt-2 text-xs text-red-600" role="alert">
                                  {passwordError}
                                </p>
                              )}
                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handlePasswordSubmit(row.id)}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Passwort speichern
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setPasswordUserId(null)
                                    setNewPassword('')
                                    setPasswordError(null)
                                  }}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {deleteCandidate && (
        <ConfirmModal
          open={true}
          title="Nutzer loeschen?"
          message={`Den Account ${deleteCandidate.email} und alle zugehoerigen Daten unwiderruflich loeschen?`}
          confirmLabel="Loeschen"
          variant="danger"
          onConfirm={() => {
            deleteUser.mutate(deleteCandidate.id, {
              onSuccess: () => setDeleteCandidate(null),
            })
          }}
          onCancel={() => setDeleteCandidate(null)}
          isLoading={deleteUser.isPending}
        />
      )}
    </main>
  )
}
