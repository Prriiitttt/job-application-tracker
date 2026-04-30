import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Applied from "./Applied";
import { fakeSession } from "../test/test-utils";
import { supabase } from "../lib/supabase";

const sampleApps = [
  { id: 1, company: "Acme", role: "Engineer", data: "2026-01-10", status: "applied", notes: "Referral" },
  { id: 2, company: "Beta", role: "Designer", data: "2026-01-12", status: "interview", notes: "" },
  { id: 3, company: "Cog", role: "Manager", data: "2026-01-15", status: "rejected", notes: "" },
];

beforeEach(() => {
  // Storage operations stubbed even though most tests don't trigger them
  vi.spyOn(supabase.storage, "from").mockReturnValue({
    upload: () => Promise.resolve({ data: null, error: null }),
    createSignedUrl: () => Promise.resolve({ data: { signedUrl: "blob:mock" }, error: null }),
    remove: () => Promise.resolve({ data: null, error: null }),
  });
});

describe("Applied — empty state", () => {
  it("shows the empty state when there are no applications", () => {
    render(
      <Applied
        applications={[]}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    expect(screen.getByRole("heading", { name: /no applications yet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add new application/i })).toBeInTheDocument();
  });

  it("opens the form when the empty-state CTA is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Applied
        applications={[]}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.click(screen.getByRole("button", { name: /add new application/i }));
    expect(screen.getByRole("heading", { name: /add application form/i })).toBeInTheDocument();
  });
});

describe("Applied — list with data", () => {
  it("renders all applications in the list view", () => {
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Cog")).toBeInTheDocument();
  });

  it("filters by search query (company)", async () => {
    const user = userEvent.setup();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.type(screen.getByPlaceholderText(/search by company or role/i), "acme");
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("filters by status dropdown", async () => {
    const user = userEvent.setup();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    const filterSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(filterSelect, "interview");
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
  });

  it("shows 'No results found' when search has no matches", async () => {
    const user = userEvent.setup();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.type(screen.getByPlaceholderText(/search by company or role/i), "zzz");
    expect(screen.getByRole("heading", { name: /no results found/i })).toBeInTheDocument();
  });

  it("calls deleteApplication when the delete button is clicked", async () => {
    const user = userEvent.setup();
    const deleteApplication = vi.fn();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={deleteApplication}
        session={fakeSession()}
      />
    );
    const deleteBtns = screen.getAllByRole("button", { name: /delete application/i });
    await user.click(deleteBtns[0]);
    expect(deleteApplication).toHaveBeenCalledWith(1);
  });

  it("changes status via the row dropdown", async () => {
    const user = userEvent.setup();
    const updateApplication = vi.fn();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={updateApplication}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    // First combobox is filter, then per-row status selects
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[1], "rejected");
    expect(updateApplication).toHaveBeenCalledWith(1, { status: "rejected" });
  });
});

describe("Applied — view toggle", () => {
  it("persists the view mode to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    // Two view-toggle buttons; click the second (kanban)
    const toggleBtns = document.querySelectorAll(".view-toggle-btn");
    await user.click(toggleBtns[1]);
    expect(window.localStorage.getItem("appliedViewMode")).toBe("kanban");
  });

  it("renders the kanban board after toggle", async () => {
    const user = userEvent.setup();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    const toggleBtns = document.querySelectorAll(".view-toggle-btn");
    await user.click(toggleBtns[1]);
    expect(document.querySelectorAll(".kanban-column").length).toBe(3);
    expect(document.querySelectorAll(".kanban-column-header").length).toBe(3);
  });
});

describe("Applied — Add form validation", () => {
  it("shows required-field errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.click(screen.getByRole("button", { name: /add application/i }));
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(screen.getByText("Company is required")).toBeInTheDocument();
    expect(screen.getByText("Role is required")).toBeInTheDocument();
    expect(screen.getByText("Date is required")).toBeInTheDocument();
  });

  it("submits a valid form and calls addApplication", async () => {
    const user = userEvent.setup();
    const addApplication = vi.fn().mockResolvedValue({ id: 99 });
    render(
      <Applied
        applications={sampleApps}
        addApplication={addApplication}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.click(screen.getByRole("button", { name: /add application/i }));
    await user.type(screen.getByPlaceholderText("Company Name"), "Foo");
    await user.type(screen.getByPlaceholderText("Role"), "Engineer");
    // Date input has no placeholder; query by id
    const dateInput = document.getElementById("data");
    await user.type(dateInput, "2026-01-01");
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    await waitFor(() => {
      expect(addApplication).toHaveBeenCalled();
    });
  });

  it("submits with a resume file and triggers storage upload", async () => {
    const user = userEvent.setup();
    const addApplication = vi.fn().mockResolvedValue({ id: 99 });
    const updateApplication = vi.fn();
    render(
      <Applied
        applications={sampleApps}
        addApplication={addApplication}
        updateApplication={updateApplication}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.click(screen.getByRole("button", { name: /add application/i }));
    await user.type(screen.getByPlaceholderText("Company Name"), "FooCo");
    await user.type(screen.getByPlaceholderText("Role"), "Eng");
    await user.type(document.getElementById("data"), "2026-01-01");

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["pdf"], "cv.pdf", { type: "application/pdf" });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    await waitFor(() => {
      expect(addApplication).toHaveBeenCalled();
      expect(updateApplication).toHaveBeenCalledWith(99, expect.objectContaining({ resume_url: expect.stringContaining("cv.pdf") }));
    });
  });

  it("can be cancelled, clearing the form", async () => {
    const user = userEvent.setup();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.click(screen.getByRole("button", { name: /add application/i }));
    await user.type(screen.getByPlaceholderText("Company Name"), "Foo");
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: /add application form/i })
      ).not.toBeInTheDocument();
    });
  });
});

