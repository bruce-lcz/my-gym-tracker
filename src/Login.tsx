import { useState, FormEvent } from 'react';
import { useAuth } from './AuthContext';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import './login.css';

export default function Login() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const [isShaking, setIsShaking] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsShaking(false);

        if (!password.trim()) {
            setError('請輸入密碼');
            setIsShaking(true);
            return;
        }

        const success = login(password);
        if (!success) {
            setError('密碼錯誤，請重試');
            setPassword('');
            setIsShaking(true);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-icon-wrapper">
                        <Lock size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="login-title">健身追蹤系統</h1>
                    <p className="login-subtitle">請輸入存取密碼以繼續</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="password" className="input-label">密碼</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) {
                                        setError('');
                                        setIsShaking(false);
                                    }
                                }}
                                className="password-input"
                                placeholder="輸入存取密碼"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="toggle-password"
                                tabIndex={-1}
                                aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                        {error && (
                            <p className={`error ${isShaking ? 'shake' : ''}`}>
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary login-btn"
                    >
                        登入系統
                    </button>
                </form>

                <div className="login-footer">
                    <ShieldCheck size={14} />
                    <span>安全性驗證已啟用</span>
                </div>
            </div>
        </div>
    );
}
