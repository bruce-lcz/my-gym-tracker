import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { APP_CONFIG } from './config';
import { User } from './types';

interface AuthContextType {
    isAuthenticated: boolean;
    currentUser: User | null;
    login: (password: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        // 檢查 sessionStorage 中是否有認證標記
        const authFlag = sessionStorage.getItem('gym_tracker_auth');
        const savedUser = sessionStorage.getItem('gym_tracker_user') as User | null;
        if (authFlag === 'true' && savedUser) {
            setIsAuthenticated(true);
            setCurrentUser(savedUser);
        }
    }, []);

    const login = (password: string): boolean => {
        let user: User | null = null;

        if (password === APP_CONFIG.brucePassword) {
            user = 'Bruce';
        } else if (password === APP_CONFIG.lindaPassword) {
            user = 'Linda';
        }

        if (user) {
            setIsAuthenticated(true);
            setCurrentUser(user);
            sessionStorage.setItem('gym_tracker_auth', 'true');
            sessionStorage.setItem('gym_tracker_user', user);
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        sessionStorage.removeItem('gym_tracker_auth');
        sessionStorage.removeItem('gym_tracker_user');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
