import 'react';
import {Outlet, Link} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/js/dist/tooltip.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

const Layout = () => {

    return (
        <>
            <div className="container-fluid">
                <div className="d-flex">
                    <div className="p2">
                        <ul className="nav flex-column" style={{width: "260px"}}>
                            <li className="nav-item pt-2 pb-5">
                                &nbsp;
                            </li>
                            <li className="nav-item">
                                <Link to="/"><i data-bs-toggle="tooltip" data-bs-placement="right" title="Home" className="bi bi-house" style={{fontSize: "2rem"}}></i></Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/Settings"><i data-bs-toggle="tooltip" data-bs-placement="right" title="Settings" className="bi bi-gear" style={{fontSize: "2rem"}}></i></Link>
                            </li>
                            <li className="nav-item">
                                <i className="bi bi-floppy" style={{fontSize: "2rem"}}></i>
                            </li>
                        </ul>
                    </div>
                    <div className="d-flex p-2 vh-100 flex-column flex-grow-1">
                        <Outlet/>
                    </div>
                    <div className="p-2 flex-column" style={{width: "260px"}}></div>
                </div>
            </div>
        </>
    );
};

export default Layout;