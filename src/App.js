import React from "react";
import {
  BrowserRouter as Router,
  Route
} from "react-router-dom";
import About from "./Components/About";
import Contact from "./Components/Contact";
import Navbar from "./Components/Navbar";
import Projects from "./Components/Projects";
import Experience from "./Components/Experience";

export default function App() {
  return (
    <main className="text-gray-400 bg-gray-900 body-font">
      <div>
        <Navbar />
      </div>
    <Router>
      <Route exact path="/" component={About} />
      <Route exact path="/" component={Experience} />
      <Route exact path="/" component={Projects} />
      <Route exact path="/" component={Contact} />
    </Router>
      
    </main>
  );
}