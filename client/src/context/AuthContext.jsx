import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const DEBUG = import.meta.env.DEV;

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const updateCurrentUser = (updatedData) => {
    if (DEBUG) {
      console.log('Updating currentUser with:', updatedData);
    }
    
    setCurrentUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        ...updatedData,
      };
      
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      if (DEBUG) {
        console.log('Updated currentUser:', updatedUser);
      }
      
      return updatedUser;
    });
  };

  const refreshCurrentUser = async () => {
    if (!isAuthenticated()) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetchAPI('/auth/me', {
        method: 'GET',
        credentials: 'include',
      }, 15000, true);
      
      if (response.success && response.user) {
        setCurrentUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        if (DEBUG) {
          console.log('User data refreshed:', response.user);
        }
        return response.user;
      } else {
        console.warn('No user data in response:', response);
        setError('Failed to refresh profile data.');
      }
    } catch (err) {
      console.error('Error refreshing user:', err.message);
      if (err.message.includes('Route non trouvée') || err.message.includes('404')) {
        console.warn('Auth/me endpoint not found. Falling back to localStorage.');
        setError('Unable to refresh profile. Please try again later.');
      } else if (err.message.includes('401') || err.message.includes('Invalid token')) {
        console.warn('Invalid token detected. Logging out.');
        logout();
      } else {
        setError('Error refreshing profile: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAPI = async (endpoint, options = {}, timeout = 15000, skipAuthError = false) => {
  let controller;
  let timeoutId;

  try {
    const token = localStorage.getItem('token');

    if (DEBUG) {
      console.log('API Request to:', `${API_BASE_URL}${endpoint}`);
      console.log('Token present:', !!token);
    }

    const headers = {
      ...options.headers,
    };

    // Ne pas définir Content-Type pour FormData (laissez le navigateur le faire)
    // Ne définir Content-Type que si ce n'est pas FormData et qu'il n'est pas déjà défini
    const isFormData = options.body instanceof FormData;
    if (!isFormData && !options.responseType && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      credentials: 'include',
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (DEBUG) {
      console.log('Response status:', response.status);
    }

    if (response.status === 401 && !skipAuthError) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errorData = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.message || errorJson.error || `HTTP Error: ${response.status}`;
      } catch {
        errorMessage = errorData || `HTTP Error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    // Gérer les réponses de type blob (par exemple, pour les téléchargements de fichiers)
    if (options.responseType === 'blob') {
      return await response.blob();
    }

    // Gérer les réponses JSON
    const data = await response.json();

    if (DEBUG) {
      console.log('Response data:', data);
    }

    return data;
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }

    console.error('API Error:', error.message);
    throw error;
  }
};

  const register = async (userData) => {
    setLoading(true);
    setError('');

    if (!userData.email || !userData.password) {
      setError('Email and password are required');
      setLoading(false);
      return { success: false, message: 'Email and password are required' };
    }

    if (userData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return { success: false, message: 'Password must be at least 6 characters long' };
    }

    try {
      const data = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return data;
    } catch (error) {
      const errorMessage = error.message || 'Error during registration';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setError('');

    if (!credentials.email || !credentials.password) {
      setError('Email and password are required');
      setLoading(false);
      return { success: false, message: 'Email and password are required' };
    }

    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        credentials: 'include',
      }, 15000, true);

      if (data.success && data.data?.user) {
        const userData = data.data.user;
        setCurrentUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (data.data.token) {
          localStorage.setItem('token', data.data.token);
        }
        return data;
      } else {
        let errorMessage = 'Login failed';
        if (data.message?.includes('Invalid email') || data.message?.includes('User not found')) {
          errorMessage = 'No account found with this email address';
        } else if (data.message?.includes('Invalid password') || data.message?.includes('Incorrect password')) {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (data.message?.includes('account') && data.message?.includes('inactive')) {
          errorMessage = 'Your account is deactivated. Please contact support.';
        } else {
          errorMessage = data.message || 'Invalid email or password';
        }
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      let errorMessage = 'Error during login';
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        errorMessage = 'No account found with this email address';
      } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('Session expired')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message || 'Invalid email or password';
      }
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetchAPI('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during server-side logout:', error);
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setLoading(false);
      if (DEBUG) {
        console.log('User logged out');
      }
    }
  };

  const isAuthenticated = () => {
    return !!currentUser && !!localStorage.getItem('token');
  };

  const hasRole = (role) => {
    return currentUser?.role === role;
  };

  const clearError = () => {
    setError('');
  };

  const updateProfile = async (profileData) => {
  try {
    const response = await fetchAPI('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    if (response.success) {
      // Mettre à jour le currentUser avec les nouvelles données
      updateCurrentUser(response.data);
      return response;
    } else {
      throw new Error(response.message || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    clearError,
    fetchAPI,
    isAuthenticated,
    hasRole,
    updateCurrentUser,
    refreshCurrentUser,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;