import {BrowserRouter, Route, Routes} from "react-router-dom";

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
            <LlamaEmbedSettingsProvider>
                <LlamaCliSettingsProvider>
                    <AppSettingsProvider>
                <Routes>
                    <Route path="/" element={<Layout/>}>
                        <Route index element={<Home/>}/>
                        <Route path="*" element={<Home/>}/>
                        <Route path="Settings" element={<Settings/>}/>
                        <Route path="EmbedSettings" element={<EmbedSettings/>}/>
                    </Route>
                </Routes>
                        </AppSettingsProvider>
                </LlamaCliSettingsProvider>
            </LlamaEmbedSettingsProvider>
        </BrowserRouter>
    );
};

export default App;