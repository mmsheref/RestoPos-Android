
import React from 'react';
import { APP_VERSION } from '../../../constants';

const AboutCard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border text-center">
        <div className="w-20 h-20 bg-primary mx-auto rounded-2xl flex items-center justify-center mb-4">
             <span className="text-white text-3xl font-bold">R</span>
        </div>
        <h2 className="text-2xl font-bold text-text-primary">RestoPos</h2>
        <p className="text-text-secondary">Version {APP_VERSION}</p>
        
        <div className="mt-6 flex justify-center gap-4">
           <a href="#" className="text-primary hover:underline text-sm">Privacy Policy</a>
           <span className="text-gray-300">|</span>
           <a href="#" className="text-primary hover:underline text-sm">Terms of Service</a>
           <span className="text-gray-300">|</span>
           <a href="#" className="text-primary hover:underline text-sm">Website</a>
        </div>
      </div>
      
      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-2">About Us</h3>
          <p className="text-text-secondary text-sm leading-relaxed">
             RestoPos is a modern, offline-first Point of Sale solution designed for restaurants and retail. 
             Built with the latest web technologies to provide a fast and reliable experience on any device.
          </p>
      </div>

       <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Credits</h3>
          <p className="text-text-secondary text-sm">
             Icons by Lucide.<br/>
             Built with React, Vite, TailwindCSS, and Firebase.
          </p>
      </div>
    </div>
  );
};

export default AboutCard;
