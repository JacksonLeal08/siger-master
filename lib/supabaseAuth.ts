import { supabase } from './supabaseClient';
import { resolveEmailByUsernameAction, syncSessionCookieAction, clearSessionCookieAction } from '@/app/actions/userActions';

export interface CompatibleUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const mapSupabaseUser = (sbUser: any): CompatibleUser => {
  return {
    uid: sbUser.id,
    email: sbUser.email || null,
    displayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || null,
    photoURL: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null
  };
};

export const initAuth = (
  onAuthSuccess?: (user: CompatibleUser) => void,
  onAuthFailure?: () => void
) => {
  let lastProcessedUserId: string | null = null;

  const handleSession = (session: any) => {
    if (session && session.user) {
      if (typeof document !== 'undefined' && session.access_token) {
        const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `spci_session_token=${session.access_token}; path=/; max-age=86400; SameSite=Lax${isSecure}`;
        // Sincronização atômica de cookies no servidor
        syncSessionCookieAction({ token: session.access_token }).catch(() => {});
      }
      if (lastProcessedUserId !== session.user.id) {
        lastProcessedUserId = session.user.id;
        if (onAuthSuccess) {
          onAuthSuccess(mapSupabaseUser(session.user));
        }
      }
    } else {
      if (lastProcessedUserId !== null) {
        lastProcessedUserId = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  };

  // Listen for auth state changes (centralized: handles SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      lastProcessedUserId = null;
      clearSessionCookieAction().catch(() => {});
      if (onAuthFailure) onAuthFailure();
      return;
    }
    // Renew session cookie on TOKEN_REFRESHED to keep middleware in sync
    if (event === 'TOKEN_REFRESHED' && session?.access_token) {
      if (typeof document !== 'undefined') {
        const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `spci_session_token=${session.access_token}; path=/; max-age=86400; SameSite=Lax${isSecure}`;
        syncSessionCookieAction({ token: session.access_token }).catch(() => {});
      }
    }
    handleSession(session);
  });

  // Check current session immediately on startup for faster bootstrap
  supabase.auth.getSession().then(({ data: { session } }) => {
    handleSession(session);
  }).catch((err) => {
    console.warn('[SupabaseAuth] Falha ao ler sessão inicial:', err);
  });

  return () => {
    subscription.unsubscribe();
  };
};

export const googleSignIn = async (): Promise<null> => {
  try {
    const redirectToUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectToUrl
      }
    });

    if (error) throw error;
    return null;
  } catch (error: any) {
    console.error('Erro de Autenticação Supabase:', error);
    throw error;
  }
};

/**
 * Efetua login hibrido aceitando tanto o e-mail quanto o user_name do usuario.
 * Utiliza Server Action resiliente com auto-cura e fallback para RPC.
 */
export const signInWithEmailOrUsername = async (identifier: string, password: string): Promise<CompatibleUser | null> => {
  try {
    let email = identifier.trim();
    
    // Remove leading '@' if typed by the user as part of their username (e.g. '@jfleal' -> 'jfleal')
    if (email.startsWith('@')) {
      email = email.slice(1);
    }

    // Strict regex to check if the identifier is a valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(email);

    // If it is not a valid email, assume it's a username and resolve via Server Action with RPC fallback
    if (!isEmail) {
      let resolvedEmail: string | null = null;

      // 1. Tenta resolver via Server Action com privilégios Admin e auto-cura na tabela usuarios
      try {
        const actionRes = await resolveEmailByUsernameAction(email);
        if (actionRes?.success && actionRes.email) {
          resolvedEmail = actionRes.email;
        }
      } catch (actErr) {
        console.warn('Falha na Server Action de resolução de username, tentando RPC:', actErr);
      }

      // 2. Fallback para RPC se o Server Action não encontrar
      if (!resolvedEmail) {
        try {
          const { data, error: lookupError } = await supabase.rpc('get_email_by_username', {
            p_username: email
          });

          if (!lookupError && data) {
            resolvedEmail = data;
          }
        } catch (rpcErr) {
          console.warn('Falha no RPC get_email_by_username:', rpcErr);
        }
      }

      if (!resolvedEmail) {
        throw new Error('Nome de usuário não cadastrado no sistema.');
      }
      email = resolvedEmail;
    }

    // Efetua autenticacao tradicional por email/senha no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;
    if (authData?.session?.access_token) {
      if (typeof document !== 'undefined') {
        const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `spci_session_token=${authData.session.access_token}; path=/; max-age=86400; SameSite=Lax${isSecure}`;
      }
      try {
        await syncSessionCookieAction({ token: authData.session.access_token });
      } catch (cErr) {
        console.warn('[SupabaseAuth] Falha ao sincronizar cookie no servidor:', cErr);
      }
    }
    return mapSupabaseUser(authData.user);
  } catch (error: any) {
    console.error('Erro em signInWithEmailOrUsername:', error);
    const msg = String(error?.message || '');
    if (
      msg.toLowerCase().includes('failed to fetch') ||
      msg.toLowerCase().includes('fetch failed') ||
      msg.toLowerCase().includes('networkerror')
    ) {
      throw new Error('Não foi possível conectar ao servidor Supabase. O projeto pode estar pausado por inatividade ou sem acesso à rede.');
    }
    throw error;
  }
};

export const logout = async () => {
  try {
    await clearSessionCookieAction();
  } catch {}
  await supabase.auth.signOut();
};
