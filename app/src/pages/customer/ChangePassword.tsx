import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Eye, EyeOff, KeyRound, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, refreshContext } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!user?.email) {
      setError('Please sign in again before changing your password.');
      return;
    }

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (!newPassword) {
      setError('New password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setSubmitting(true);

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      setSubmitting(false);
      setError('Current password is incorrect. Please try again.');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message || 'Unable to update password. Please try again.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    await refreshContext();
    setSuccess('Password updated successfully. Use your new password next time you sign in.');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 py-8">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <KeyRound size={26} />
          </div>
          <h1 className="mb-2 text-xl font-extrabold text-gray-900">Sign in required</h1>
          <p className="mb-5 text-sm text-neutral-500">Please sign in to change your password.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="h-12 w-full rounded-2xl bg-amber-500 font-bold text-white"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="rounded-b-[2rem] bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 px-4 pb-8 pt-6 text-white shadow-lg shadow-amber-500/20">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-white/85"
          >
            <ArrowLeft size={18} />
            Back to Account
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-amber-600 shadow-md">
              <KeyRound size={28} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Security</p>
              <h1 className="text-2xl font-extrabold">Change Password</h1>
              <p className="mt-1 text-sm text-white/80">Keep your Shop2Bhutan account secure.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-4 max-w-md px-4">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white p-4 shadow-sm">
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          {[
            {
              label: 'Current Password',
              value: currentPassword,
              setter: setCurrentPassword,
              placeholder: 'Enter current password',
            },
            {
              label: 'New Password',
              value: newPassword,
              setter: setNewPassword,
              placeholder: 'Min 6 characters',
            },
            {
              label: 'Confirm New Password',
              value: confirmPassword,
              setter: setConfirmPassword,
              placeholder: 'Confirm new password',
            },
          ].map((field) => (
            <div key={field.label}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-600">
                {field.label}
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={field.value}
                  onChange={(event) => {
                    field.setter(event.target.value);
                    setError('');
                    setSuccess('');
                  }}
                  placeholder={field.placeholder}
                  className="h-12 w-full rounded-2xl border border-neutral-200 pl-10 pr-11 text-sm outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ))}

          <div className="rounded-2xl bg-neutral-50 p-3">
            <p className="text-xs font-bold text-neutral-700">Password tip</p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Use a password that is hard to guess and different from other apps.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
