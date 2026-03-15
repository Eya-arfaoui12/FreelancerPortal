import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({ children }) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 lg:grid overflow-hidden">
          <div className="relative flex items-center justify-center z-1">
            {/* Animation de fond Microsoft-like */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -left-4 w-28 h-28 bg-red-500 rounded-lg opacity-20 animate-bounce-slow animation-delay-1000"></div>
              <div className="absolute -top-4 -right-4 w-28 h-28 bg-green-500 rounded-lg opacity-20 animate-bounce-slow animation-delay-2000"></div>
              <div className="absolute -bottom-4 -left-4 w-28 h-28 bg-blue-500 rounded-lg opacity-20 animate-bounce-slow animation-delay-3000"></div>
              <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-yellow-500 rounded-lg opacity-20 animate-bounce-slow animation-delay-4000"></div>
              
              {/* Particules flottantes */}
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full opacity-20"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animation: `float ${6 + Math.random() * 10}s infinite ease-in-out`,
                    animationDelay: `${Math.random() * 5}s`
                  }}
                ></div>
              ))}
            </div>

            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            
            <div className="flex flex-col items-center max-w-xs z-10">
              {/* <Link to="/" className="block mb-6 transform hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <img
                    width={180}
                    height={40}
                    src="/images/logo/auth-logo.svg"
                    alt="Logo"
                    className="drop-shadow-lg"
                  />
                </div>
              </Link> */}
              
              {/* Animation Microsoft logo avec rebond */}
              <div className="mb-6">
                <div className="flex flex-col items-center">
                  <div className="flex mb-2">
                    <div className="w-12 h-12 bg-[#F25022] mx-1 rounded-md animate-bounce animation-delay-100"></div>
                    <div className="w-12 h-12 bg-[#7FBA00] mx-1 rounded-md animate-bounce animation-delay-200"></div>
                  </div>
                  <div className="flex">
                    <div className="w-12 h-12 bg-[#00A4EF] mx-1 rounded-md animate-bounce animation-delay-300"></div>
                    <div className="w-12 h-12 bg-[#FFB900] mx-1 rounded-md animate-bounce animation-delay-400"></div>
                  </div>
                </div>
              </div>

              <h1 className="text-xl font-semibold text-white text-center mb-4">
                MNM Consulting
              </h1>
              
              <p className="text-center text-blue-100 dark:text-blue-200 text-sm leading-relaxed">
                Complete solution for project, freelancer, and contract management
              </p>
              
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}