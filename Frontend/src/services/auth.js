import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router-dom';

export const useLogout = () => {
  const [cookie, removeCookie] = useCookies(['token']);
  const navigate = useNavigate();

  const logout = () => {
    console.log('Before logout:'); // Log cookies before logout
    removeCookie('token', { path: '/' }); // Ensure path matches where the cookie was set
    console.log('After logout:'); // Log cookies after logout
    navigate('/login'); // Redirect to the login page after logout
  };

  return logout;
};

export const getUser = async(token) => {
    if (!token) return null;

    try {
        const user = await fetch(`https://backend-laplace0-0-laplace0-0s-projects.vercel.app/api/getuser/${token}`);
        return user.json()
    } catch (error) {
        return null; // Return null if token verification fails
    }
    
}


