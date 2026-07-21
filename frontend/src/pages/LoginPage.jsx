import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Mail, X } from 'lucide-react';
import useAuthStore from 'src/stores/authStore';
import toast from 'react-hot-toast';

const censorEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  return `${localPart.substring(0, 2)}***@${domain}`;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const verifyLoginMfa = useAuthStore((state) => state.verifyLoginMfa);
  const resendLoginMfa = useAuthStore((state) => state.resendLoginMfa);

  const otpRefs = useRef([]);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // MFA step state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [tempToken, setTempToken] = useState('');
  const [mfaEmail, setMfaEmail] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(formData.username, formData.password);

    if (result.mfaRequired) {
      setTempToken(result.tempToken);
      setMfaEmail(result.email);
      setOtpCode(['', '', '', '', '', '']);
      setOtpError('');
      setShowOtpModal(true);
      toast.success(`Verification code sent to ${censorEmail(result.email)}`);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else if (!result.success) {
      setError(result.error);
    }

    setIsLoading(false);
  };

  // ============================================
  // OTP HANDLERS
  // ============================================

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');

    if (code.length !== 6) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');

    const result = await verifyLoginMfa(tempToken, code);

    if (result.success) {
      setShowOtpModal(false);
      navigate('/home');
    } else {
      setOtpError(result.error);
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }

    setVerifyingOtp(false);
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setOtpError('');

    const result = await resendLoginMfa(tempToken);

    if (result.success) {
      setTempToken(result.tempToken);
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      toast.success('New verification code sent!');
    } else {
      toast.error(result.error);
      // Session most likely expired outright — send back to step 1
      setShowOtpModal(false);
      setError(result.error);
    }

    setResendingOtp(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">Welcome Back to ForKa!</h1>
          <p className="text-lg text-primary-100">
            Login untuk melanjutkan diskusi dengan komunitas kampus Politeknik Negeri Batam.
          </p>
          <div className="mt-12">
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img
                src="/polibatam-logo.png"
                alt="Polibatam Logo"
                className="h-12"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <h1 className="text-3xl font-bold text-gray-800">ForKa</h1>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Sign In</h2>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="azakost"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition pr-12"
                  placeholder="••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {error === 'Old password is incorrect' && (
                <p className="text-sm text-red-600 mt-1">Wrong password!</p>
              )}
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Register
            </Link>
          </p>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MFA OTP MODAL */}
      {/* ============================================ */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Verify It's You</h3>
              <p className="text-gray-600">
                Code sent to <span className="font-semibold text-gray-900">{censorEmail(mfaEmail)}</span>
              </p>
            </div>

            {otpError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{otpError}</p>
              </div>
            )}

            {/* OTP Inputs */}
            <div className="flex gap-2 justify-center mb-6">
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="number"
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

            <button
              onClick={handleVerifyOtp}
              disabled={verifyingOtp || otpCode.join('').length !== 6}
              className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-semibold disabled:opacity-50 mb-4"
            >
              {verifyingOtp ? 'Verifying...' : 'Verify & Login'}
            </button>

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

export default LoginPage;
