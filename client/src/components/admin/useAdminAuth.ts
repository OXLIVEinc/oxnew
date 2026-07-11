import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

/**
 * Admin-page guard, now backed by the shared AuthContext instead of doing
 * its own session/profile/role fetch.
 */
export function useAdminAuth() {
  const { authUser, isAdmin, loading, signOut: authSignOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (!authUser) {
      navigate('/');
      return;
    }

    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [loading, authUser, isAdmin, navigate, toast]);

  const signOut = async () => {
    try {
      await authSignOut();
      navigate('/');
    } catch (error: any) {
      console.error('Failed to sign out:', error);
      toast({
        title: 'Error',
        description: error.message ?? 'Failed to sign out.',
        variant: 'destructive',
      });
    }
  };

  return { user: authUser, isAdmin, loading, signOut };
}
