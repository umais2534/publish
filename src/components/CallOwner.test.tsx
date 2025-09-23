import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CallOwner from "./CallOwner";

// Mock the MediaRecorder API
class MockMediaRecorder {
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  state = "inactive";

  constructor() {
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob() });
      }
    }, 100);
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    if (this.onstop) this.onstop();
  }
}

// Mock getUserMedia
const mockGetUserMedia = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    getTracks: () => [{ stop: jest.fn() }],
  });
});

// Setup mocks before tests
beforeAll(() => {
  // Mock navigator.mediaDevices
  Object.defineProperty(window.navigator, "mediaDevices", {
    value: { getUserMedia: mockGetUserMedia },
    writable: true,
  });

  // Mock MediaRecorder
  window.MediaRecorder = MockMediaRecorder as any;
});

describe("CallOwner Component", () => {
  const mockProps = {
    ownerName: "John Smith",
    ownerPhone: "(555) 123-4567",
    petName: "Max",
    onCallRecorded: jest.fn(),
  };

  test("renders with correct initial state", () => {
    render(<CallOwner {...mockProps} />);

    expect(screen.getByText(/Call John Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/\(Max's owner\)/i)).toBeInTheDocument();
    expect(screen.getByText(mockProps.ownerPhone)).toBeInTheDocument();
    expect(screen.getByText("Ready to Call")).toBeInTheDocument();
    expect(screen.getByText("Start Call")).toBeInTheDocument();
  });

  test("starts a call when Start Call button is clicked", async () => {
    render(<CallOwner {...mockProps} />);

    const startCallButton = screen.getByText("Start Call");
    fireEvent.click(startCallButton);

    expect(screen.getByText("Connecting...")).toBeInTheDocument();

    // Wait for the simulated connection delay
    await waitFor(
      () => {
        expect(screen.getByText("Call Active")).toBeInTheDocument();
        expect(screen.getByText("Record Call")).toBeInTheDocument();
        expect(screen.getByText("End Call")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  test("toggles recording when Record Call button is clicked", async () => {
    render(<CallOwner {...mockProps} />);

    // Start the call first
    const startCallButton = screen.getByText("Start Call");
    fireEvent.click(startCallButton);

    // Wait for call to connect
    await waitFor(
      () => {
        expect(screen.getByText("Call Active")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Start recording
    const recordButton = screen.getByText("Record Call");
    fireEvent.click(recordButton);

    // Check if recording state changed
    expect(screen.getByText("Stop Recording")).toBeInTheDocument();
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });

    // Stop recording
    const stopRecordingButton = screen.getByText("Stop Recording");
    fireEvent.click(stopRecordingButton);

    // Check if recording state changed back
    await waitFor(() => {
      expect(screen.getByText("Record Call")).toBeInTheDocument();
    });
  });

  test("ends call when End Call button is clicked", async () => {
    render(<CallOwner {...mockProps} />);

    // Start the call first
    const startCallButton = screen.getByText("Start Call");
    fireEvent.click(startCallButton);

    // Wait for call to connect
    await waitFor(
      () => {
        expect(screen.getByText("Call Active")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // End the call
    const endCallButton = screen.getByText("End Call");
    fireEvent.click(endCallButton);

    // Check if call ended
    expect(screen.getByText("Call Completed")).toBeInTheDocument();
    expect(screen.getByText("Start Call")).toBeInTheDocument();
  });
});
