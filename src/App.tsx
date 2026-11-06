import './App.css'
import {RouterProvider} from "react-router-dom";
import {router} from "./route/Router.tsx";

function App() {

  return (
      <RouterProvider router={router} />
  );
}

export default App
