"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function GroupMembersPage({ params }: { params: { id: string } }) {
  const groupId = params.id
  const [members, setMembers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [newRole, setNewRole] = useState({ name: "", description: "" })
  const [roleEdit, setRoleEdit] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch members and roles
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [membersRes, rolesRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/members`).then(r => r.json()),
        fetch(`/api/groups/${groupId}/roles`).then(r => r.json()),
      ])
      setMembers(membersRes)
      setRoles(rolesRes)
      setLoading(false)
    }
    fetchData()
  }, [groupId])

  // Change member role
  async function handleRoleChange(userId: string, roleId: number) {
    await fetch(`/api/groups/${groupId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, role_id: roleId }),
    })
    setMembers(members => members.map(m => m.user_id === userId ? { ...m, role_id: roleId } : m))
  }

  // Remove member
  async function handleRemove(userId: string) {
    await fetch(`/api/groups/${groupId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    })
    setMembers(members => members.filter(m => m.user_id !== userId))
  }

  // Invite new member (by email, demo only)
  async function handleInvite() {
    // In a real app, you would look up the user by email and send an invite
    setSuccess("Invite sent (demo only)")
    setInviteEmail("")
  }

  // Add or edit role
  async function handleRoleSave() {
    if (roleEdit) {
      // Edit
      await fetch(`/api/groups/${groupId}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: roleEdit.id, ...roleEdit }),
      })
      setRoles(roles => roles.map(r => r.id === roleEdit.id ? { ...r, ...roleEdit } : r))
      setRoleEdit(null)
    } else {
      // Add
      const res = await fetch(`/api/groups/${groupId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      })
      const data = await res.json()
      setRoles(roles => [...roles, data])
      setNewRole({ name: "", description: "" })
    }
  }

  // Delete role
  async function handleRoleDelete(roleId: number) {
    await fetch(`/api/groups/${groupId}/roles`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_id: roleId }),
    })
    setRoles(roles => roles.filter(r => r.id !== roleId))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Group Members & Roles</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {loading ? <div>Loading...</div> : (
        <>
          {/* Members Table */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Members</h2>
            <table className="min-w-full border rounded">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Role</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.user_id} className="border-t">
                    <td className="p-2">{member.user?.name || member.user_id}</td>
                    <td className="p-2">{member.user?.email || "-"}</td>
                    <td className="p-2">
                      <select
                        value={member.role_id || ''}
                        onChange={e => handleRoleChange(member.user_id, Number(e.target.value))}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">None</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">{member.status}</td>
                    <td className="p-2">
                      <Button variant="destructive" size="sm" onClick={() => handleRemove(member.user_id)}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Invite form (demo) */}
            <div className="mt-4 flex gap-2 items-center">
              <Input
                placeholder="Invite by email (demo)"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-64"
              />
              <Button onClick={handleInvite}>Invite</Button>
            </div>
          </div>

          {/* Roles Table */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Roles</h2>
            <table className="min-w-full border rounded">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id} className="border-t">
                    <td className="p-2">
                      {roleEdit && roleEdit.id === role.id ? (
                        <Input value={roleEdit.name} onChange={e => setRoleEdit({ ...roleEdit, name: e.target.value })} />
                      ) : (
                        role.name
                      )}
                    </td>
                    <td className="p-2">
                      {roleEdit && roleEdit.id === role.id ? (
                        <Input value={roleEdit.description} onChange={e => setRoleEdit({ ...roleEdit, description: e.target.value })} />
                      ) : (
                        role.description
                      )}
                    </td>
                    <td className="p-2 flex gap-2">
                      {roleEdit && roleEdit.id === role.id ? (
                        <>
                          <Button size="sm" onClick={handleRoleSave}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setRoleEdit(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setRoleEdit(role)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRoleDelete(role.id)}>Delete</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Add new role row */}
                <tr>
                  <td className="p-2">
                    <Input
                      placeholder="Role name"
                      value={newRole.name}
                      onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      placeholder="Description"
                      value={newRole.description}
                      onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <Button size="sm" onClick={handleRoleSave}>Add</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
} 