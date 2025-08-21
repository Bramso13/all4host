import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authClient } from '~/lib/auth-client';

interface SavedAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  lastUsed: string;
  password: string;
}

interface AccountSwitcherContextType {
  savedAccounts: SavedAccount[];
  currentAccount: SavedAccount | null;
  isLoading: boolean;
  addAccount: (email: string, password: string) => Promise<void>;
  switchToAccount: (accountId: string) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

const AccountSwitcherContext = createContext<AccountSwitcherContextType | null>(null);

const STORAGE_KEY = 'saved_accounts';

export const AccountSwitcherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<SavedAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedAccounts();
  }, []);

  const { data: session } = authClient.useSession();
  useEffect(() => {
    if (session?.user) {
      const account: SavedAccount = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || session.user.email,
        role: (session.user as any).role || 'user',
        lastUsed: new Date().toISOString(),
        password: ''
      };
      setCurrentAccount(account);
    } else {
      setCurrentAccount(null);
    }
  }, [session]);

  const loadSavedAccounts = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const accounts = JSON.parse(stored);
        setSavedAccounts(accounts);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des comptes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAccountsToStorage = async (accounts: SavedAccount[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des comptes:', error);
    }
  };

  const addAccount = async (email: string, password: string) => {
    try {
      const signInResult = await authClient.signIn.email({
        email,
        password,
      });

      if (signInResult.data?.user) {
        const user = signInResult.data.user;
        const account: SavedAccount = {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: (user as any).role || 'user',
          lastUsed: new Date().toISOString(),
          password: password
        };

        const existingIndex = savedAccounts.findIndex(acc => acc.id === account.id);
        let newAccounts;
        
        if (existingIndex >= 0) {
          newAccounts = [...savedAccounts];
          newAccounts[existingIndex] = account;
        } else {
          newAccounts = [...savedAccounts, account];
        }

        newAccounts.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());

        setSavedAccounts(newAccounts);
        await saveAccountsToStorage(newAccounts);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du compte:', error);
      throw error;
    }
  };

  const switchToAccount = async (accountId: string) => {
    try {
      const account = savedAccounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('Compte non trouvé');
      }

      await authClient.signOut();

      const signInResult = await authClient.signIn.email({
        email: account.email,
        password: account.password,
      });

      if (signInResult.data?.user) {
        const updatedAccount = { ...account, lastUsed: new Date().toISOString() };
        const newAccounts = savedAccounts.map(acc => 
          acc.id === accountId ? updatedAccount : acc
        );
        newAccounts.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
        
        setSavedAccounts(newAccounts);
        await saveAccountsToStorage(newAccounts);
      }
    } catch (error) {
      console.error('Erreur lors du changement de compte:', error);
      throw error;
    }
  };

  const removeAccount = async (accountId: string) => {
    try {
      const newAccounts = savedAccounts.filter(acc => acc.id !== accountId);
      setSavedAccounts(newAccounts);
      await saveAccountsToStorage(newAccounts);

      if (currentAccount?.id === accountId) {
        await authClient.signOut();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
    }
  };

  const refreshAccounts = async () => {
    await loadSavedAccounts();
  };

  const value: AccountSwitcherContextType = {
    savedAccounts,
    currentAccount,
    isLoading,
    addAccount,
    switchToAccount,
    removeAccount,
    refreshAccounts,
  };

  return (
    <AccountSwitcherContext.Provider value={value}>
      {children}
    </AccountSwitcherContext.Provider>
  );
};

export const useAccountSwitcher = () => {
  const context = useContext(AccountSwitcherContext);
  if (!context) {
    throw new Error('useAccountSwitcher doit être utilisé dans AccountSwitcherProvider');
  }
  return context;
};