// frontend/src/pages/ForgotPasswordPage.jsx
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, X, Lock } from 'lucide-react';
import api from 'src/config/api';
import toast from 'react-hot-toast';

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

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const otpRefs = useRef([]);
  
  // States
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [passwords, setPasswords] = useState({
    new_password: '',
    new_password2: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  // ============================================
  // STEP 1: REQUEST RESET CODE
  // ============================================
  
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Invalid email format');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/forgot-password/', { email });
      toast.success('Reset code sent to your email!');
      setStep(2);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      setError(error.response?.data?.error || 'Failed to send reset code');
      toast.error('Failed to send reset code');
    } finally {
      setLoading(false);
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

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ============================================
  // STEP 2: VERIFY CODE
  // ============================================

  const handleVerifyCode = async () => {
    const code = otpCode.join('');
    
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/verify-reset-code/', { email, code });
      toast.success('Code verified! Enter your new password.');
      setStep(3);
    } catch (error) {
      console.error('❌ Verify code error:', error.response?.data);
      setError(error.response?.data?.error || 'Invalid or expired code');
      toast.error('Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // STEP 3: RESET PASSWORD
  // ============================================

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (passwords.new_password !== passwords.new_password2) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please choose a stronger password.');
      return;
    }

    setLoading(true);

    try {
      const code = otpCode.join('');
      await api.post('/auth/reset-password/', {
        email,
        code,
        new_password: passwords.new_password,
        new_password2: passwords.new_password2
      });
      
      toast.success('Password reset successfully! 🎉');
      setTimeout(() => navigate('/login'), 2000);
      
    } catch (error) {
      console.error('❌ Reset password error:', error);
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.new_password?.[0] || 
                       'Failed to reset password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords({ ...passwords, [name]: value });
    
    if (name === 'new_password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/', { email });
      toast.success('New code sent!');
      setOtpCode(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (error) {
      toast.error('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Login
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 && 'Forgot Password?'}
              {step === 2 && 'Enter Verification Code'}
              {step === 3 && 'Create New Password'}
            </h1>
            <p className="text-gray-600">
              {step === 1 && 'Enter your email to receive a reset code'}
              {step === 2 && `We sent a code to ${censorEmail(email)}`}
              {step === 3 && 'Choose a strong password'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* ============================================ */}
          {/* STEP 1: EMAIL INPUT */}
          {/* ============================================ */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* ============================================ */}
          {/* STEP 2: OTP INPUT */}
          {/* ============================================ */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex gap-2 justify-center">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={loading || otpCode.join('').length !== 6}
                className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                onClick={handleResendCode}
                disabled={loading}
                className="w-full text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Resend Code
              </button>
            </div>
          )}

          {/* ============================================ */}
          {/* STEP 3: NEW PASSWORD */}
          {/* ============================================ */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwords.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  required
                />
                
                {/* Password Strength Meter */}
                {passwords.new_password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Password Strength:</span>
                      <span className={`text-sm font-semibold ${
                        passwordStrength.score <= 2 ? 'text-red-600' : 
                        passwordStrength.score <= 3 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {getStrengthText(passwordStrength.score)}
                      </span>
                    </div>
                    
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    
                    <div className="mt-3 space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {item.met ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={item.met ? 'text-green-600' : 'text-gray-500'}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="new_password2"
                  value={passwords.new_password2}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || passwordStrength.score < 3}
                className="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Progress Indicator */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full transition ${step >= 1 ? 'bg-primary-500' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full transition ${step >= 2 ? 'bg-primary-500' : 'bg-gray-300'}`} />
            <div className={`w-2 h-2 rounded-full transition ${step >= 3 ? 'bg-primary-500' : 'bg-gray-300'}`} />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;