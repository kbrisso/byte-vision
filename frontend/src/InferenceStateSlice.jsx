export const createInferenceSlice = (set, get) => ({
  // Inference state
  chatHistory: [],
  currentPrompt: "",
  isGenerating: false,
  isLoading: false,
  generationError: null,
  streamingResponse: "",
  selectedPromptType: "",

  // Inference actions
  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setStreamingResponse: (response) => set({ streamingResponse: response }),

  addToChatHistory: (entry) =>
    set((state) => ({
      chatHistory: [
        ...state.chatHistory,
        {
          id: Date.now(),
          timestamp: Date.now(),
          ...entry,
        },
      ],
    })),

  setGenerationError: (error) =>
    set({
      generationError: error,
      isGenerating: false,
    }),

  setSelectedPromptType: (selectedPromptType) => set({ selectedPromptType }),

  clearGenerationError: () => set({ generationError: null }),

  // Complex action example
  startInference: async (prompt, context) => {
    const { setGenerating, setGenerationError, addToChatHistory } = get();

    try {
      setGenerating(true);
      setGenerationError(null);

      // Add user prompt to history
      addToChatHistory({
        type: "user",
        content: prompt,
        context,
      });

      // This would be replaced with your actual API call
      // const response = await api.generateResponse(prompt, context);
    } catch (error) {
      setGenerationError(error.message);
    }
  },
});
