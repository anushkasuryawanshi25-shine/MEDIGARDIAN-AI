import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Shield, CalendarCheck, Sparkles, MessageSquareHeart, ChevronRight, Activity, ArrowUpRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <CalendarCheck size={28} />,
      title: "Smart Medication Scheduling",
      desc: "Interactive taken, missed, and snoozed logging with dynamic daily adherence calculations."
    },
    {
      icon: <Sparkles size={28} />,
      title: "Prescription OCR Scanner",
      desc: "Upload or capture medical labels to parse prescriptions into active digital schedules instantly."
    },
    {
      icon: <MessageSquareHeart size={28} />,
      title: "MediGuardian AI Advisor",
      desc: "Consult a virtual clinical chatbot regarding correct dosages, side effects, and food interactions."
    },
    {
      icon: <Shield size={28} />,
      title: "Encrypted Health Passport",
      desc: "Compile printable medical digests and share clinical status with doctors via offline secure QR cards."
    }
  ];

  return (
    <div className="landing-layout" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', overflowX: 'hidden' }}>
      {/* Top Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 8%',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: 'white',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex'
          }}>
            <HeartPulse size={24} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            MediGuardian AI
          </span>
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-secondary" 
            style={{ padding: '10px 20px', fontWeight: '700' }}
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/register')} 
            className="btn btn-primary" 
            style={{ padding: '10px 20px', fontWeight: '700' }}
          >
            Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        padding: '80px 8%',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: '50px',
            fontSize: '0.85rem',
            fontWeight: '800',
            marginBottom: '20px'
          }}>
            <Activity size={14} />
            <span>Next-Gen Healthcare AI</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 4vw, 3.8rem)',
            lineHeight: '1.15',
            fontWeight: '800',
            letterSpacing: '-1.5px',
            color: 'var(--text-primary)',
            marginBottom: '20px'
          }}>
            Your AI-Powered <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Digital Health</span> Companion.
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            marginBottom: '35px',
            maxWidth: '520px'
          }}>
            MediGuardian AI bridges the gap in clinical prescription adherence. Keep track of daily doses, safely consult healthcare artificial intelligence, and sync vitals seamlessly.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/login')} 
              className="btn btn-primary"
              style={{
                padding: '16px 32px',
                fontSize: '1.05rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              Get Started Now <ChevronRight size={18} />
            </button>
            <a 
              href="#features" 
              className="btn btn-secondary"
              style={{
                padding: '16px 32px',
                fontSize: '1.05rem',
                fontWeight: '700',
                borderRadius: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none'
              }}
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Hero Interactive App Mockup Preview */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '25px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid #e2e8f0',
            width: '100%',
            maxWidth: '460px',
            position: 'relative',
            zIndex: 10
          }}>
            {/* Mock Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <HeartPulse size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800' }}>Patient Overview</h4>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status: Stable</p>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--success)', backgroundColor: 'var(--success-light)', padding: '4px 8px', borderRadius: '20px' }}>
                92% Adherence
              </span>
            </div>

            {/* Mock Dose Item */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)' }}>Morning Dose</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>08:00 AM</span>
              </div>
              <h5 style={{ margin: '6px 0 2px 0', fontSize: '0.9rem', fontWeight: '800' }}>Metformin 500mg</h5>
              <p style={{ margin: 0, fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Take with breakfast</p>
            </div>

            {/* Mock Vitals mini-trend */}
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Blood Pressure</span>
                <h5 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: '800' }}>118/78 <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>mmHg</span></h5>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Heart Rate</span>
                <h5 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: '800' }}>72 <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>bpm</span></h5>
              </div>
            </div>

            {/* Sparkle badge floating */}
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '-20px',
              backgroundColor: 'white',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 20
            }}>
              <Sparkles size={16} style={{ color: 'var(--warning)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>AI Interactions Active</span>
            </div>
          </div>

          {/* Decorative background glow spheres */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 1
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: '-30px',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(13, 148, 136, 0.15) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 1
          }} />
        </div>
      </header>

      {/* Features Grid Section */}
      <section id="features" style={{
        padding: '100px 8%',
        backgroundColor: 'white',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '10px' }}>
            Next-Generation Clinical Features
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1rem' }}>
            Empower your health management with interactive scheduling tools, scanning services, and secure portability.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '30px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {features.map((feat, index) => (
            <div key={index} className="card" style={{
              padding: '30px',
              transition: 'var(--transition)',
              cursor: 'default',
              borderRadius: '20px',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{
                color: 'var(--primary)',
                backgroundColor: 'var(--primary-light)',
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '10px', color: 'var(--text-primary)' }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer style={{
        padding: '80px 8%',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        color: 'white'
      }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '15px' }}>
          Ready to Coordinate Your Medical Adherence?
        </h2>
        <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 35px auto', fontSize: '1rem', lineHeight: '1.5' }}>
          Sign up now to configure schedules, communicate with healthcare AI, and invite family caregivers.
        </p>
        <button 
          onClick={() => navigate('/register')} 
          className="btn btn-primary"
          style={{
            padding: '16px 36px',
            fontSize: '1.05rem',
            fontWeight: '700',
            borderRadius: '14px',
            border: 'none',
            boxShadow: '0 4px 20px rgba(2, 132, 199, 0.4)'
          }}
        >
          Create Free Account
        </button>
        
        <div style={{
          marginTop: '60px',
          borderTop: '1px solid #334155',
          paddingTop: '30px',
          fontSize: '0.8rem',
          color: '#64748b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <span>© 2026 MediGuardian AI. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>HIPAA Compliant</span>
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
