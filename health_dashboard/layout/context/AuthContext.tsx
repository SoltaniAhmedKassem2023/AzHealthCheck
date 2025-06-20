'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const router = useRouter();
    const isAuthenticated = false
    // Check token on mount
    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            setUser({}); // just a dummy user object; ideally you’d decode token or fetch user info
        }
    }, []);

    const login = (access, refresh) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        const isAuthenticated = localStorage.getItem("IsAuthenticated");

        setUser({});
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem("IsAuthenticated");
        setUser(null);
        router.push('/auth/login');
    };


    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
