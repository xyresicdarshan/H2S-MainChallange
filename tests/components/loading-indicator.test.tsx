// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingIndicator } from "@/components/LoadingIndicator";

describe("LoadingIndicator", () => {
  it("exposes a role=status element containing the visible label", () => {
    render(<LoadingIndicator label="Consulting the cultural archives…" />);
    const status = screen.getByRole("status");
    expect(within(status).getByText("Consulting the cultural archives…")).toBeInTheDocument();
  });
});
