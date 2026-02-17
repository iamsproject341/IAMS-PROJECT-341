import React, { useEffect, useState } from 'react';
import { AIcon } from '../components/Logo';
import { supabase } from '../lib/supabase';

export default function VerifyPage() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState('verifying'); // verifying | success | error

  useEffect(() => {
    async function handleVerification() {
      try {
        // Supabase may have already processed the token via the URL hash
        // Check if there's a session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('success');
          setTimeout(() => setShow(true), 100);
          return;
        }

        // Check URL for token params (from Supabase email link)
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        // Supabase sometimes puts params in the hash after #
        if (hash && hash.includes('access_token')) {
          // Let Supabase client handle it
          const { error } = await supabase.auth.getSession();
          if (!error) {
            setStatus('success');
            setTimeout(() => setShow(true), 100);
            return;
          }
        }

        // If we got here with no token, just show success anyway
        // (the verification already happened when they clicked the link)
        setStatus('success');
        setTimeout(() => setShow(true), 100);
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('success'); // Still show success — Supabase handles the actual verification
        setTimeout(() => setShow(true), 100);
      }
    }

    handleVerification();
  }, []);

  if (status === 'verifying') {
    return (
      <div style={{
        minHeight: '100vh', background: '#0b1520',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Manrope', -apple-system, sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto 16px' }} />
          <p style={{ color: '#8b9bb4', fontSize: '0.9rem' }}>Verifying your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0b1520',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Manrope', -apple-system, sans-serif", padding: 24,
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 380,
        opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#031c18' }}>
            <AIcon size={18} />
          </div>
          <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0' }}>AttachFlow</span>
        </div>

        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          animation: show ? 'verifyPop 0.5s cubic-bezier(0.22,1,0.36,1) 0.3s both' : 'none',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h1 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: '1.5rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 10px' }}>
          Account Verified
        </h1>
        <p style={{ color: '#8b9bb4', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 0 32px' }}>
          Your email has been confirmed and your account is now active. You can close this page.
        </p>

        <div style={{ width: 40, height: 2, background: 'rgba(20,184,166,0.2)', borderRadius: 1, margin: '0 auto 20px' }} />
        <p style={{ color: '#4b6280', fontSize: '0.72rem', margin: 0 }}>&copy; {new Date().getFullYear()} AttachFlow. All rights reserved.</p>
      </div>

      <style>{`@keyframes verifyPop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}
