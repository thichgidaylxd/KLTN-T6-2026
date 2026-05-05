'use client';

import React from 'react';
import { Sprout } from 'lucide-react';

export const LoadingPage: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-green-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Animated Sprout Icon */}
        <div className="flex justify-center">
          <div className="animate-bounce">
            <Sprout className="h-24 w-24 text-green-600" strokeWidth={1.5} />
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">
            Farmar Management
          </h1>
          <p className="text-lg text-gray-600">
            Đang tải dữ liệu...
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-bounce"></div>
          <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-bounce [animation-delay:200ms]"></div>
          <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-bounce [animation-delay:400ms]"></div>
        </div>
      </div>
    </div>
  );
};
