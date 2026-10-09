import React from 'react';

const SignupNow = () => {
  return (
    <div className='bg-white shadow-lg rounded-lg p-6 z-10 relative'>
      {/* Blurry Background */}
      <div className='absolute inset-0 blur-md bg-gradient-to-r from-green-400 via-green-200 to-green-400 opacity-30 -z-10'></div>

      {/* Content */}
      <div className='text-center space-y-4'>
        <h3 className='text-lg font-semibold text-gray-900'>Sign up now!</h3>
        <p className='text-sm text-gray-600'>
          Complete your profile now in a few seconds! Enjoy our platform by
          viewing handpicked verified CNAs.
        </p>
        <button
          className='bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg transition duration-200'
          type='button'
        >
          Sign up now!
        </button>
      </div>
    </div>
  );
};

export default SignupNow;
