import { RecoilRoot } from 'recoil';
import { render } from "react-dom";
import "./index.css";
import { Playground } from "./playground";

function App() {
  return (
    <div className="h-screen w-screen overflow-auto bg-home-bg text-white p-6">
      <Playground />
    </div>
  );
}

render(<RecoilRoot><App /></RecoilRoot>, document.getElementById("root"));
