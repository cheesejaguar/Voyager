export interface TravelPreferences {
  vibe: "touristy" | "local" | "mixed";
  focus: "food" | "sightseeing" | "culture" | "nightlife" | "balanced";
  diningStyle: "fine_dining" | "casual" | "street_food" | "mixed";
  pace: "packed" | "balanced" | "relaxed";
  budget: "budget" | "moderate" | "luxury";
  walkingTolerance: "minimal" | "moderate" | "high";
  transitPreference: "walk" | "transit" | "rideshare" | "mixed";
  indoorOutdoor: "indoor" | "outdoor" | "mixed";
}

export const defaultPreferences: TravelPreferences = {
  vibe: "mixed",
  focus: "balanced",
  diningStyle: "mixed",
  pace: "balanced",
  budget: "moderate",
  walkingTolerance: "moderate",
  transitPreference: "mixed",
  indoorOutdoor: "mixed",
};

export const preferenceLabels: Record<keyof TravelPreferences, { label: string; options: { value: string; label: string }[] }> = {
  vibe: { label: "Vibe", options: [{ value: "touristy", label: "Touristy" }, { value: "local", label: "Local" }, { value: "mixed", label: "Mixed" }] },
  focus: { label: "Focus", options: [{ value: "food", label: "Food" }, { value: "sightseeing", label: "Sightseeing" }, { value: "culture", label: "Culture" }, { value: "nightlife", label: "Nightlife" }, { value: "balanced", label: "Balanced" }] },
  diningStyle: { label: "Dining", options: [{ value: "fine_dining", label: "Fine Dining" }, { value: "casual", label: "Casual" }, { value: "street_food", label: "Street Food" }, { value: "mixed", label: "Mixed" }] },
  pace: { label: "Pace", options: [{ value: "packed", label: "Packed" }, { value: "balanced", label: "Balanced" }, { value: "relaxed", label: "Relaxed" }] },
  budget: { label: "Budget", options: [{ value: "budget", label: "Budget" }, { value: "moderate", label: "Moderate" }, { value: "luxury", label: "Luxury" }] },
  walkingTolerance: { label: "Walking", options: [{ value: "minimal", label: "Minimal" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }] },
  transitPreference: { label: "Transit", options: [{ value: "walk", label: "Walk" }, { value: "transit", label: "Transit" }, { value: "rideshare", label: "Rideshare" }, { value: "mixed", label: "Mixed" }] },
  indoorOutdoor: { label: "Setting", options: [{ value: "indoor", label: "Indoor" }, { value: "outdoor", label: "Outdoor" }, { value: "mixed", label: "Mixed" }] },
};
