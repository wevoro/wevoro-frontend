import React from "react";

const Help = () => {
  return (
    // hide in mobile
    <div className="hidden md:block fixed bottom-4 right-8 p-2.5 cursor-pointer hover:underline">
      <span className="flex items-center">
        <img src="/info.svg" alt="help" />
        <span className="ml-2 text-sm">Need help?</span>
      </span>
    </div>
  );
};

export default Help;
