import { Link } from 'react-router-dom';
import { MessageSquare, Users, TrendingUp, BookOpen } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/polibatam-logo.png" 
                alt="Polibatam Logo" 
                className="h-10"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <h1 className="text-2xl font-bold text-gray-800">ForKa</h1>
            </div>
            <div className="flex gap-3">
              <Link 
                to="/login"
                className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-primary-500">ForKa</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Forum Kampus untuk mahasiswa, dosen, dan staff Politeknik Negeri Batam. 
            Tempat berbagi ilmu, berdiskusi, dan terhubung dengan komunitas kampus.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              to="/register"
              className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-semibold text-lg"
            >
              Mulai Sekarang
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Diskusi Terbuka
            </h3>
            <p className="text-gray-600">
              Ajukan pertanyaan dan dapatkan jawaban dari komunitas kampus
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Komunitas Aktif
            </h3>
            <p className="text-gray-600">
              Terhubung dengan mahasiswa, dosen, dan staff lainnya
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Berbagi Pengetahuan
            </h3>
            <p className="text-gray-600">
              Bagikan ilmu dan pengalaman untuk membantu sesama
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Trending Topics
            </h3>
            <p className="text-gray-600">
              Ikuti topik-topik yang sedang hangat dibicarakan
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-12">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">150+</div>
              <div className="text-gray-600">Pertanyaan Aktif</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-600">Anggota Komunitas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">1000+</div>
              <div className="text-gray-600">Jawaban Terbaik</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Siap bergabung dengan ForKa?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Daftar sekarang dan mulai berdiskusi dengan komunitas kampus
          </p>
          <Link 
            to="/register"
            className="inline-block px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-semibold text-lg"
          >
            Daftar Gratis
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">ForKa</h3>
              <p className="text-gray-400">
                Forum Kampus Politeknik Negeri Batam
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white">About</Link></li>
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
                <li><Link to="/register" className="hover:text-white">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">
                Politeknik Negeri Batam<br />
                Batam, Kepulauan Riau
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ForKa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;