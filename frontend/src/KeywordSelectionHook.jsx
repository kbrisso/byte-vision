import { useCallback, useEffect, useRef, useState } from "react";

export const useKeywordSelection = () => {
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [keywordDropdownOpen, setKeywordDropdownOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const multiSelectRef = useRef(null);

  const handleKeywordToggle = useCallback((keyword) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  }, []);

  const handleRemoveKeyword = useCallback((keywordToRemove) => {
    setSelectedKeywords(prev => prev.filter(keyword => keyword !== keywordToRemove));
  }, []);

  const clearKeywords = useCallback(() => {
    setSelectedKeywords([]);
    setKeywordDropdownOpen(false);
    setHoveredOption(null);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (multiSelectRef.current && !multiSelectRef.current.contains(event.target)) {
        setKeywordDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return {
    selectedKeywords,
    keywordDropdownOpen,
    hoveredOption,
    multiSelectRef,
    setKeywordDropdownOpen,
    setHoveredOption,
    handleKeywordToggle,
    handleRemoveKeyword,
    clearKeywords,
  };
};
