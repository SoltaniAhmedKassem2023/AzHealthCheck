/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

const LoginPage = () => {
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const [user, setUser] = useState('');
    const [error, setError] = useState('');

    const router = useRouter();
    const handleLogin = async () => {
    setError('');

    try {
        console.log(user,password)
        const response = await fetch('http://localhost:8000/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user,    
                password: password,
            }),
        });
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('isAuthenticated', true);
        router.push('/'); 
    } catch (err) {
        console.error('Login error:', err);
        setError('Invalid username or password');
    }
};

    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    return (
        <div className={containerClassName}
        style={{ 
            backgroundImage: "url('/layout/images/bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`/layout/images/logo.png`} alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-3xl font-medium mb-3">Welcome To Your Health Check</div>
                            <span className="text-600 font-medium">Sign in to continue</span>
                        </div>

                        <div>
                            <label htmlFor="user" className="block text-900 text-xl font-medium mb-2">
                                Username
                            </label>
                            <InputText id="user" type="text" placeholder="user name" className="w-full md:w-30rem mb-5" style={{ padding: '1rem' }} 
                             onChange={(e) => setUser(e.target.value)}/>

                            <label htmlFor="password1" className="block text-900 font-medium text-xl mb-2">
                                Password
                            </label>
                            <Password inputId="password1" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" toggleMask className="w-full mb-5" inputClassName="w-full p-3 md:w-30rem"></Password>
                            {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                           
                            </div>
                            <Button label="Sign In" className="w-full p-3 text-xl" onClick={handleLogin}></Button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
