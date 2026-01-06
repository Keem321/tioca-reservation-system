import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";

/**
 * App Component
 *
 * Main application component with routing setup.
 * Uses React Router for navigation between pages.
 */
function App() {
	return (
		<Router>
			<div className="App">
				<Routes>
					<Route path="/" element={<Landing />} />
					<Route path="/dashboard" element={<Dashboard />} />
				</Routes>
			</div>
		</Router>
	);
}

export default App;
