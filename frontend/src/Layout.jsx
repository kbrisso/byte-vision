import { Link, Outlet } from "react-router-dom";
import "bootstrap/js/dist/tooltip.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../public/main.css";

const Layout = () => {
  return (
    <>
      <div
        className="container-fluid"
        style={{ height: "100vh", overflow: "hidden" }}
      >
        <div className="d-flex h-100">
          <div
            className="flex-column"
            style={{ width: "80px", minWidth: "80px" }}
          >
            <ul
              className="nav flex-column align-items-center"
              style={{ width: "80px", height: "100vh", overflowY: "auto" }}
            >
              <li
                className="nav-item pt-2 d-flex justify-content-center"
                style={{ width: "100%" }}
              >
                <Link to="/" className="d-flex justify-content-center">
                  <img
                    src="images/93AABMGZ.jpg"
                    alt="Byte-Vision"
                    className="img-thumbnail border-primary-subtle"
                    style={{ objectFit: "cover" }}
                  />
                </Link>
              </li>
              <li
                className="nav-item d-flex justify-content-center py-2"
                style={{ width: "100%" }}
              >
                <Link to="/" className="d-flex justify-content-center">
                  <i
                    data-bs-toggle="tooltip"
                    data-bs-placement="right"
                    title="Document search"
                    className="bi bi-search"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                </Link>
              </li>
              <li
                className="nav-item d-flex justify-content-center py-2"
                style={{ width: "100%" }}
              >
                <Link to="/Chat" className="d-flex justify-content-center">
                  <i
                    data-bs-toggle="tooltip"
                    data-bs-placement="right"
                    title="Chat"
                    className="bi bi-chat-right-text"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                </Link>
              </li>
              <li
                className="nav-item d-flex justify-content-center py-2"
                style={{ width: "100%" }}
              >
                <Link to="/Settings" className="d-flex justify-content-center">
                  <i
                    data-bs-toggle="tooltip"
                    data-bs-placement="right"
                    title="Llama cpp settings"
                    className="bi bi-gear"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                </Link>
              </li>
              <li
                className="nav-item d-flex justify-content-center py-2"
                style={{ width: "100%" }}
              >
                <Link
                  to="/DocumentSettings"
                  className="d-flex justify-content-center"
                >
                  <i
                    data-bs-toggle="tooltip"
                    data-bs-placement="right"
                    title="Document parsing and embedding"
                    className="bi bi-file-earmark-binary"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                </Link>
              </li>
            </ul>
          </div>
          <div
            className="d-flex flex-column flex-grow-1 w-100"
            style={{ height: "100vh", overflow: "hidden" }}
          >
            <div
              className="d-flex flex-column flex-grow-1 w-100"
              style={{ height: "100%", overflow: "hidden" }}
            >
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
