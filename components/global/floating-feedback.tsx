"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Minus, Send } from "lucide-react";
import Image from "next/image";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
  timestamp: string;
  isOption?: boolean;
}

interface ConversationState {
  step:
    | "initial"
    | "main-options"
    | "feature-subtopics"
    | "bug-subtopics"
    | "free-text"
    | "ended";
  selectedMainOption?: string;
  selectedSubOption?: string;
}

const TypingIndicator = () => (
  <div className="flex items-start gap-3 px-4 pb-4">
    <Avatar className="h-8 w-8 mt-1" style={{ backgroundColor: "#33B55B" }}>
      <AvatarImage src="/Tj.svg" alt="TJ" />
      <AvatarFallback className="text-white text-sm font-bold">
        TJ
      </AvatarFallback>
    </Avatar>
    <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-1">
      <div className="flex space-x-1">
        <div
          className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
    </div>
  </div>
);

export default function FloatingFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [conversationState, setConversationState] = useState<ConversationState>(
    { step: "initial" }
  );
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);

  const initializeConversation = () => {
    const initialMessages: Message[] = [
      {
        id: "1",
        type: "bot",
        content:
          "Hi User name, I'm Navy, your virtual assistant, and I am here to assist you",
        timestamp: getCurrentTime(),
      },
      {
        id: "2",
        type: "bot",
        content: "What brings you here today? Please choose from below",
        timestamp: getCurrentTime(),
      },
    ];
    setMessages(initialMessages);
    setConversationState({ step: "main-options" });
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      initializeConversation();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  const handleReset = () => {
    setMessages([]);
    setConversationState({ step: "initial" });
    initializeConversation();
  };

  const addMessage = (
    content: string,
    type: "bot" | "user",
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

  const handleMainOptionSelect = (option: string) => {
    addMessage(option, "user", true);
    setIsBotTyping(true);

    setTimeout(() => {
      setIsBotTyping(false);
      if (option === "Feature request") {
        addMessage("Ok sure. Which topic is this feature to?", "bot");
        setConversationState({
          step: "feature-subtopics",
          selectedMainOption: option,
        });
      } else if (option === "Report a bug to fix") {
        addMessage("Ok sure. Which topic is this bug related to?", "bot");
        setConversationState({
          step: "bug-subtopics",
          selectedMainOption: option,
        });
      } else if (option === "Others") {
        addMessage(
          "Please describe your message below on the free text.",
          "bot"
        );
        setConversationState({ step: "free-text", selectedMainOption: option });
      }
    }, 1500);
  };

  const handleSubOptionSelect = (option: string) => {
    addMessage(option, "user", true);
    setIsBotTyping(true);

    setTimeout(() => {
      setIsBotTyping(false);
      addMessage("Please describe your message below on the free text.", "bot");
      setConversationState((prev) => ({
        ...prev,
        step: "free-text",
        selectedSubOption: option,
      }));
    }, 1500);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      addMessage(message, "user");
      setMessage("");
      setIsBotTyping(true);

      // Simulate bot response with closing messages
      setTimeout(() => {
        setIsBotTyping(false);
        addMessage(
          "Thank you for the feedback! We will have a look on your suggestion. Your time is appreciated.",
          "bot"
        );

        setTimeout(() => {
          setIsBotTyping(true);
          setTimeout(() => {
            setIsBotTyping(false);
            addMessage("Have a good day!", "bot");
            // Disable text input after conversation ends
            setConversationState((prev) => ({ ...prev, step: "ended" }));
          }, 1000);
        }, 1000);
      }, 2000);
    }
  };

  const canUseTextInput = conversationState.step === "free-text";

  const renderMainOptions = () => (
    <div className="px-4 pb-4 space-y-2">
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50 bg-transparent"
        onClick={() => handleMainOptionSelect("Feature request")}
      >
        <span className="text-sm font-medium text-gray-700">
          Feature request
        </span>
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50 bg-transparent"
        onClick={() => handleMainOptionSelect("Report a bug to fix")}
      >
        <span className="text-sm font-medium text-gray-700">
          Report a bug to fix
        </span>
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50 bg-transparent"
        onClick={() => handleMainOptionSelect("Others")}
      >
        <span className="text-sm font-medium text-gray-700">Others</span>
      </Button>
    </div>
  );

  const renderFeatureSubOptions = () => (
    <div className="px-4 pb-4 space-y-2">
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50 bg-transparent"
        onClick={() => handleSubOptionSelect("Onboarding")}
      >
        <span className="text-sm font-medium text-gray-700">Onboarding</span>
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50 bg-transparent"
        onClick={() => handleSubOptionSelect("Account")}
      >
        <span className="text-sm font-medium text-gray-700">Account</span>
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50 bg-transparent"
        onClick={() => handleSubOptionSelect("Other")}
      >
        <span className="text-sm font-medium text-gray-700">Other</span>
      </Button>
    </div>
  );

  const renderBugSubOptions = () => (
    <div className="px-4 pb-4 space-y-2">
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50 bg-transparent"
        onClick={() => handleSubOptionSelect("Login Issues")}
      >
        <span className="text-sm font-medium text-gray-700">Login Issues</span>
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50 bg-transparent"
        onClick={() => handleSubOptionSelect("Performance")}
      >
        <span className="text-sm font-medium text-gray-700">Performance</span>
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50 bg-transparent"
        onClick={() => handleSubOptionSelect("Other")}
      >
        <span className="text-sm font-medium text-gray-700">Other</span>
      </Button>
    </div>
  );

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleOpen}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-white"
          style={{ backgroundColor: "#33B55B" }}
        >
          <Image
            src="/Tj.svg"
            alt="TJ"
            width={32}
            height={32}
            className="text-white"
          />
        </Button>
      </div>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)]">
          <Card className="shadow-2xl border-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4 bg-white border-b">
              <div className="flex items-center gap-3">
                <Avatar
                  className="h-8 w-8"
                  style={{ backgroundColor: "#33B55B" }}
                >
                  <AvatarImage src="/Tj.svg" alt="TJ" />
                  <AvatarFallback className="text-white text-sm font-bold">
                    TJ
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-gray-700"
                  onClick={handleMinimize}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-gray-700"
                  onClick={handleReset}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {/* Today Header */}
                {messages.length > 0 && (
                  <div className="text-center py-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Today
                    </span>
                  </div>
                )}

                {/* Messages */}
                <div className="p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === "user" ? "justify-end" : "items-start gap-3"}`}
                    >
                      {msg.type === "bot" && (
                        <Avatar
                          className="h-8 w-8 mt-1"
                          style={{ backgroundColor: "#33B55B" }}
                        >
                          <AvatarImage src="/Tj.svg" alt="TJ" />
                          <AvatarFallback className="text-white text-sm font-bold">
                            TJ
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[80%] ${msg.type === "user" ? "flex flex-col items-end" : ""}`}
                      >
                        {msg.type === "user" && (
                          <span className="text-xs text-gray-500 mb-1">
                            {msg.timestamp}
                          </span>
                        )}
                        <div
                          className={`rounded-lg p-3 ${
                            msg.type === "user"
                              ? "text-white text-sm"
                              : "bg-gray-50 text-gray-700 text-sm"
                          }`}
                          style={
                            msg.type === "user"
                              ? { backgroundColor: "#33B55B" }
                              : {}
                          }
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isBotTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>

                {/* Option Buttons */}
                {conversationState.step === "main-options" &&
                  renderMainOptions()}
                {conversationState.step === "feature-subtopics" &&
                  renderFeatureSubOptions()}
                {conversationState.step === "bug-subtopics" &&
                  renderBugSubOptions()}
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      canUseTextInput &&
                      handleSendMessage()
                    }
                    disabled={
                      !canUseTextInput || conversationState.step === "ended"
                    }
                    className={`flex-1 border-gray-200 ${
                      canUseTextInput
                        ? "focus:border-[#33B55B] focus:ring-[#33B55B]"
                        : "bg-gray-100 cursor-not-allowed"
                    }`}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    className="h-10 w-10 rounded-full"
                    style={{
                      backgroundColor: canUseTextInput ? "#33B55B" : "#ccc",
                    }}
                    disabled={
                      !message.trim() ||
                      !canUseTextInput ||
                      conversationState.step === "ended"
                    }
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
