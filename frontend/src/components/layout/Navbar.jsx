import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Navbar = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            ForKa
          </Link>
          
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600">
              Dashboard
            </Link>
            <Link to="/forums" className="text-gray-700 hover:text-blue-600">
              Forums
            </Link>
            <Link to="/issues" className="text-gray-700 hover:text-blue-600">
              Issues
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-gray-700">Hi, {user?.username}</span>
                <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-x-2">
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;