import {BrowserRouter, Route, Routes} from "react-router-dom";

import Settings from "./Settings.jsx";
import Home from "./Home.jsx";
import Layout from "./Layout.jsx";
import {SettingsProvider} from "./SettingsContextHooks.jsx";



const App = () => {


    return (
        <BrowserRouter>
                <SettingsProvider>
                <Routes>
                    <Route path="/" element={<Layout/>}>
                        <Route index element={<Home/>}/>
                        <Route path="Settings" element={<Settings/>}/>
                        <Route path="*" element={<Home/>}/>
                    </Route>
                </Routes>
                </SettingsProvider>
        </BrowserRouter>
    );
};

export default App;