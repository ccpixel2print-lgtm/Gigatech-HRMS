'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Plus, 
  Edit, 
  Unlock, 
  XCircle, 
  CheckCircle,
  ShieldAlert,
  Loader2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

// Types
interface Role {
  id: number
  name: string
  description: string | null
}

interface User {
  id: number
  email: string
  fullName: string
  isActive: boolean
  failedLoginAttempts: number
  lockedUntil: Date | null
  isLocked: boolean
  roles: Role[]
  createdAt: Date
  updatedAt: Date
}

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  roleIds: z.array(z.number()).min(1, 'At least one role is required'),
})

const updateUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  roleIds: z.array(z.number()).min(1, 'At least one role is required'),
})

type CreateUserForm = z.infer<typeof createUserSchema>
type UpdateUserForm = z.infer<typeof updateUserSchema>

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Forms
  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      roleIds: [],
    },
  })

  const updateForm = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: '',
      roleIds: [],
    },
  })

  // Fetch data
  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      console.log('[USER_MGMT] Fetching users...')
      const response = await fetch('/api/users')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[USER_MGMT] Users fetched:', data.length)
      setUsers(data)
      setError(null)
    } catch (error) {
      console.error('[USER_MGMT] Failed to fetch users:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      console.log('[USER_MGMT] Fetching roles...')
      const response = await fetch('/api/roles')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('[USER_MGMT] Roles fetched:', data.length)
      setRoles(data)
    } catch (error) {
      console.error('[USER_MGMT] Failed to fetch roles:', error)
    }
  }

  // Create user
  const handleCreateUser = async (data: CreateUserForm) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to create user')
        return
      }

      await fetchUsers()
      setCreateDialogOpen(false)
      createForm.reset()
    } catch (error) {
      console.error('Failed to create user:', error)
      alert('Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  // Update user
  const handleUpdateUser = async (data: UpdateUserForm) => {
    if (!selectedUser) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to update user')
        return
      }

      await fetchUsers()
      setEditDialogOpen(false)
      setSelectedUser(null)
      updateForm.reset()
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('Failed to update user')
    } finally {
      setSubmitting(false)
    }
  }

  // Unlock user
  const handleUnlockUser = async (userId: number) => {
    if (!confirm('Are you sure you want to unlock this user?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock' }),
      })

      if (!response.ok) {
        alert('Failed to unlock user')
        return
      }

      await fetchUsers()
    } catch (error) {
      console.error('Failed to unlock user:', error)
      alert('Failed to unlock user')
    }
  }

  // Deactivate user
  const handleDeactivateUser = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        alert('Failed to deactivate user')
        return
      }

      await fetchUsers()
    } catch (error) {
      console.error('Failed to deactivate user:', error)
      alert('Failed to deactivate user')
    }
  }

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    updateForm.reset({
      fullName: user.fullName,
      roleIds: user.roles.map(r => r.id),
    })
    setEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage system users and their roles
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Total users: {users.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="text-destructive text-center">
                <p className="font-semibold">Error loading users</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => {
                setLoading(true)
                fetchUsers()
              }}>
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((role) => (
                          <Badge key={role.id} variant="secondary">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        {user.isActive ? (
                          <Badge variant="success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                        {user.isLocked && (
                          <Badge variant="destructive">
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            LOCKED
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.isLocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlockUser(user.id)}
                          >
                            <Unlock className="h-4 w-4" />
                          </Button>
                        )}
                        {user.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateUser(user.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="user@gigatech.com"
                {...createForm.register('email')}
              />
              {createForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-fullName">Full Name</Label>
              <Input
                id="create-fullName"
                placeholder="John Doe"
                {...createForm.register('fullName')}
              />
              {createForm.formState.errors.fullName && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">Password (PIN)</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Enter PIN"
                {...createForm.register('password')}
              />
              {createForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`create-role-${role.id}`}
                      checked={createForm.watch('roleIds').includes(role.id)}
                      onCheckedChange={(checked) => {
                        const current = createForm.getValues('roleIds')
                        if (checked) {
                          createForm.setValue('roleIds', [...current, role.id])
                        } else {
                          createForm.setValue('roleIds', current.filter(id => id !== role.id))
                        }
                      }}
                    />
                    <Label htmlFor={`create-role-${role.id}`} className="font-normal">
                      {role.name}
                      {role.description && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({role.description})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
              {createForm.formState.errors.roleIds && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.roleIds.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and roles
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={updateForm.handleSubmit(handleUpdateUser)} className="space-y-4">
            <div className="space-y-2">
              <Label>Email (Read-only)</Label>
              <Input
                value={selectedUser?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Full Name</Label>
              <Input
                id="edit-fullName"
                placeholder="John Doe"
                {...updateForm.register('fullName')}
              />
              {updateForm.formState.errors.fullName && (
                <p className="text-sm text-destructive">
                  {updateForm.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-role-${role.id}`}
                      checked={updateForm.watch('roleIds').includes(role.id)}
                      onCheckedChange={(checked) => {
                        const current = updateForm.getValues('roleIds')
                        if (checked) {
                          updateForm.setValue('roleIds', [...current, role.id])
                        } else {
                          updateForm.setValue('roleIds', current.filter(id => id !== role.id))
                        }
                      }}
                    />
                    <Label htmlFor={`edit-role-${role.id}`} className="font-normal">
                      {role.name}
                      {role.description && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({role.description})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
              {updateForm.formState.errors.roleIds && (
                <p className="text-sm text-destructive">
                  {updateForm.formState.errors.roleIds.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
