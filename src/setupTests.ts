import "@testing-library/jest-dom";

// Mock the URL.createObjectURL and URL.revokeObjectURL
window.URL.createObjectURL = jest.fn(() => "blob:mock-url");
window.URL.revokeObjectURL = jest.fn();

// Mock the window.setInterval and window.clearInterval
window.setInterval = jest.fn(() => 123) as unknown as typeof setInterval;
window.clearInterval = jest.fn() as unknown as typeof clearInterval;