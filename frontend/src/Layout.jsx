import 'react';
import {Link, Outlet} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/js/dist/tooltip.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import {useNavigate} from "react-router-dom";

const Layout = () => {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate("/Home"); // Replace '/about' with the desired path
    };

    return (<>
        <div className="container-fluid">
              <div className="d-flex">
                <div className="p-2 flex-column" style={{width: "150px"}}>
                    <ul className="nav flex-column align-items-center" style={{width: "115px"}}>
                        <li className="nav-item pt-2">
                            <img
                                onClick={handleClick}
                                src="/src/assets/images/byte-vision-bw.jpg"
                                alt="Byte-Vision"
                                className="img-thumbnail border-primary-subtle"
                                style={{objectFit: "cover"}}
                            />

                        </li>
                        <li className="nav-item">
                            <Link to="/"><i data-bs-toggle="tooltip" data-bs-placement="right" title="Home"
                                            className="fs-2 bi bi-house" style={{fontSize: "2rem"}}></i></Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/Settings"><i data-bs-toggle="tooltip" data-bs-placement="right"
                                                    title="Llama cpp settings" className="bi bi-gear"
                                                    style={{fontSize: "2rem"}}></i></Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/EmbedSettings"><i data-bs-toggle="tooltip" data-bs-placement="right"
                                                         title="Document parsing and embedding"
                                                         className="bi bi-file-earmark-binary"
                                                         style={{fontSize: "2rem"}}></i></Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/WorkItems"><i data-bs-toggle="tooltip" data-bs-placement="right"
                                                     title="Document parsing and embedding" className="bi bi-list-task"
                                                     style={{fontSize: "2rem"}}></i></Link>
                        </li>
                    </ul>
                </div>
                <div className="d-flex p-2 vh-100 flex-column flex-grow-1">
                    <Outlet/>
                </div>
                <div className="p-2 flex-column" style={{width: "150px"}}></div>
            </div>
        </div>
    </>);
};

export default Layout;