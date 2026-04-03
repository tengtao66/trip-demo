export const DESTINATIONS = [
  { id: "paris", name: "Paris, France", price: 1200 },
  { id: "rome", name: "Rome, Italy", price: 1000 },
  { id: "santorini", name: "Santorini, Greece", price: 1500 },
  { id: "barcelona", name: "Barcelona, Spain", price: 900 },
  { id: "swiss-alps", name: "Swiss Alps", price: 1800 },
  { id: "amsterdam", name: "Amsterdam, Netherlands", price: 800 },
] as const;

export const ACTIVITIES = [
  { id: "museum", name: "Guided Museum Tour", price: 150 },
  { id: "wine", name: "Wine Tasting", price: 100 },
  { id: "cooking", name: "Cooking Class", price: 120 },
  { id: "boat", name: "Boat Excursion", price: 200 },
] as const;
