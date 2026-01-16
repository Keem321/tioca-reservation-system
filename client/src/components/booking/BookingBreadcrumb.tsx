import React from "react";
import "./BookingBreadcrumb.css";

interface BookingBreadcrumbProps {
	currentStep: 1 | 2 | 3;
	onStepClick?: (step: number) => void;
}

const BookingBreadcrumb: React.FC<BookingBreadcrumbProps> = ({
	currentStep,
	onStepClick,
}) => {
	const steps = [
		{ number: 1, label: "SEARCH" },
		{ number: 2, label: "CONFIRM" },
		{ number: 3, label: "PAYMENT" },
	];

	const handleStepClick = (stepNumber: number) => {
		// Only allow clicking on completed steps (previous steps)
		if (stepNumber < currentStep && onStepClick) {
			onStepClick(stepNumber);
		}
	};

	return (
		<div className="booking-breadcrumb">
			<div className="booking-breadcrumb__container">
				{steps.map((step, index) => {
					const isCompleted = currentStep > step.number;
					const isClickable = isCompleted && onStepClick;

					return (
						<React.Fragment key={step.number}>
							<div className="booking-breadcrumb__step">
								<div
									className={`booking-breadcrumb__circle ${
										currentStep === step.number
											? "active"
											: isCompleted
											? "completed"
											: "inactive"
									} ${isClickable ? "clickable" : ""}`}
									onClick={() => handleStepClick(step.number)}
								>
									{step.number.toString().padStart(2, "0")}
								</div>
								<div
									className={`booking-breadcrumb__label ${
										currentStep === step.number ? "active" : ""
									} ${isClickable ? "clickable" : ""}`}
									onClick={() => handleStepClick(step.number)}
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
					);
				})}
			</div>
		</div>
	);
};

export default BookingBreadcrumb;
