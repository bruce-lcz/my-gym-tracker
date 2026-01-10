import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { APP_CONFIG } from './config';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // 檢查 sessionStorage 中是否有認證標記
        const authFlag = sessionStorage.getItem('gym_tracker_auth');
        if (authFlag === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const login = (password: string): boolean => {
        if (password === APP_CONFIG.accessPassword) {
            setIsAuthenticated(true);
            sessionStorage.setItem('gym_tracker_auth', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('gym_tracker_auth');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
