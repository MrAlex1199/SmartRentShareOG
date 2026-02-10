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
            liff.login();
        } else if (liff.isLoggedIn()) {
            const idToken = liff.getIDToken();
            const profile = await liff.getProfile();
            return this.backendLogin(idToken, profile);
        }
    }

    static async backendLogin(idToken: string | null, profile: any) {
        if (!idToken) return;

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
                console.log('Login Success:', data);
                Cookies.set('token', data.access_token, { expires: 7 });
                return data.user;
            } else {
                const text = await response.text();
                console.error('Backend Login Failed:', text);
            }
        } catch (error) {
            console.error('Login API Error:', error);
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
