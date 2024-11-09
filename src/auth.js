import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

export const initAuthStateListener = (onLogin, onLogout) => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            onLogin(user);
        } else {
            onLogout();
        }
    });
};

export const loginWithEmail = async (email, password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
};

export const registerWithEmail = async (email, password) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error('Error en registro:', error);
        throw error;
    }
};

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error('Error en login con Google:', error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error en logout:', error);
        throw error;
    }
};

export { auth }; 