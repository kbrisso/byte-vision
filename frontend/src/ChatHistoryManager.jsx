import { useCallback, useEffect, useRef, useState } from "react";

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const chatContainerRef = useRef(null);

  const addMessageToChat = useCallback((sender, content, isLoading = false, processTime = null) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      sender,
      content,
      timestamp: new Date().toISOString(),
      isLoading,
      processTime,
    };

    setChatHistory(prevHistory => [...prevHistory, newMessage]);
    return newMessage;
  }, []);

  const updateMessageInChat = useCallback((messageToUpdate, updates) => {
    setChatHistory(prevHistory =>
      prevHistory.map(msg =>
        msg.id === messageToUpdate.id ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return {
    chatHistory,
    chatContainerRef,
    addMessageToChat,
    updateMessageInChat,
    clearChatHistory,
  };
};
