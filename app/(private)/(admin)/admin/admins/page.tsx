'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ShieldCheck,
  UserPlus,
  Loader2,
  Settings2,
  ArrowDownCircle,
  Crown,
} from 'lucide-react';
import Title from '@/components/global/title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdminContext, useUserContext } from '@/lib/contexts';
import {
  updateAdminRole,
  setAdminPermissions as setAdminPermissionsAction,
} from '@/app/actions';

// Keep in sync with backend user.constant.ts (GRANTABLE_PERMISSIONS).
const PERMISSIONS: { key: string; label: string; desc: string }[] = [
  { key: 'manage_caregivers', label: 'Manage Caregivers', desc: 'View & action the Caregivers list' },
  { key: 'manage_agencies', label: 'Manage Agencies', desc: 'View & action the Agencies list' },
  { key: 'review_credentials', label: 'Review Credentials', desc: 'Approve/reject credentials & background checks' },
  { key: 'view_analytics', label: 'View Analytics', desc: 'See the dashboard overview & charts' },
  { key: 'manage_feedback', label: 'Manage Feedback', desc: 'Access the user feedback section' },
];

const AdminsPage = () => {
  const router = useRouter();
  const { user } = useUserContext();
  const { admins, isAdminsLoading, refetchAdmins, users, refetchUsers } =
    useAdminContext();

  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoting, setPromoting] = useState(false);

  const [permTarget, setPermTarget] = useState<any | null>(null);
  const [permSelected, setPermSelected] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const [demoteTarget, setDemoteTarget] = useState<any | null>(null);
  const [demoting, setDemoting] = useState(false);

  // Client-side defense-in-depth guard (middleware is authoritative).
  const notSuperAdmin = !!user && user.role !== 'super_admin';
  useEffect(() => {
    if (notSuperAdmin) router.replace('/admin');
  }, [notSuperAdmin, router]);

  const handlePromote = async () => {
    const email = promoteEmail.trim().toLowerCase();
    if (!email) return toast.error('Enter an email to promote');

    const match = (users || []).find(
      (u: any) => (u.email || '').toLowerCase() === email
    );
    if (!match) {
      return toast.error('No user found with that email');
    }
    if (match.role === 'admin' || match.role === 'super_admin') {
      return toast.error('That user is already an admin');
    }

    setPromoting(true);
    const res = await updateAdminRole(match._id, 'admin');
    setPromoting(false);
    if (res?.success) {
      toast.success(`${email} is now an admin`);
      setPromoteEmail('');
      refetchAdmins();
      refetchUsers();
    } else {
      toast.error(res?.message || 'Failed to promote');
    }
  };

  const openPermissions = (admin: any) => {
    setPermTarget(admin);
    setPermSelected(Array.isArray(admin.permissions) ? admin.permissions : []);
  };

  const togglePerm = (key: string) => {
    setPermSelected((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const savePermissions = async () => {
    if (!permTarget) return;
    setSavingPerms(true);
    const res = await setAdminPermissionsAction(permTarget._id, permSelected);
    setSavingPerms(false);
    if (res?.success) {
      toast.success('Permissions updated');
      setPermTarget(null);
      refetchAdmins();
    } else {
      toast.error(res?.message || 'Failed to update permissions');
    }
  };

  const handleDemote = async () => {
    if (!demoteTarget) return;
    setDemoting(true);
    // Backend restores the account's original role (caregiver/agency); we pass a
    // sensible fallback for accounts promoted before previousRole was tracked.
    const res = await updateAdminRole(
      demoteTarget._id,
      demoteTarget.previousRole || 'pro'
    );
    setDemoting(false);
    if (res?.success) {
      toast.success(`${demoteTarget.email} is no longer an admin`);
      setDemoteTarget(null);
      refetchAdmins();
      refetchUsers();
    } else {
      toast.error(res?.message || 'Failed to demote');
    }
  };

  const renderPermsSummary = (admin: any) => {
    if (admin.role === 'super_admin') {
      return <span className='text-xs text-amber-600 font-medium'>All access</span>;
    }
    const perms: string[] = Array.isArray(admin.permissions)
      ? admin.permissions
      : [];
    if (perms.length === 0) {
      return (
        <span className='text-xs text-gray-500'>Full access (no limits set)</span>
      );
    }
    return (
      <div className='flex flex-wrap gap-1.5'>
        {perms.map((p) => {
          const label = PERMISSIONS.find((x) => x.key === p)?.label || p;
          return (
            <span
              key={p}
              className='inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium'
            >
              {label}
            </span>
          );
        })}
      </div>
    );
  };

  if (notSuperAdmin) return null;

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <ShieldCheck className='w-7 h-7 text-primary' />
        <Title className='mb-0' text='Super Admin' />
      </div>
      <p className='text-sm text-gray-500 -mt-3'>
        Manage who can access the admin panel and what each admin is allowed to do.
      </p>

      {/* Promote a user */}
      <div className='bg-white rounded-2xl border border-gray-100 p-6'>
        <h3 className='text-base font-semibold text-gray-900 mb-1'>
          Add an admin
        </h3>
        <p className='text-sm text-gray-500 mb-4'>
          Promote an existing caregiver or agency account to admin by their email.
        </p>
        <div className='flex flex-col sm:flex-row gap-3'>
          <Input
            value={promoteEmail}
            onChange={(e) => setPromoteEmail(e.target.value)}
            placeholder='user@example.com'
            className='rounded-xl h-12 bg-[#f9f9f9] flex-1'
            onKeyDown={(e) => e.key === 'Enter' && handlePromote()}
          />
          <Button
            onClick={handlePromote}
            disabled={promoting}
            className='h-12 rounded-xl gap-2 px-6'
          >
            {promoting ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <UserPlus className='w-4 h-4' />
            )}
            Make Admin
          </Button>
        </div>
      </div>

      {/* Admins table */}
      <div className='bg-white rounded-2xl border border-gray-100 p-6'>
        <h3 className='text-base font-semibold text-gray-900 mb-4'>
          Admins ({admins?.length || 0})
        </h3>

        {isAdminsLoading ? (
          <div className='flex items-center justify-center py-10'>
            <Loader2 className='w-6 h-6 animate-spin text-primary' />
          </div>
        ) : !admins || admins.length === 0 ? (
          <p className='text-sm text-gray-500 py-6 text-center'>No admins yet.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left text-gray-500 border-b border-gray-100'>
                  <th className='py-3 pr-4 font-medium'>Admin</th>
                  <th className='py-3 pr-4 font-medium'>Role</th>
                  <th className='py-3 pr-4 font-medium'>Permissions</th>
                  <th className='py-3 pr-4 font-medium text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin: any) => {
                  const isSuper = admin.role === 'super_admin';
                  const isSelf = admin._id === user?._id;
                  return (
                    <tr
                      key={admin._id}
                      className='border-b border-gray-50 last:border-0'
                    >
                      <td className='py-4 pr-4'>
                        <div className='font-medium text-gray-900'>
                          {admin.name || admin.email}
                          {isSelf && (
                            <span className='ml-2 text-[11px] text-gray-400'>
                              (you)
                            </span>
                          )}
                        </div>
                        <div className='text-xs text-gray-500'>{admin.email}</div>
                      </td>
                      <td className='py-4 pr-4'>
                        {isSuper ? (
                          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold'>
                            <Crown className='w-3 h-3' /> Super Admin
                          </span>
                        ) : (
                          <span className='inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold'>
                            Admin
                          </span>
                        )}
                      </td>
                      <td className='py-4 pr-4 max-w-[280px]'>
                        {renderPermsSummary(admin)}
                      </td>
                      <td className='py-4 pr-0 text-right'>
                        {isSelf ? (
                          // You can never remove yourself — this is what keeps at
                          // least one super admin on the platform.
                          <span className='text-xs text-gray-400'>—</span>
                        ) : (
                          <div className='flex items-center justify-end gap-2'>
                            {/* Permissions only apply to regular admins; super
                                admins already have full access. */}
                            {!isSuper && (
                              <Button
                                variant='outline'
                                className='h-9 rounded-lg gap-1.5 text-xs'
                                onClick={() => openPermissions(admin)}
                              >
                                <Settings2 className='w-3.5 h-3.5' />
                                Permissions
                              </Button>
                            )}
                            <Button
                              variant='outline'
                              className='h-9 rounded-lg gap-1.5 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600'
                              onClick={() => setDemoteTarget(admin)}
                            >
                              <ArrowDownCircle className='w-3.5 h-3.5' />
                              Remove
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions dialog */}
      <Dialog open={!!permTarget} onOpenChange={(o) => !o && setPermTarget(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              Permissions — {permTarget?.name || permTarget?.email}
            </DialogTitle>
          </DialogHeader>
          <p className='text-xs text-gray-500'>
            Leave everything unchecked to give this admin full access. Check
            specific areas to restrict them to only those.
          </p>
          <div className='flex flex-col gap-3 py-2'>
            {PERMISSIONS.map((p) => (
              <label
                key={p.key}
                className='flex items-start gap-3 cursor-pointer'
              >
                <Checkbox
                  checked={permSelected.includes(p.key)}
                  onCheckedChange={() => togglePerm(p.key)}
                  className='mt-0.5'
                />
                <div>
                  <div className='text-sm font-medium text-gray-900'>
                    {p.label}
                  </div>
                  <div className='text-xs text-gray-500'>{p.desc}</div>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setPermTarget(null)}
              className='rounded-lg'
            >
              Cancel
            </Button>
            <Button
              onClick={savePermissions}
              disabled={savingPerms}
              className='rounded-lg gap-2'
            >
              {savingPerms && <Loader2 className='w-4 h-4 animate-spin' />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demote confirm */}
      <AlertDialog
        open={!!demoteTarget}
        onOpenChange={(o) => !o && setDemoteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {demoteTarget?.role === 'super_admin'
                ? 'Remove super admin?'
                : 'Remove admin access?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {demoteTarget?.role === 'super_admin' ? (
                <>
                  {demoteTarget?.email} will lose super-admin access, including
                  the ability to manage admins, and be returned to a normal
                  account. You can promote them again anytime.
                </>
              ) : (
                <>
                  {demoteTarget?.email} will lose access to the admin panel and
                  be returned to a normal account. You can promote them again
                  anytime.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDemote();
              }}
              className='bg-red-500 hover:bg-red-600'
            >
              {demoting ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                'Remove access'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminsPage;
