// frontend/src/pages/RegisterPage.jsx
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, X, Mail } from 'lucide-react';
import api from 'src/config/api';
import toast from 'react-hot-toast';
import useAuthStore from 'src/stores/authStore';

// ============================================
// HELPER FUNCTIONS
// ============================================

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const censorEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  return `${localPart.substring(0, 2)}***@${domain}`;
};

const calculatePasswordStrength = (password) => {
  let score = 0;
  const checks = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /[a-z]/, text: 'Contains lowercase letter' },
    { regex: /[A-Z]/, text: 'Contains uppercase letter' },
    { regex: /[0-9]/, text: 'Contains number' },
    { regex: /[^a-zA-Z0-9]/, text: 'Contains special character' },
  ];

  const feedback = checks.map(({ regex, text }) => {
    const met = regex.test(password);
    if (met) score++;
    return { text, met };
  });

  return { score, feedback };
};

const getStrengthColor = (score) => {
  if (score <= 1) return 'bg-red-500';
  if (score <= 2) return 'bg-orange-500';
  if (score <= 3) return 'bg-yellow-500';
  if (score <= 4) return 'bg-blue-500';
  return 'bg-green-500';
};

const getStrengthText = (score) => {
  const labels = ['Very Weak', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return labels[score] || 'Very Weak';
};

// ============================================
// MAIN COMPONENT
// ============================================

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore(); // ✅ Ambil setAuth dari store
  
  // Refs untuk OTP input
  const otpRefs = useRef([]);

  // Form States
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', password2: '', bio: '',
  });
  
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);

  // ============================================
  // HANDLERS
  // ============================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));

    // Real-time Password Strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // ✅ SUBMIT REGISTER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validation
    const newErrors = {};
    if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (formData.password !== formData.password2) {
      newErrors.password2 = "Passwords don't match";
    }
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register/', formData);
      
      console.log('✅ Register response:', response.data);
      
      toast.success(`Verification code sent to ${censorEmail(formData.email)}`, { 
        duration: 5000 
      });
      
      setShowOtpModal(true);
      
    } catch (error) {
      console.error('❌ Registration error:', error.response?.data);
      const serverErrors = error.response?.data || {};
      
      // Handle different error formats
      if (typeof serverErrors.error === 'string') {
        setErrors({ message: serverErrors.error });
      } else if (serverErrors.username || serverErrors.email || serverErrors.password) {
        setErrors(serverErrors);
      } else {
        setErrors({ message: 'Registration failed. Please try again.' });
      }
      
      toast.error('Registration failed. Please check your input.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // OTP HANDLERS
  // ============================================

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ✅ VERIFY OTP - FIX AUTH FLOW
  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setVerifyingOtp(true);
    
    try {
      const response = await api.post('/auth/verify-email/', {
        email: formData.email,
        code: code
      });

      console.log('✅ Verify response:', response.data);

      // ✅ CRITICAL FIX: Set auth properly
      if (response.data.tokens && response.data.user) {
        setAuth(response.data.user, response.data.tokens);
        toast.success('Email verified successfully! 🎉');
        setTimeout(() => navigate('/home'), 1000);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.error('❌ Verify error:', error.response?.data);
      toast.error(error.response?.data?.error || 'Invalid or expired code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ✅ RESEND OTP
  const handleResendOtp = async () => {
    setResendingOtp(true);
    
    try {
      await api.post('/auth/resend-code/', { email: formData.email });
      toast.success('New verification code sent!');
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (error) {
      console.error('❌ Resend error:', error);
      toast.error('Failed to resend code.');
    } finally {
      setResendingOtp(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">Join ForKa Community</h1>
          <p className="text-lg text-primary-100 mb-8">
            Get more features and privileges by joining the most helpful community
          </p>
          <div className="space-y-4">
            {[
              { title: 'Diskusi Terbuka', desc: 'Tanyakan apapun ke komunitas' },
              { title: 'Berbagi Pengetahuan', desc: 'Bantu sesama dengan jawabanmu' },
              { title: 'Networking', desc: 'Terhubung dengan mahasiswa & dosen' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-primary-100">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ForKa</h1>
            <h2 className="text-2xl font-semibold text-gray-800">Join ForKa Community</h2>
          </div>

          {/* Error Alert */}
          {errors.message && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{errors.message}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${errors.username ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition`}
                placeholder="johndoe"
                required
              />
              {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition`}
                placeholder="john@example.com"
                required
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition pr-12`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
            </div>

            {/* Repeat Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Repeat password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${errors.password2 ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition`}
                placeholder="••••••••"
                required
              />
              {errors.password2 && <p className="text-sm text-red-600 mt-1">{errors.password2}</p>}
            </div>

            {/* Password Strength */}
            {formData.password && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Security Level</span>
                  <span className={`text-xs font-bold uppercase ${
                    passwordStrength.score <= 2 ? 'text-red-600' : 
                    passwordStrength.score <= 3 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {getStrengthText(passwordStrength.score)}
                  </span>
                </div>
                
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className={`h-full transition-all duration-500 ${getStrengthColor(passwordStrength.score)}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-1">
                  {passwordStrength.feedback.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      {item.met ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-gray-300" />
                      )}
                      <span className={item.met ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio (Optional)</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'REGISTER'}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Login
            </Link>
          </p>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* OTP MODAL */}
      {/* ============================================ */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md relative shadow-2xl">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Verify Email</h3>
              <p className="text-gray-600">
                Code sent to <span className="font-semibold text-gray-900">{censorEmail(formData.email)}</span>
              </p>
            </div>

            {/* OTP Inputs */}
            <div className="flex gap-2 justify-center mb-6">
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition"
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOtp}
              disabled={verifyingOtp || otpCode.join('').length !== 6}
              className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-semibold disabled:opacity-50 mb-4"
            >
              {verifyingOtp ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend Button */}
            <div className="text-center">
              <button
                onClick={handleResendOtp}
                disabled={resendingOtp}
                className="text-primary-600 hover:text-primary-700 font-semibold text-sm disabled:opacity-50"
              >
                {resendingOtp ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;