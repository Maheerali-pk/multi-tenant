/**
 * Formats a timestamp as relative time (e.g., "5 mins ago", "2 hours ago", "3 days ago")
 * Uses the viewer's local timezone
 */
export function formatRelativeTime(timestamp: string | null | undefined): string {
	if (!timestamp) {
		return "-";
	}

	try {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		// If the date is in the future (shouldn't happen, but handle gracefully)
		if (diffInSeconds < 0) {
			return "just now";
		}

		// Less than a minute
		if (diffInSeconds < 60) {
			return "just now";
		}

		// Less than an hour
		const diffInMinutes = Math.floor(diffInSeconds / 60);
		if (diffInMinutes < 60) {
			return `${diffInMinutes} ${diffInMinutes === 1 ? "min" : "mins"} ago`;
		}

		// Less than a day
		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) {
			return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
		}

		// Less than a week
		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) {
			return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
		}

		// Less than a month (approximately 30 days)
		const diffInWeeks = Math.floor(diffInDays / 7);
		if (diffInWeeks < 4) {
			return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
		}

		// Less than a year
		const diffInMonths = Math.floor(diffInDays / 30);
		if (diffInMonths < 12) {
			return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
		}

		// More than a year
		const diffInYears = Math.floor(diffInDays / 365);
		return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
	} catch (error) {
		console.error("Error formatting relative time:", error);
		return "-";
	}
}
