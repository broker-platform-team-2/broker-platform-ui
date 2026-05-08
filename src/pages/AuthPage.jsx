import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { W, FONT_BODY } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import {
  Field, Input, Button, Divider, Checkbox, Icon,
  StrengthMeter, Heading, ErrorBanner,
  emailValid, passwordValid,
} from '../components/auth/ui';
import { BrandPanel } from '../components/auth/BrandPanel';

function extractError(err, fallback) {
  return err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;
}

const Footer = () => (
  <div style={{ marginTop: 32, paddingTop: 18, borderTop: `1px solid ${W.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONT_BODY, fontSize: 11.5, color: W.ink40 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{Icon.shield} Secured by 2-layer platform auth</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{Icon.globe} EN</div>
  </div>
);

const LoginForm = ({ onSwitch, onForgot }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!emailValid(email)) errs.email = 'Enter a valid email address.';
    if (password.length < 1) errs.password = 'Enter your password.';
    setErrors(errs); setServerError('');
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setServerError(extractError(err, 'Email or password is incorrect.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column' }}>
      <Heading eyebrow="Welcome back" title="Log in to your broker account" sub="Use the credentials you registered with."/>
      {serverError && <ErrorBanner>{serverError}</ErrorBanner>}

      <Field label="Email" error={errors.email}>
        <Input type="email" value={email} onChange={setEmail} placeholder="name@example.com"
          autoComplete="email" leftIcon={Icon.mail} invalid={!!errors.email} autoFocus/>
      </Field>

      <Field label="Password" error={errors.password}
        right={
          <button type="button" onClick={onForgot}
            style={{ fontFamily: FONT_BODY, fontSize: 12, color: W.plum, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, padding: 0 }}>
            Forgot password?
          </button>
        }>
        <Input type={showPw ? 'text' : 'password'} value={password} onChange={setPassword}
          placeholder="••••••••••" autoComplete="current-password" leftIcon={Icon.lock} invalid={!!errors.password}
          rightSlot={
            <button type="button" onClick={() => setShowPw(s => !s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: W.ink40, padding: 4, marginLeft: 6, display: 'flex' }}>
              {showPw ? Icon.eyeOff : Icon.eye}
            </button>
          }/>
      </Field>

      <div style={{ marginTop: 4, marginBottom: 22 }}>
        <Checkbox checked={remember} onChange={setRemember}>Keep me signed in on this device</Checkbox>
      </div>

      <Button type="submit" variant="primary" full loading={loading}>
        {loading ? 'Signing in…' : <>Log in {Icon.arrow}</>}
      </Button>

      <Divider>or</Divider>

      <div style={{ textAlign: 'center', fontFamily: FONT_BODY, fontSize: 14, color: W.ink60 }}>
        New to Wakibi Trade?{' '}
        <button type="button" onClick={onSwitch}
          style={{ background: 'none', border: 'none', color: W.plum, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3, fontSize: 14, fontFamily: FONT_BODY }}>
          Create an account
        </button>
      </div>
    </form>
  );
};

const SignupForm = ({ onSwitch }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!emailValid(email)) errs.email = 'Enter a valid email address.';
    if (username.length < 3) errs.username = 'Username must be at least 3 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) errs.username = 'Letters, numbers and underscores only.';
    if (!passwordValid(password)) errs.password = 'Password does not meet all requirements.';
    if (!agree) errs.agree = 'You must accept the terms to continue.';
    setErrors(errs); setServerError('');
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await register(email, username, password);
      navigate('/home');
    } catch (err) {
      setServerError(extractError(err, 'Sign-up failed. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column' }}>
      <Heading eyebrow="Create your account" title="Start trading with purpose"
        sub="A Wakibi Trade account gives you live market data, order routing and a portfolio that funds microloans."/>
      {serverError && <ErrorBanner>{serverError}</ErrorBanner>}

      <Field label="Email" error={errors.email}>
        <Input type="email" value={email} onChange={setEmail} placeholder="name@example.com"
          autoComplete="email" leftIcon={Icon.mail} invalid={!!errors.email} autoFocus/>
      </Field>

      <Field label="Username" hint="3+ characters · letters, numbers, underscore" error={errors.username}>
        <Input value={username} onChange={(v) => setUsername(v.replace(/\s/g, ''))}
          placeholder="trader_amara" autoComplete="username" leftIcon={Icon.user} invalid={!!errors.username}/>
      </Field>

      <Field label="Password" error={errors.password}>
        <Input type={showPw ? 'text' : 'password'} value={password} onChange={setPassword}
          placeholder="At least 10 characters" autoComplete="new-password" leftIcon={Icon.lock} invalid={!!errors.password}
          rightSlot={
            <button type="button" onClick={() => setShowPw(s => !s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: W.ink40, padding: 4, marginLeft: 6, display: 'flex' }}>
              {showPw ? Icon.eyeOff : Icon.eye}
            </button>
          }/>
        <StrengthMeter password={password}/>
      </Field>

      <div style={{ marginTop: 6, marginBottom: 18 }}>
        <Checkbox checked={agree} onChange={setAgree}>
          I agree to the <a href="#" style={{ color: W.plum, fontWeight: 600 }}>Terms of Service</a>, <a href="#" style={{ color: W.plum, fontWeight: 600 }}>Risk Disclosure</a> and{' '}
          <a href="#" style={{ color: W.plum, fontWeight: 600 }}>Privacy Policy</a>.
        </Checkbox>
        {errors.agree && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: W.danger, marginTop: 6, marginLeft: 28 }}>{errors.agree}</div>
        )}
      </div>

      <Button type="submit" variant="primary" full loading={loading}>
        {loading ? 'Creating account…' : <>Create account {Icon.arrow}</>}
      </Button>

      <div style={{ marginTop: 22, textAlign: 'center', fontFamily: FONT_BODY, fontSize: 14, color: W.ink60 }}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitch}
          style={{ background: 'none', border: 'none', color: W.plum, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3, fontSize: 14, fontFamily: FONT_BODY }}>
          Log in
        </button>
      </div>
    </form>
  );
};

const ForgotForm = ({ onBack, onSent }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!emailValid(email)) { setError('Enter a valid email address.'); return; }
    setError(''); setLoading(true);
    try {
      await authApi.forgotPassword(email);
      onSent(email);
    } catch {
      // Per design: privacy-preserving — always treat as success.
      onSent(email);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column' }}>
      <button type="button" onClick={onBack}
        style={{ background: 'none', border: 'none', color: W.ink60, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 18 }}>
        {Icon.back} Back to login
      </button>

      <Heading eyebrow="Reset your password" title="No worries, we've got you"
        sub="Enter the email tied to your account and we'll send you a reset token."/>

      <Field label="Email" error={error}>
        <Input type="email" value={email} onChange={setEmail} placeholder="name@example.com"
          leftIcon={Icon.mail} invalid={!!error} autoFocus/>
      </Field>

      <Button type="submit" variant="primary" full loading={loading}>
        {loading ? 'Sending…' : <>Send reset token {Icon.arrow}</>}
      </Button>

      <div style={{ marginTop: 18, fontFamily: FONT_BODY, fontSize: 12, color: W.ink40, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: W.sageDk, marginTop: 1 }}>{Icon.shield}</span>
        For your protection, we always show the same confirmation regardless of whether the email is on file.
      </div>
    </form>
  );
};

const SuccessIllustration = ({ tint }) => (
  <div style={{ width: 64, height: 64, borderRadius: 32, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5L10 17.5L19 7" stroke={W.plum} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const EmailSent = ({ email, onBack, onResend, onEnterToken }) => (
  <div>
    <SuccessIllustration tint={W.sage}/>
    <Heading eyebrow="Check your inbox" title="Reset token sent"
      sub={<>If <strong style={{ color: W.ink }}>{email}</strong> is registered, a reset token is on its way. The token expires in 30 minutes.</>}/>
    <Button variant="primary" full onClick={onEnterToken}>Enter reset token {Icon.arrow}</Button>
    <div style={{ marginTop: 12 }}>
      <Button variant="ghost" full onClick={onBack}>Back to log in</Button>
    </div>
    <div style={{ marginTop: 16, textAlign: 'center', fontFamily: FONT_BODY, fontSize: 13, color: W.ink60 }}>
      Didn't get it?{' '}
      <button type="button" onClick={onResend}
        style={{ background: 'none', border: 'none', color: W.plum, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3, fontSize: 13, fontFamily: FONT_BODY }}>
        Send again
      </button>
    </div>
  </div>
);

const ResetForm = ({ onBack, onDone }) => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!token.trim()) errs.token = 'Enter the token from your email.';
    if (!passwordValid(password)) errs.password = 'Password does not meet all requirements.';
    setErrors(errs); setServerError('');
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await authApi.resetPassword({ token: token.trim(), newPassword: password });
      onDone();
    } catch (err) {
      setServerError(extractError(err, 'Reset failed. The token may be invalid or expired.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column' }}>
      <button type="button" onClick={onBack}
        style={{ background: 'none', border: 'none', color: W.ink60, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 18 }}>
        {Icon.back} Back
      </button>

      <Heading eyebrow="Reset your password" title="Enter your reset token"
        sub="Paste the token from your email, then choose a new password."/>
      {serverError && <ErrorBanner>{serverError}</ErrorBanner>}

      <Field label="Reset token" error={errors.token}>
        <Input value={token} onChange={setToken} placeholder="Paste token here"
          leftIcon={Icon.shield} invalid={!!errors.token} autoFocus/>
      </Field>

      <Field label="New password" error={errors.password}>
        <Input type={showPw ? 'text' : 'password'} value={password} onChange={setPassword}
          placeholder="At least 10 characters" autoComplete="new-password" leftIcon={Icon.lock} invalid={!!errors.password}
          rightSlot={
            <button type="button" onClick={() => setShowPw(s => !s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: W.ink40, padding: 4, marginLeft: 6, display: 'flex' }}>
              {showPw ? Icon.eyeOff : Icon.eye}
            </button>
          }/>
        <StrengthMeter password={password}/>
      </Field>

      <Button type="submit" variant="primary" full loading={loading}>
        {loading ? 'Resetting…' : <>Set new password {Icon.arrow}</>}
      </Button>
    </form>
  );
};

const ResetSuccess = ({ onLogin }) => (
  <div>
    <SuccessIllustration tint={W.sage}/>
    <Heading eyebrow="All done" title="Password updated"
      sub="Your password has been reset. You can now log in with your new password."/>
    <Button variant="primary" full onClick={onLogin}>Back to log in {Icon.arrow}</Button>
  </div>
);

export default function AuthPage({ initial = 'login' }) {
  const [view, setView] = useState(initial);
  const [resetEmail, setResetEmail] = useState('');

  let body;
  if (view === 'login') body = <LoginForm onSwitch={() => setView('signup')} onForgot={() => setView('forgot')}/>;
  else if (view === 'signup') body = <SignupForm onSwitch={() => setView('login')}/>;
  else if (view === 'forgot') body = <ForgotForm onBack={() => setView('login')} onSent={(e) => { setResetEmail(e); setView('sent'); }}/>;
  else if (view === 'sent') body = <EmailSent email={resetEmail} onBack={() => setView('login')} onResend={() => setView('forgot')} onEnterToken={() => setView('reset')}/>;
  else if (view === 'reset') body = <ResetForm onBack={() => setView('sent')} onDone={() => setView('resetDone')}/>;
  else if (view === 'resetDone') body = <ResetSuccess onLogin={() => setView('login')}/>;

  return (
    <div style={{
      display: 'flex', flexDirection: 'row', height: '100vh', width: '100%',
      background: W.surface, fontFamily: FONT_BODY, color: W.ink,
    }}>
      <BrandPanel/>
      <div style={{
        flex: '0 0 480px', maxWidth: 480, width: '100%',
        padding: '48px 56px',
        background: W.surface,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        overflow: 'auto',
      }}>
        {body}
        <Footer/>
      </div>
    </div>
  );
}
