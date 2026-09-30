import { useAuthStore } from '../app/store';
import { authApi } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token, user } = res.data.data;
    setAuth(user, token);
    toast.success(`Welcome back, ${user.name}!`);
    navigate('/dashboard');
    return user;
  };

  const logoutUser = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return { user, token, isAuthenticated, login, logout: logoutUser };
};
