import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('email');
    const savedPassword = localStorage.getItem('password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://174.138.109.122:8000/api/auth/get_token', { username: email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      if (rememberMe) {
        localStorage.setItem('email', email);
        localStorage.setItem('password', password);
      } else {
        localStorage.removeItem('email');
        localStorage.removeItem('password');
      }
      setLoginStatus('success');
      setOpen(true);
      setTimeout(() => {
        navigate('/project_list');
      }, 2000);
    } catch (error) {
      setLoginStatus('error');
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center" style={{ background: '#edf2f7', position: 'relative' }}>
      <div className="absolute inset-0 bg-no-repeat bg-cover" style={{ backgroundImage: 'url(/images/background.png)', backgroundSize: 'cover' }}>
        <div className="absolute bg-black opacity-60 inset-0 z-0"></div>
      </div>
      <div className="relative h-auto w-auto flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full p-10 bg-white rounded-xl z-10 relative overflow-hidden" style={{ maxWidth: '550px' }}>
          <div className="text-center">
            <img src="/images/Logo.png" alt="Company Logo" style={{ width: '70px', height: '70px', borderRadius: '20px', margin: '0 auto' }} />
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              CSR Commissioning System
            </h2>
            <p className="mt-2 text-sm text-gray-400">Please login to your account</p>
          </div>
          <form className="mt-8 space-y-3" onSubmit={handleLogin}>
            <div className="grid grid-cols-1 space-y-2">
              <label className="text-sm font-bold text-gray-500 tracking-wide">Email</label>
              <input
                className="text-base p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                type="email"
                placeholder="mail@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 space-y-2">
              <label className="text-sm font-bold text-gray-500 tracking-wide">Password</label>
              <div className="relative">
                <input
                  className="text-base p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 w-full"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={togglePasswordVisibility}
                  style={{ color: '#FBCD0B', fontWeight: 'bold' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </div>
            </div>
            <div className="flex items-center" style={{marginTop: "20px"}}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="mr-2"
              />
              <label htmlFor="rememberMe" className="text-sm font-bold text-gray-500 tracking-wide">Remember me</label>
            </div>
            <div style={{ marginTop: '30px' }}>
            <button type="submit" className="my-5 w-full flex justify-center text-gray-100 p-4 rounded-full tracking-wide font-semibold focus:outline-none focus:shadow-outline hover:bg-yellow-600 cursor-pointer transition ease-in duration-300" style={{ backgroundColor: '#FBCD0B', fontWeight: 'bold' }}>
              Login
            </button>
            </div>
          </form>
          <Snackbar open={open} autoHideDuration={2000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            {loginStatus === 'success' ? (
              <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                <AlertTitle>Success</AlertTitle>
                Login successful — Redirecting...
              </Alert>
            ) : (
              <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
                <AlertTitle>Error</AlertTitle>
                Invalid username or password.
              </Alert>
            )}
          </Snackbar>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;