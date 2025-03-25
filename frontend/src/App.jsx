import {BrowserRouter, Route, Routes} from "react-router-dom";

import WorkItems from "./WorkItems.jsx";
import Settings from "./Settings.jsx";
import Home from "./Home.jsx";
import Layout from "./Layout.jsx";
import {LlamaEmbedSettingsProvider} from "./LlamaEmbedSettingsContextHooks.jsx";
import EmbedSettings from "./EmbedSettings.jsx";
import {LlamaCliSettingsProvider} from "./LlamaCliSettingsContextHooks.jsx";
import {AppSettingsProvider} from "./AppSettingsContextHooks.jsx";




const App = () => {
    return (
        <BrowserRouter>
            <LlamaCliSettingsProvider>
                <LlamaEmbedSettingsProvider>
                        <AppSettingsProvider>
                            <Routes>
                                <Route path="/" element={<Layout/>}>
                                    <Route index element={<Home/>}/>
                                    <Route path="*" element={<Home/>}/>
                                    <Route path="Settings" element={<Settings/>}/>
                                    <Route path="EmbedSettings" element={<EmbedSettings/>}/>
                                    <Route path="WorkItems" element={<WorkItems/>}/>
                                </Route>
                            </Routes>
                        </AppSettingsProvider>
                </LlamaEmbedSettingsProvider>
            </LlamaCliSettingsProvider>
        </BrowserRouter>
);
};

export default App;