const TypingIndicator = () => (
  <div className='relative py-4'>
    <div className='flex items-center gap-2 shadow-none typing-bubble-animation'>
      <span className='typing-dot'></span>
      <span className='typing-dot'></span>
      <span className='typing-dot'></span>
    </div>
    <style jsx>{`
      .typing-dot {
        display: block;
        width: 15px;
        height: 15px;
        border-radius: 9999px;
        background: #f8f8f8;
        margin: 0 2px;
        animation: typingDotColor 1.2s infinite;
      }
      .typing-dot:nth-child(1) {
        animation-delay: 0s;
      }
      .typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      .typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes typingDotColor {
        0%,
        80%,
        100% {
          background: #f8f8f8;
        }
        40% {
          background: #b6f8df;
        }
      }
      .typing-bubble-animation {
        animation: typingBubbleMove 1.2s infinite;
      }
      @keyframes typingBubbleMove {
        0%,
        100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-3px);
        }
      }
    `}</style>
  </div>
);

export default TypingIndicator;
