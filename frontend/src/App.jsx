import { BrowserRouter, Route, Routes } from "react-router-dom";

import Layout from "./Layout.jsx";
import DocumentSettings from "./DocumentSettings.jsx";
import InferenceCompletionForm from "./InferenceCompletionForm.jsx";
import Settings from "./Settings.jsx";
import DocumentSearchForm from "./DocumentSearchForm.jsx";
import "../public/main.css";
import {useStore} from "zustand/react";
import {useEffect} from "react";

const App = () => {
  useEffect(() => {
    // Clear localStorage on startup
    localStorage.clear();

    // Or clear only your app's specific keys
    localStorage.removeItem('byte-vision-store');

  }, []); // Empty dependency array means this runs once on mount

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DocumentSearchForm />} />
          <Route path="*" element={<DocumentSearchForm />} />
          <Route path="Chat" element={<InferenceCompletionForm />} />
          <Route path="Settings" element={<Settings />} />
          <Route path="DocumentSettings" element={<DocumentSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
