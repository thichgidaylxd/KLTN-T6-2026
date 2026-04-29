import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginBg from '@/assets/Login-Background.png';
import LogoBrowser from '@/assets/Logo-browser.png';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* Left Section */}
      <div className="relative flex w-full h-full lg:w-1/2 items-center justify-center bg-white p-6 md:p-10">

        {/* Logo - Fixed top left */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="fixed left-6 top-5 flex items-center gap-3 rounded-lg bg-white/80 backdrop-blur-sm p-2 transition-transform duration-300 hover:scale-105 z-50 shadow-sm border border-gray-100"
        >
          <img
            src={LogoBrowser}
            alt="FarmerAI logo"
            className="h-8 w-auto object-contain md:h-10"
          />
          <span className="bg-gradient-to-r from-emerald-800 to-emerald-500 bg-clip-text font-prompt text-[38px] font-extrabold leading-none text-transparent drop-shadow-sm">
            farmarAI
          </span>
        </button>

        {/* Form container - Centered with offset */}
        <div className="w-full max-w-[420px] z-10 translate-y-8">
          <div className="w-full rounded-xl bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] animate-[slideInLeft_0.5s_ease-out] transition-all duration-300">
            {/* Header */}
            <div className="mb-6 font-prompt">
              <h1 className="text-2xl font-extrabold text-gray-800 mb-1">{title}</h1>
              {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
            </div>

            {/* Content */}
            <div className="space-y-4">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Image with Rounded Corners */}
      <div className="relative hidden w-1/2 lg:block h-full bg-white">
        <img 
          src={LoginBg} 
          alt="Background" 
          className="h-full w-full object-cover shadow-2xl rounded-l-[40px]" 
        />
      </div>
    </div>
  );
};
