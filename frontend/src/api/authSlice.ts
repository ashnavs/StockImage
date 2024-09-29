import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
}

interface AuthState {
    token: string | null; // Can be null if not authenticated
    user: User | null;    // User details
}

const initialState: AuthState = {
    token: null, // Default to null
    user: null,  // Default to null
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken(state, action: PayloadAction<string>) {
            state.token = action.payload; // Store the token in state
        },
        setUser(state, action: PayloadAction<User>) {
            state.user = action.payload; // Store user information
        },
        clearAuth(state) {
            state.token = null; 
            state.user = null;  
        },
    },
});


export const { setToken, setUser, clearAuth } = authSlice.actions;


export default authSlice.reducer;
