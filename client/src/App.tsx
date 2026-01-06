import "./App.css";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import RoomManagement from "./pages/RoomManagement";
import ReservationManagement from "./pages/ReservationManagement";

function App() {
	const [currentPage, setCurrentPage] = useState<
		"dashboard" | "rooms" | "reservations"
	>("dashboard");

	return (
		<div className="App">
			<nav className="main-nav">
				<h1>TIOCA Manager Portal</h1>
				<div className="nav-buttons">
					<button
						onClick={() => setCurrentPage("dashboard")}
						className={currentPage === "dashboard" ? "active" : ""}
					>
						Dashboard
					</button>
					<button
						onClick={() => setCurrentPage("rooms")}
						className={currentPage === "rooms" ? "active" : ""}
					>
						Room Management
					</button>
					<button
						onClick={() => setCurrentPage("reservations")}
						className={currentPage === "reservations" ? "active" : ""}
					>
						Reservation Management
					</button>
				</div>
			</nav>
			<main>
				{currentPage === "dashboard" && <Dashboard />}
				{currentPage === "rooms" && <RoomManagement />}
				{currentPage === "reservations" && <ReservationManagement />}
			</main>
		</div>
	);
}

export default App;
