import React from "react";
import "./BookingBreadcrumb.css";

interface BookingBreadcrumbProps {
	currentStep: 1 | 2 | 3;
}

const BookingBreadcrumb: React.FC<BookingBreadcrumbProps> = ({
	currentStep,
}) => {
	const steps = [
		{ number: 1, label: "SEARCH" },
		{ number: 2, label: "CONFIRM" },
		{ number: 3, label: "PAYMENT" },
	];

	return (
		<div className="booking-breadcrumb">
			<div className="booking-breadcrumb__container">
				{steps.map((step, index) => (
					<React.Fragment key={step.number}>
						<div className="booking-breadcrumb__step">
							<div
								className={`booking-breadcrumb__circle ${
									currentStep === step.number
										? "active"
										: currentStep > step.number
										? "completed"
										: "inactive"
								}`}
							>
								{step.number.toString().padStart(2, "0")}
							</div>
							<div
								className={`booking-breadcrumb__label ${
									currentStep === step.number ? "active" : ""
								}`}
							>
								{step.label}
							</div>
						</div>
						{index < steps.length - 1 && (
							<div
								className={`booking-breadcrumb__line ${
									currentStep > step.number ? "completed" : ""
								}`}
							/>
						)}
					</React.Fragment>
				))}
			</div>
		</div>
	);
};

export default BookingBreadcrumb;
