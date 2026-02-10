import liff from '@line/liff';
import Cookies from 'js-cookie';

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class AuthLib {
    static async initLiff() {
        try {
            console.log('AuthLib: Initializing LIFF with ID', LIFF_ID);
            await liff.init({ liffId: LIFF_ID });
            console.log('AuthLib: LIFF Initialized successfully');
            return liff;
        } catch (error) {
            console.error('LIFF Init Error:', error);
            return null;
        }
    }

    static async loginWithLine() {
        if (!liff.isInClient() && !liff.isLoggedIn()) {
            // Use default redirect URI from LINE Developer Console
            console.log('🔐 Starting LINE login (using default redirect URI)');
            liff.login();
            return null;
        } else if (liff.isLoggedIn()) {
            const idToken = liff.getIDToken();
            const profile = await liff.getProfile();
            return await this.backendLogin(idToken, profile);
        }
        return null;
    }

    static async backendLogin(idToken: string | null, profile: any) {
        if (!idToken) return null;

        try {
            console.log('Sending login request to backend...');
            const response = await fetch(`${API_URL}/auth/line/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken,
                    clientId: LIFF_ID,
                    userProfile: profile,
                }),
            });

            console.log('Backend response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend Login Success:', data);
                console.log('📝 Setting cookie with token:', data.access_token.substring(0, 20) + '...');

                // Set cookie with proper options
                Cookies.set('token', data.access_token, {
                    expires: 7,
                    path: '/',
                    sameSite: 'Lax'
                });

                // Verify cookie was set
                const verifyToken = Cookies.get('token');
                console.log('🔍 Cookie verification:', verifyToken ? '✅ SUCCESS' : '❌ FAILED');
                console.log('🍪 All cookies:', document.cookie);

                return data.user;
            } else {
                const text = await response.text();
                console.error('Backend Login Failed:', text);
                return null;
            }
        } catch (error) {
            console.error('Login API Error:', error);
            return null;
        }
    }

    static logout() {
        if (liff.isLoggedIn()) {
            liff.logout();
        }
        Cookies.remove('token');
        window.location.reload();
    }
}
