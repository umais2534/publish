import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PetManagement from "./PetManagement";

// Mock the CallOwner component
jest.mock("../CallOwner", () => {
  return {
    __esModule: true,
    default: ({ ownerName, petName, onCallRecorded }: any) => (
      <div data-testid="mock-call-owner">
        <div>Owner: {ownerName}</div>
        <div>Pet: {petName}</div>
        <button onClick={() => onCallRecorded(new Blob(), 60)}>
          Mock Record Call
        </button>
      </div>
    ),
  };
});

// Mock the callService
jest.mock("../../services/callService", () => ({
  saveCallRecording: jest.fn().mockResolvedValue({
    id: "mock-recording-id",
    petId: "mock-pet-id",
    petName: "Mock Pet",
    ownerName: "Mock Owner",
    duration: 60,
    date: new Date(),
  }),
}));

describe("PetManagement Component", () => {
  test("renders pet list correctly", () => {
    render(<PetManagement />);

    // Check if the component title is rendered
    expect(screen.getByText("Pet Management")).toBeInTheDocument();

    // Check if some of the mock pets are rendered
    expect(screen.getByText("Max")).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.getByText("Buddy")).toBeInTheDocument();
  });

  test("filters pets by search term", () => {
    render(<PetManagement />);

    // Enter search term
    const searchInput = screen.getByPlaceholderText(
      "Search pets by name, breed, or owner",
    );
    fireEvent.change(searchInput, { target: { value: "Golden" } });

    // Check if only the matching pet is displayed
    expect(screen.getByText("Max")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();
  });

  test("filters pets by species", () => {
    render(<PetManagement />);

    // Open the species dropdown
    const speciesDropdown = screen.getByText("All Species");
    fireEvent.click(speciesDropdown);

    // Select 'Cats' option
    const catsOption = screen.getByText("Cats");
    fireEvent.click(catsOption);

    // Check if only cat pets are displayed
    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.getByText("Bella")).toBeInTheDocument();
    expect(screen.queryByText("Max")).not.toBeInTheDocument();
  });

  test("opens pet details dialog when clicking on a pet", async () => {
    render(<PetManagement />);

    // Find and click on the view details button for Max
    const viewButtons = screen.getAllByText("View Details");
    fireEvent.click(viewButtons[0]);

    // Check if the pet details dialog is open
    await waitFor(() => {
      expect(screen.getByText("Owner Information")).toBeInTheDocument();
      expect(screen.getByText("Call Owner")).toBeInTheDocument();
    });
  });

  test("adds a new pet", async () => {
    render(<PetManagement />);

    // Click the Add Pet button
    const addPetButton = screen.getByText("Add Pet");
    fireEvent.click(addPetButton);

    // Fill in the form
    const nameInput = screen.getByLabelText("Pet Name");
    fireEvent.change(nameInput, { target: { value: "Whiskers" } });

    // Select species
    const speciesDropdown = screen.getByText("Select species");
    fireEvent.click(speciesDropdown);
    const catOption = screen.getAllByText("Cat")[0];
    fireEvent.click(catOption);

    // Fill in other fields
    const breedInput = screen.getByLabelText("Breed");
    fireEvent.change(breedInput, { target: { value: "Persian" } });

    const ageInput = screen.getByLabelText("Age");
    fireEvent.change(ageInput, { target: { value: "3 years" } });

    const ownerInput = screen.getByLabelText("Owner");
    fireEvent.change(ownerInput, { target: { value: "Jane Doe" } });

    // Submit the form
    const submitButton = screen.getByText("Add Pet");
    fireEvent.click(submitButton);

    // Check if the new pet is added to the list
    await waitFor(() => {
      expect(screen.getByText("Whiskers")).toBeInTheDocument();
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });
  });
});
