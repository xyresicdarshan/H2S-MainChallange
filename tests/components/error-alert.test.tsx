// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorAlert } from "@/components/ErrorAlert";

describe("ErrorAlert", () => {
  it("renders the message inside a role=alert element", () => {
    render(<ErrorAlert message="The AI service is rate-limited right now." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("The AI service is rate-limited right now.");
  });

  it("renders nothing when message is null", () => {
    const { container } = render(<ErrorAlert message={null} />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});
