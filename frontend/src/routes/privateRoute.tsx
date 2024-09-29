import { Navigate } from 'react-router-dom';
import Cookies from "js-cookie";


// PrivateRoute Component
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    const token = Cookies.get('token');

    // If not authenticated, redirect to the login page
    if (!token) {
        return <Navigate to="/" />;
    }

    // If authenticated, render the children components
    return children;
};

export default PrivateRoute;
