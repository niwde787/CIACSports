import React, { useState, useEffect, useMemo } from 'react';
import { getAllUsers, createUser, deleteUser, updateUser, db } from '../firebase';
import ConfirmationModal from './ConfirmationModal';
import { SpinnerIcon, TrashIcon, EditIcon } from './icons';

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-500/20 text-purple-300',
      coach: 'bg-blue-500/20 text-blue-300',
      viewer: 'bg-gray-500/20 text-gray-300',
      'Not Set': 'bg-yellow-500/20 text-yellow-300',
    };
    const style = styles[role] || styles.viewer;
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${style}`}>{role}</span>;
};

const UserCard: React.FC<{
    user: any;
    isEditing: boolean;
    editFormData: any;
    setEditFormData: (data: any) => void;
    savingId: string | null;
    deletingId: string | null;
    handleSave: (userId: string) => void;
    handleCancel: () => void;
    handleEdit: (user: any) => void;
    handleDeleteUser: (userId: string, userEmail: string) => void;
}> = ({ user, isEditing, editFormData, setEditFormData, savingId, deletingId, handleSave, handleCancel, handleEdit, handleDeleteUser }) => {
    return (
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 space-y-3">
            {isEditing ? (
                 <>
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-[var(--text-secondary)]">Email</label>
                            <input type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-md p-1 w-full text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--text-secondary)]">New Password</label>
                            <input type="password" value={editFormData.newPassword} onChange={e => setEditFormData({...editFormData, newPassword: e.target.value})} placeholder="New Password" className="bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-md p-1 w-full text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--text-secondary)]">Role</label>
                            <select value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})} className="bg-[var(--bg-primary)] border-[var(--border-primary)] rounded-md p-1 w-full text-sm">
                                <option value="coach">Coach</option>
                                <option value="viewer">Viewer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-primary)]">
                        <button onClick={handleCancel} className="px-3 py-1 bg-gray-600 text-white rounded-md text-xs font-bold hover:bg-gray-700">Cancel</button>
                        <button onClick={() => handleSave(user.id)} disabled={savingId === user.id} className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-bold hover:bg-green-600 disabled:bg-gray-500">
                            {savingId === user.id ? <SpinnerIcon className="w-4 h-4" /> : 'Save'}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <p className="font-bold text-base text-white break-all">{user.email}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Created: {user.createdAt}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[var(--border-primary)]">
                        <RoleBadge role={user.role} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(user)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"><EditIcon className="w-5 h-5" /></button>
                            <button 
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                disabled={deletingId === user.id}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full disabled:cursor-not-allowed disabled:text-gray-500"
                            >
                                {deletingId === user.id ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <TrashIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


const AdminUserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'coach' | 'viewer'>('coach');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [isCreating, setIsCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
    
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'regular' | 'admin'>('all');

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const userData = await getAllUsers();
            setUsers(userData);
        } catch (error: any) {
            console.error("Failed to fetch users:", error);
            const message = error.message || "Could not fetch user list. The 'listUsers' backend function may be missing or has failed.";
            setNotification({ type: 'error', message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        if (filter === 'regular') {
            return users.filter(user => user.role === 'coach' || user.role === 'viewer');
        }
        if (filter === 'admin') {
            return users.filter(user => user.role === 'admin');
        }
        return users;
    }, [users, filter]);

    const adminCount = useMemo(() => users.filter(user => user.role === 'admin').length, [users]);
    const regularCount = useMemo(() => users.filter(user => user.role === 'coach' || user.role === 'viewer').length, [users]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setNotification(null);

        if (newPassword.length < 6) {
            setNotification({ type: 'error', message: 'Password must be at least 6 characters long.' });
            return;
        }

        setIsCreating(true);
        try {
            await createUser(newEmail, newPassword, newRole);
            setNotification({ type: 'success', message: `User ${newEmail} created successfully.` });
            setNewEmail('');
            setNewPassword('');
            fetchUsers();
        } catch (error: any) {
            console.error("Cloud function error:", error);
            setNotification({ type: 'error', message: `Error: ${error.message || "Could not create user."}` });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = (userId: string, userEmail: string) => {
        setUserToDelete({ id: userId, email: userEmail });
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        const { id: userId, email: userEmail } = userToDelete;
        
        setDeletingId(userId);
        setNotification(null);
        try {
            await deleteUser(userId);
            setNotification({ type: 'success', message: `User ${userEmail} deleted successfully.` });
            fetchUsers();
        } catch (error: any) {
            console.error("Cloud function error:", error);
            setNotification({ type: 'error', message: `Error: ${error.message || "Could not delete user."}` });
        } finally {
            setDeletingId(null);
            setUserToDelete(null);
        }
    };

    const handleEdit = (user: any) => {
        setEditingUserId(user.id);
        setEditFormData({ email: user.email, role: user.role, newPassword: '' });
    };

    const handleCancel = () => {
        setEditingUserId(null);
        setEditFormData({});
    };
    
    const handleSave = async (userId: string) => {
        setSavingId(userId);
        setNotification(null);
        const originalUser = users.find(u => u.id === userId);
        const updates: { email?: string; password?: string; } = {};
        
        if (editFormData.email !== originalUser.email) {
            updates.email = editFormData.email;
        }
        if (editFormData.newPassword) {
            if (editFormData.newPassword.length < 6) {
                setNotification({ type: 'error', message: 'New password must be at least 6 characters long.' });
                setSavingId(null);
                return;
            }
            updates.password = editFormData.newPassword;
        }

        const roleChanged = editFormData.role !== originalUser.role;
        const authChanged = Object.keys(updates).length > 0;

        if (!roleChanged && !authChanged) {
            setEditingUserId(null);
            setSavingId(null);
            return;
        }

        try {
            if (authChanged) {
                await updateUser(userId, updates);
            }
            if (roleChanged) {
                await db.collection('users').doc(userId).update({ role: editFormData.role });
            }
            
            setNotification({ type: 'success', message: 'User updated successfully.' });
            setEditingUserId(null);
            fetchUsers();

        } catch (error: any) {
            setNotification({ type: 'error', message: `Update failed: ${error.message || "An unknown error occurred."}` });
        } finally {
            setSavingId(null);
        }
    };

    const filterButtonClass = "flex-1 py-3 px-2 text-sm font-bold border-b-2 transition-colors duration-200 focus:outline-none focus:bg-white/5";
    const activeFilterClass = "border-[var(--accent-primary)] text-[var(--accent-primary)]";
    const inactiveFilterClass = "border-transparent text-[var(--text-secondary)] hover:text-white";

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold">User Management</h2>
                <p className="text-md text-[var(--text-secondary)] mt-1">View, create, and manage all registered accounts.</p>
            </div>
            
            {notification && (
                <div className={`p-3 text-sm rounded-lg ${notification.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`} role="alert">
                    {notification.message}
                </div>
            )}

            <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                 <div className="flex border-b border-[var(--border-primary)]">
                    <button onClick={() => setFilter('all')} className={`${filterButtonClass} ${filter === 'all' ? activeFilterClass : inactiveFilterClass}`}>All ({users.length})</button>
                    <button onClick={() => setFilter('regular')} className={`${filterButtonClass} ${filter === 'regular' ? activeFilterClass : inactiveFilterClass}`}>Coaches & Viewers ({regularCount})</button>
                    <button onClick={() => setFilter('admin')} className={`${filterButtonClass} ${filter === 'admin' ? activeFilterClass : inactiveFilterClass}`}>Admins ({adminCount})</button>
                 </div>
                 
                 {/* Desktop Table View */}
                 <div className="overflow-x-auto hidden md:block">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48"><SpinnerIcon className="w-8 h-8 text-[var(--accent-primary)]" /></div>
                    ) : (
                        <table className="min-w-full divide-y divide-[var(--border-primary)]">
                            <thead className="bg-[var(--bg-tertiary)]/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Username / Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Password</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-primary)]">
                                {filteredUsers.map(user => {
                                    const isEditing = editingUserId === user.id;
                                    return (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {isEditing ? (
                                                    <input type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-1 w-full" />
                                                ) : <span className="text-[var(--text-primary)]">{user.email}</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                 {isEditing ? (
                                                    <input type="password" value={editFormData.newPassword} onChange={e => setEditFormData({...editFormData, newPassword: e.target.value})} placeholder="New Password" className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-1 w-full" />
                                                ) : <span>********</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {isEditing ? (
                                                    <select value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})} className="bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-1 w-full">
                                                        <option value="coach">Coach</option>
                                                        <option value="viewer">Viewer</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                ) : <RoleBadge role={user.role} />}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{user.createdAt}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {isEditing ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleSave(user.id)} disabled={savingId === user.id} className="px-3 py-1 bg-green-500 text-white rounded-md text-xs font-bold hover:bg-green-600 disabled:bg-gray-500">
                                                            {savingId === user.id ? <SpinnerIcon className="w-4 h-4" /> : 'Save'}
                                                        </button>
                                                        <button onClick={handleCancel} className="px-3 py-1 bg-gray-600 text-white rounded-md text-xs font-bold hover:bg-gray-700">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleEdit(user)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"><EditIcon className="w-5 h-5" /></button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id, user.email)}
                                                            disabled={deletingId === user.id}
                                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full disabled:cursor-not-allowed disabled:text-gray-500"
                                                            aria-label={`Delete user ${user.email}`}
                                                        >
                                                            {deletingId === user.id ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <TrashIcon className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                 </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48"><SpinnerIcon className="w-8 h-8 text-[var(--accent-primary)]" /></div>
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                            <UserCard 
                                key={user.id}
                                user={user}
                                isEditing={editingUserId === user.id}
                                editFormData={editFormData}
                                setEditFormData={setEditFormData}
                                savingId={savingId}
                                deletingId={deletingId}
                                handleSave={handleSave}
                                handleCancel={handleCancel}
                                handleEdit={handleEdit}
                                handleDeleteUser={handleDeleteUser}
                            />
                        ))
                    ) : (
                        <p className="text-center py-8 text-[var(--text-secondary)]">
                            {users.length > 0 ? 'No users match the current filter.' : 'No registered users found.'}
                        </p>
                    )}
                </div>

                {!isLoading && (filteredUsers.length === 0 && users.length > 0) && (
                    <p className="md:hidden text-center py-8 text-[var(--text-secondary)]">No users match the current filter.</p>
                )}
                 {!isLoading && (users.length === 0) && (
                    <p className="md:hidden text-center py-8 text-[var(--text-secondary)]">No registered users found.</p>
                )}
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                <h3 className="text-lg font-bold p-4 border-b border-[var(--border-primary)]">Create New User</h3>
                <form onSubmit={handleCreateUser} className="p-4 space-y-4">
                    <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] p-2 rounded-md">
                        <strong>Note:</strong> This action calls a secure backend function. If it fails, the function may not be deployed.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="new-email" className="block text-sm font-medium text-[var(--text-secondary)]">Email</label>
                            <input
                                id="new-email"
                                type="email"
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                required
                                placeholder="new.user@example.com"
                                className="mt-1 w-full bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2"
                                disabled={isCreating}
                            />
                        </div>
                         <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-[var(--text-secondary)]">Password</label>
                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="••••••••"
                                className="mt-1 w-full bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2"
                                disabled={isCreating}
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="new-role" className="block text-sm font-medium text-[var(--text-secondary)]">Role</label>
                        <select
                            id="new-role"
                            value={newRole}
                            onChange={e => setNewRole(e.target.value as any)}
                            className="mt-1 w-full bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2"
                            disabled={isCreating}
                        >
                            <option value="coach">Coach</option>
                            <option value="viewer">Viewer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isCreating} className="flex items-center justify-center gap-2 w-32 px-4 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:bg-gray-500 disabled:cursor-wait">
                            {isCreating ? <SpinnerIcon className="w-5 h-5" /> : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
            {userToDelete && (
                <ConfirmationModal
                    isOpen={!!userToDelete}
                    onClose={() => setUserToDelete(null)}
                    onConfirm={confirmDeleteUser}
                    title="Delete User"
                    message={`Are you sure you want to delete the user ${userToDelete.email}? This action is irreversible and will delete all associated team data.`}
                />
            )}
        </div>
    );
};

export default AdminUserManagement;
