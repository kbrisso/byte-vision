import 'react'


import {initState} from "./Common.jsx";
import App from './App'


initState().then((root)=>{root.render(<App/>);}).catch()