describe("Applied — resume upload flow", () => {
  it("rejects files over 5MB and shows an error", async () => {
    const user = userEvent.setup();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.click(screen.getByRole("button", { name: /add application/i }));
    const fileInput = document.querySelector('input[type="file"]');
    const big = new File(["x".repeat(6 * 1024 * 1024)], "huge.pdf", { type: "application/pdf" });
    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
    await user.upload(fileInput, big);
    expect(screen.getByText(/under 5MB/i)).toBeInTheDocument();
  });

  it("accepts a small file and shows the filename", async () => {
    const user = userEvent.setup();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.click(screen.getByRole("button", { name: /add application/i }));
    const fileInput = document.querySelector('input[type="file"]');
    const small = new File(["pdfdata"], "resume.pdf", { type: "application/pdf" });
    await user.upload(fileInput, small);
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
  });
});

describe("Applied — resume view", () => {
  it("opens a signed URL when View Resume is clicked", async () => {
    const user = userEvent.setup();
    const winOpen = vi.spyOn(window, "open").mockImplementation(() => null);
    render(
      <Applied
        applications={[
          { id: 1, company: "Acme", role: "Engineer", data: "2026-01-10", status: "applied", notes: "", resume_url: "me/abc.pdf" },
        ]}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.click(screen.getByRole("button", { name: /^view$/i }));
    await waitFor(() => {
      expect(winOpen).toHaveBeenCalledWith("blob:mock", "_blank");
    });
  });

  it("shows the kanban resume button on a card with a resume", async () => {
    const user = userEvent.setup();
    const winOpen = vi.spyOn(window, "open").mockImplementation(() => null);
    render(
      <Applied
        applications={[
          { id: 1, company: "Acme", role: "Engineer", data: "2026-01-10", status: "applied", notes: "", resume_url: "me/abc.pdf" },
        ]}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    const toggleBtns = document.querySelectorAll(".view-toggle-btn");
    await user.click(toggleBtns[1]);
    const resumeBtn = document.querySelector(".kanban-resume-btn");
    expect(resumeBtn).toBeInTheDocument();
    await user.click(resumeBtn);
    await waitFor(() => {
      expect(winOpen).toHaveBeenCalled();
    });
  });
});

describe("Applied — status custom dropdown in form", () => {
  it("toggles the custom select", async () => {
    const user = userEvent.setup();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.click(screen.getByRole("button", { name: /add application/i }));
    const customBtn = document.querySelector(".custom-select-button");
    await user.click(customBtn);
    expect(document.querySelector(".custom-select-list")).toBeInTheDocument();
    // Pick "Interview"
    const items = document.querySelectorAll(".custom-select-list li");
    await user.click(items[1]);
    expect(document.querySelector(".custom-select-list")).not.toBeInTheDocument();
  });
});

describe("Applied — Kanban drag-and-drop", () => {
  it("updates application status on drop", async () => {
    const user = userEvent.setup();
    const updateApplication = vi.fn();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={updateApplication}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    const toggleBtns = document.querySelectorAll(".view-toggle-btn");
    await user.click(toggleBtns[1]);

    const card = document.querySelector(".kanban-card");
    const targetColumn = document.querySelectorAll(".kanban-column")[1]; // interview column

    fireEvent.dragStart(card);
    fireEvent.dragOver(targetColumn);
    fireEvent.drop(targetColumn);

    await waitFor(() => {
      expect(updateApplication).toHaveBeenCalled();
    });
  });
});

describe("Applied — CSV export", () => {
  it("triggers a download when export is clicked", async () => {
    const createUrlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    render(
      <Applied
        applications={sampleApps}
        addApplication={vi.fn()}
        updateApplication={vi.fn()}
        deleteApplication={vi.fn()}
        session={fakeSession()}
      />
    );
    await user.click(screen.getByRole("button", { name: /export to csv/i }));
    expect(createUrlSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("exports only rows matching the active status filter and search", async () => {
    const apps = [
      { id: 1, company: "Acme", role: "Engineer", data: "2026-01-10", status: "applied", notes: "" },
      { id: 2, company: "Acme", role: "Designer", data: "2026-01-11", status: "interview", notes: "" },
      { id: 3, company: "Beta", role: "Engineer", data: "2026-01-12", status: "interview", notes: "" },
      { id: 4, company: "Beta", role: "Manager", data: "2026-01-13", status: "rejected", notes: "" },
    ];

    // Capture what gets written into the Blob
    let blobContent = "";
    const RealBlob = global.Blob;
    global.Blob = function MockBlob(parts) {
      blobContent = parts.join("");
      return new RealBlob(parts);
    };
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    try {
      const user = userEvent.setup();
      render(
        <Applied
          applications={apps}
          addApplication={vi.fn()}
          updateApplication={vi.fn()}
          deleteApplication={vi.fn()}
          session={fakeSession()}
        />
      );
      await user.selectOptions(screen.getAllByRole("combobox")[0], "interview");
      await user.type(screen.getByPlaceholderText(/search by company or role/i), "acme");
      await user.click(screen.getByRole("button", { name: /export to csv/i }));

      // Only id=2 (Acme + Designer + interview) should be in the export.
      expect(blobContent).toContain("Acme");
      expect(blobContent).toContain("Designer");
      expect(blobContent).not.toContain("Beta");
      expect(blobContent).not.toContain("Manager");
      // Acme + Engineer is "applied", filtered out by status
      expect(blobContent.match(/"Engineer"/g) || []).toHaveLength(0);
    } finally {
      global.Blob = RealBlob;
    }
  });
});
