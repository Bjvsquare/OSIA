import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';

export const VisualWelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useOnboarding();
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [notificationsConsent, setNotificationsConsent] = useState(false);

  const handleStart = () => {
    // Record consent in onboarding context
    dispatch({
      type: 'RECORD_EVENT',
      payload: {
        event_name: 'visual_welcome_start',
        screen_id: 'visual_welcome',
        properties: {
          analytics_consent: analyticsConsent,
          notifications_consent: notificationsConsent
        }
      }
    });

    // Navigate to emotion picker level 1
    navigate('/onboarding/emotion/level1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1128] via-[#0d1f3d] to-[#0a1128] flex items-center justify-center px-4">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20" />
      </div>

      <motion.div
        className="relative z-10 max-w-2xl w-full text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Main Heading */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Turn your patterns into something you can see.
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-lg text-gray-300 mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          OSIA helps you understand your psychological patterns through daily check-ins and visual insights.
        </motion.p>

        {/* Consent Toggles */}
        <motion.div
          className="bg-gray-900 bg-opacity-50 backdrop-blur rounded-lg border border-gray-700 p-8 mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h3 className="text-white font-semibold mb-6 text-left">What we'd like your permission for</h3>

          <div className="space-y-4">
            {/* Analytics Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Analytics & Improvements</label>
                <p className="text-gray-400 text-sm mt-1">
                  Help us improve OSIA by sharing usage insights
                </p>
              </div>
              <motion.button
                onClick={() => setAnalyticsConsent(!analyticsConsent)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  analyticsConsent ? 'bg-cyan-600' : 'bg-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute w-5 h-5 bg-white rounded-full top-1 left-1"
                  animate={{ x: analyticsConsent ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between border-t border-gray-700 pt-4">
              <div>
                <label className="text-white font-medium">Notifications</label>
                <p className="text-gray-400 text-sm mt-1">
                  Get reminders for your daily check-ins
                </p>
              </div>
              <motion.button
                onClick={() => setNotificationsConsent(!notificationsConsent)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  notificationsConsent ? 'bg-cyan-600' : 'bg-gray-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute w-5 h-5 bg-white rounded-full top-1 left-1"
                  animate={{ x: notificationsConsent ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          onClick={handleStart}
          className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50 text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Blueprint
        </motion.button>

        {/* Footer text */}
        <motion.p
          className="text-gray-500 text-sm mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
};
