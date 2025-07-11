'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp } from 'lucide-react';
import Image from 'next/image';
import TypingIndicator from './typing';
import Header from './header';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppContext } from '@/lib/context';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: string;
  isOption?: boolean;
}

interface ConversationState {
  step:
    | 'initial'
    | 'main-options'
    | 'feature-subtopics'
    | 'bug-subtopics'
    | 'free-text'
    | 'collect-name'
    | 'collect-email'
    | 'ended';
  selectedMainOption?: string;
  selectedSubOption?: string;
  userName?: string;
  userEmail?: string;
  feedbackMessage?: string;
}

export default function FloatingFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [conversationState, setConversationState] = useState<ConversationState>(
    { step: 'initial' }
  );
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAppContext();
  const email = user?.email;
  const phone = user?.personalInfo?.phone;
  const role = user?.role;
  const name =
    user?.personalInfo?.firstName + ' ' + user?.personalInfo?.lastName;
  const image = user?.personalInfo?.image;
  const address =
    user?.personalInfo?.address?.city +
    ', ' +
    user?.personalInfo?.address?.country;
  // console.log('🚀 ~ FloatingFeedback ~ user:', user);
  // LocalStorage keys
  const LS_KEY = 'ffc';

  // Save chat state to localStorage
  const saveChatToLocalStorage = (data: {
    messages: Message[];
    conversationState: ConversationState;
    message: string;
  }) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {}
  };

  // Restore chat state from localStorage
  const restoreChatFromLocalStorage = () => {
    try {
      const data = localStorage.getItem(LS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setMessages(parsed.messages || []);
        setConversationState(parsed.conversationState || { step: 'initial' });
        setMessage(parsed.message || '');
      }
    } catch {}
  };

  // Clear chat state from localStorage
  const clearChatFromLocalStorage = () => {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);

  // Save chat state to localStorage whenever it changes and chat is open (not closed)
  useEffect(() => {
    if (isOpen && !isMinimized) {
      saveChatToLocalStorage({
        messages,
        conversationState,
        message,
      });
    }
  }, [messages, conversationState, message, isOpen, isMinimized]);

  const initializeConversation = () => {
    // Personalize greeting based on user login status
    const greeting = user?.personalInfo?.firstName
      ? `Hi ${user?.personalInfo?.firstName}, I'm Navy, your virtual assistant, and I am here to assist you`
      : "Hi, I'm Navy, your virtual assistant, and I am here to assist you";

    const initialMessages: Message[] = [
      {
        id: '1',
        type: 'bot',
        content: greeting,
        timestamp: getCurrentTime(),
      },
      {
        id: '2',
        type: 'bot',
        content: 'What brings you here today? Please choose from below',
        timestamp: getCurrentTime(),
      },
    ];
    setMessages(initialMessages);
    setConversationState({ step: 'main-options' });
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      // Try to restore from localStorage first
      const data = localStorage.getItem(LS_KEY);
      if (data) {
        restoreChatFromLocalStorage();
      } else {
        initializeConversation();
      }
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsOpen(false);
    // Save chat state when minimized
    saveChatToLocalStorage({
      messages,
      conversationState,
      message,
    });
  };

  const handleReset = () => {
    setMessages([]);
    setConversationState({ step: 'initial' });
    initializeConversation();
    setIsOpen(false);
    clearChatFromLocalStorage(); // Also clear on reset
  };

  const addMessage = (
    content: string,
    type: 'bot' | 'user',
    isOption = false
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: getCurrentTime(),
      isOption,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const sendFeedback = async (
    feedbackMessage: string,
    userEmailInput?: string,
    userNameInput?: string
  ) => {
    try {
      // Prepare selections array based on conversation history
      const selections = [];
      if (conversationState.selectedMainOption) {
        selections.push(conversationState.selectedMainOption);
      }
      if (conversationState.selectedSubOption) {
        selections.push(conversationState.selectedSubOption);
      }

      // Prepare user data differently for logged in vs non-logged in users
      let userData;

      if (email && name) {
        // Logged in user - include all available profile data
        userData = {
          image: image || '',
          role: role || 'User',
          name: name,
          email: email,
          phone: phone || '',
          address: address || '',
        };
      } else {
        // Non-logged in user - only include required fields with user input
        userData = {
          role: 'User',
          name: userNameInput || '',
          email: userEmailInput || '',
        };
      }

      // Prepare request body according to the specified format
      const requestBody = {
        user: userData,
        message: feedbackMessage,
        feedbackType: conversationState.selectedMainOption || 'Others',
        selections: selections,
      };

      const response = await fetch('/api/user/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setIsBotTyping(false);
        addMessage(
          'Thank you for the feedback! We will have a look on your suggestion. Your time is appreciated.',
          'bot'
        );

        setTimeout(() => {
          setIsBotTyping(true);
          setTimeout(() => {
            setIsBotTyping(false);
            addMessage('Have a good day!', 'bot');
            setConversationState((prev) => ({ ...prev, step: 'ended' }));
          }, 1000);
        }, 1000);
      } else {
        setIsBotTyping(false);
        addMessage(
          'Sorry, there was an error sending your feedback. Please try again.',
          'bot'
        );
        setConversationState((prev) => ({ ...prev, step: 'free-text' }));
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      setIsBotTyping(false);
      addMessage(
        'Sorry, there was an error sending your feedback. Please try again.',
        'bot'
      );
      setConversationState((prev) => ({ ...prev, step: 'free-text' }));
    }
  };

  const handleMainOptionSelect = (option: string) => {
    addMessage(option, 'user', true);
    setIsBotTyping(true);

    setTimeout(() => {
      setIsBotTyping(false);
      if (option === 'Feature request') {
        addMessage('Ok sure. Which topic is this feature to?', 'bot');
        setConversationState({
          step: 'feature-subtopics',
          selectedMainOption: option,
        });
      } else if (option === 'Report a bug to fix') {
        addMessage('Ok sure. Which topic is this bug related to?', 'bot');
        setConversationState({
          step: 'bug-subtopics',
          selectedMainOption: option,
        });
      } else if (option === 'Others') {
        addMessage(
          'Please describe your message below on the free text.',
          'bot'
        );
        setConversationState({ step: 'free-text', selectedMainOption: option });
      }
    }, 1500);
  };

  const handleSubOptionSelect = (option: string) => {
    addMessage(option, 'user', true);
    setIsBotTyping(true);

    setTimeout(() => {
      setIsBotTyping(false);
      addMessage('Please describe your message below on the free text.', 'bot');
      setConversationState((prev) => ({
        ...prev,
        step: 'free-text',
        selectedSubOption: option,
      }));
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      addMessage(message, 'user');
      const currentMessage = message;
      setMessage('');
      setIsBotTyping(true);

      if (conversationState.step === 'free-text') {
        // Check if user is registered or not
        if (!email || !name) {
          // User is not registered, collect name first
          setTimeout(() => {
            setIsBotTyping(false);
            addMessage(
              'To better assist you, could you please provide your name?',
              'bot'
            );
            setConversationState((prev) => ({
              ...prev,
              step: 'collect-name',
              // Store the feedback message temporarily
              feedbackMessage: currentMessage,
            }));
          }, 1500);
        } else {
          // User is registered, send feedback directly
          await sendFeedback(currentMessage);
        }
      } else if (conversationState.step === 'collect-name') {
        setTimeout(() => {
          setIsBotTyping(false);
          addMessage(
            'Thank you! Now, could you please provide your email address?',
            'bot'
          );
          setConversationState((prev) => ({
            ...prev,
            step: 'collect-email',
            userName: currentMessage,
          }));
        }, 1500);
      } else if (conversationState.step === 'collect-email') {
        // Validate email format
        if (!validateEmail(currentMessage)) {
          setTimeout(() => {
            setIsBotTyping(false);
            addMessage(
              'Please enter a valid email address (e.g., example@domain.com)',
              'bot'
            );
            // Stay in collect-email step
          }, 1500);
        } else {
          setTimeout(() => {
            setIsBotTyping(false);
            setConversationState((prev) => ({
              ...prev,
              userEmail: currentMessage,
            }));
            // Now send the feedback with collected user info
            sendFeedback(
              conversationState.feedbackMessage || '',
              currentMessage,
              conversationState.userName
            );
          }, 1500);
        }
      }
    }
  };

  const canUseTextInput =
    (conversationState.step === 'free-text' ||
      conversationState.step === 'collect-name' ||
      conversationState.step === 'collect-email') &&
    !isBotTyping;

  const mainOptions = ['Feature request', 'Report a bug to fix', 'Others'];

  // Remove animation variants and AnimatePresence/motion.div for messages, options, and typing indicator
  // Keep only the AnimatePresence/motion.div for the popup itself

  const renderMainOptions = () => (
    <div className='space-y-2 px-5 pb-6'>
      {mainOptions.map((option) => (
        <Button
          key={option}
          variant='outline'
          className='w-full justify-start text-left h-[60px] p-4 hover:bg-gray-50 bg-transparent rounded-[32px]'
          onClick={() => handleMainOptionSelect(option)}
        >
          <span className='text-sm font-medium text-[#01400F]'>{option}</span>
        </Button>
      ))}
    </div>
  );

  const featureSubOptions = ['Onboarding', 'Account', 'Other'];
  const bugSubOptions = ['Login Issues', 'Performance', 'Other'];

  const renderFeatureSubOptions = () => (
    <div className='space-y-2 px-5 pb-6'>
      {featureSubOptions.map((option) => (
        <Button
          key={option}
          variant='outline'
          className='w-full justify-start text-left h-[60px] p-4 hover:bg-gray-50 bg-transparent rounded-[32px]'
          onClick={() => handleSubOptionSelect(option)}
        >
          <span className='text-sm font-medium text-[#01400F]'>{option}</span>
        </Button>
      ))}
    </div>
  );

  const renderBugSubOptions = () => (
    <div className='space-y-2 px-5 pb-6'>
      {bugSubOptions.map((option) => (
        <Button
          key={option}
          variant='outline'
          className='w-full justify-start text-left h-[60px] p-4 hover:bg-gray-50 bg-transparent rounded-[32px]'
          onClick={() => handleSubOptionSelect(option)}
        >
          <span className='text-sm font-medium text-[#01400F]'>{option}</span>
        </Button>
      ))}
    </div>
  );

  if (user?.role === 'admin') {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className='fixed bottom-6 right-6 z-50'>
        <Button
          onClick={handleOpen}
          className='h-[62px] w-[62px] rounded-full transition-all duration-200 inline-flex items-center justify-center bg-[#33B55B]'
          style={{
            boxShadow: '0px 8px 8px 0px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Image
            src='/Tj.svg'
            alt='TJ'
            width={22}
            height={32}
            className='text-white'
          />
        </Button>
      </div>

      {/* Feedback Modal with Animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key='feedback-modal'
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='fixed bottom-24 right-6 z-50 w-[396px] max-w-[calc(100vw-3rem)]'
          >
            <Card
              className='border-0 overflow-hidden rounded-xl'
              style={{
                boxShadow: '0px 0px 50px 0px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Header
                handleMinimize={handleMinimize}
                handleReset={handleReset}
              />

              <CardContent className='p-0'>
                <div className='max-h-[434px] overflow-y-auto'>
                  {messages.length > 0 && (
                    <div className='flex flex-col items-center text-center pt-10 gap-4'>
                      <Avatar className='size-20 inline-flex items-center justify-center bg-[#01400F]'>
                        <AvatarImage
                          src='/Tj.svg'
                          alt='TJ'
                          className='size-10'
                        />
                        <AvatarFallback className='text-white text-sm font-bold'>
                          TJ
                        </AvatarFallback>
                      </Avatar>

                      <span className='text-xs text-[#6C6C6C]'>Today</span>
                    </div>
                  )}

                  <div className='px-5 py-6 space-y-1'>
                    {messages.map((msg, idx) => {
                      const isLastBotInGroup =
                        msg.type === 'bot' &&
                        (idx === messages.length - 1 ||
                          messages[idx + 1].type !== 'bot');
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.type === 'user'
                              ? 'justify-end'
                              : 'items-end gap-2.5'
                          }`}
                        >
                          {msg.type === 'bot' && (
                            <Avatar
                              className={cn(
                                'size-10 inline-flex items-center justify-center bg-[#33B55B] ',
                                idx !== messages.length - 1 &&
                                  !isLastBotInGroup &&
                                  'invisible'
                              )}
                            >
                              <AvatarImage
                                src='/Tj.svg'
                                alt='TJ'
                                className='size-6'
                              />
                              <AvatarFallback className='text-white text-sm font-bold'>
                                TJ
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div
                            className={`max-w-[90%]  ${
                              msg.type === 'user'
                                ? 'flex flex-col items-end py-5'
                                : ''
                            }`}
                          >
                            <div className='flex items-center gap-2.5'>
                              {msg.type === 'user' && (
                                <span className='text-xs text-[#6C6C6C] flex-shrink-0'>
                                  {msg.timestamp}
                                </span>
                              )}
                              <div
                                className={cn(
                                  'rounded-[8px] p-3 ',
                                  msg.type === 'user'
                                    ? 'text-white text-sm bg-[#01400F]  break-words whitespace-pre-line'
                                    : 'bg-[#F9F9FA] text-[#1C1C1C] text-sm'
                                )}
                              >
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isBotTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Option Buttons */}
                  {conversationState.step === 'main-options' &&
                    !isBotTyping &&
                    renderMainOptions()}
                  {conversationState.step === 'feature-subtopics' &&
                    !isBotTyping &&
                    renderFeatureSubOptions()}
                  {conversationState.step === 'bug-subtopics' &&
                    !isBotTyping &&
                    renderBugSubOptions()}
                </div>

                {/* Message Input */}
                <div className='p-4'>
                  <div className='flex h-[60px] items-center w-full px-2 py-2 bg-white rounded-full border border-[#DFE2E0]'>
                    <input
                      type='text'
                      placeholder='Message...'
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === 'Enter' &&
                        canUseTextInput &&
                        handleSendMessage()
                      }
                      disabled={
                        !canUseTextInput || conversationState.step === 'ended'
                      }
                      className={cn(
                        'flex-1 bg-transparent outline-none border-none text-[#6C6C6C] placeholder-[#6C6C6C] px-2 text-sm',
                        !canUseTextInput && 'bg-white cursor-not-allowed'
                      )}
                      style={{
                        fontSize: '16px',
                        fontWeight: 400,
                      }}
                    />
                    <button
                      type='button'
                      onClick={handleSendMessage}
                      disabled={
                        !message.trim() ||
                        !canUseTextInput ||
                        conversationState.step === 'ended'
                      }
                      className={cn(
                        'flex items-center justify-center size-9 rounded-full transition-colors',
                        !message.trim() ||
                          !canUseTextInput ||
                          conversationState.step === 'ended'
                          ? 'bg-[#DFE2E0] cursor-not-allowed'
                          : 'bg-[#DFE2E0] hover:bg-[#d1d5db]'
                      )}
                      style={{
                        border: 'none',
                        marginRight: '4px',
                      }}
                    >
                      <ArrowUp className='size-5 text-white' />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
