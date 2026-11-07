import './App.css'
import {RouterProvider} from "react-router-dom";
import {router} from "./route/Router.tsx";
import AuthInitializer from "./component/AuthInitializer.tsx";

function App() {

  return (
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
  );
}

export default App
