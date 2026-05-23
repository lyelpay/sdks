export const durations = {
  instant: "75ms",
  fast: "150ms",
  base: "200ms",
  slow: "300ms",
  modal: "400ms",
} as const;

export const easings = {
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  entrance: "cubic-bezier(0.0, 0, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

export const transitions = {
  smooth: `color ${durations.base} ${easings.standard}, background-color ${durations.base} ${easings.standard}, border-color ${durations.base} ${easings.standard}`,
};

