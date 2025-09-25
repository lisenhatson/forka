import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">ForKa</h3>
            <p className="text-gray-300">
              Forum Kampus untuk mahasiswa, dosen, dan staff kampus.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/forums" className="text-gray-300 hover:text-white">Forums</a></li>
              <li><a href="/issues" className="text-gray-300 hover:text-white">Issues</a></li>
              <li><a href="/about" className="text-gray-300 hover:text-white">About</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <p className="text-gray-300">
              Email: admin@forka.edu<br />
              Phone: (021) 123-4567
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 ForKa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;