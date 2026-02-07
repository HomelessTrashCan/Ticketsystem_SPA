
import React, { useMemo, useState, useEffect } from "react";
import { agents } from "./data/agents.js";

type TicketStatus = "open" | "in_progress" | "closed";
type TicketPriority = "low" | "medium" | "high";

type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: string; // ISO
};

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  requester: string;
  assignee?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  comments: Comment[];
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

// start with empty list; we'll load from the backend (src/data/tickethistory.json -> /tickets)
const initialTickets: Ticket[] = [];

type Filters = {
  q: string;
  status: "all" | TicketStatus;
  priority: "all" | TicketPriority;
  agent: "all" | string;
  onlyMine: boolean;
};

const currentUser = "dev@company.com";

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [selectedId, setSelectedId] = useState<string>(initialTickets[0]?.id ?? "");
  const [filters, setFilters] = useState<Filters>({
    q: "",
    status: "all",
    priority: "all",
    agent: "all",
    onlyMine: false,
  });
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
    const url = `${apiBase}/api/tickets`;
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.warn("Could not fetch tickets", res.status);
          return;
        }
        const data: Ticket[] = await res.json();
        if (!mounted) return;
        if (Array.isArray(data)) {
          setTickets(data);
          setSelectedId(data[0]?.id ?? "");
        }
      } catch (err) {
        console.warn("Failed to load tickets from", url, err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return tickets
      .filter((t) => (filters.onlyMine ? t.assignee === currentUser : true))
      .filter((t) => (filters.agent === "all" ? true : t.assignee === filters.agent))
      .filter((t) => (filters.status === "all" ? true : t.status === filters.status))
      .filter((t) => (filters.priority === "all" ? true : t.priority === filters.priority))
      .filter((t) => {
        if (!q) return true;
        const hay = `${t.id} ${t.title} ${t.description} ${t.requester} ${t.assignee ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tickets, filters]);

  const selected = useMemo(() => tickets.find((t) => t.id === selectedId) ?? null, [tickets, selectedId]);

  function upsertTicket(next: Ticket) {
    setTickets((prev) => {
      const idx = prev.findIndex((t) => t.id === next.id);
      if (idx === -1) return [next, ...prev];
      const copy = prev.slice();
      copy[idx] = next;
      return copy;
    });
  }

  async function createTicket(input: {
    title: string;
    description: string;
    priority: TicketPriority;
    requester: string;
    assignee?: string;
  }) {
    const payload = {
      title: input.title,
      description: input.description,
      priority: input.priority,
      requester: input.requester,
      assignee: input.assignee?.trim() ? input.assignee.trim() : undefined,
    };

    // Versuche, an ein lokales Backend zu posten. Falls das fehlschlägt,
    // fällt das UI auf lokales React-State-Only zurück.
    try {
      const res = await fetch("http://localhost:4000/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const created: Ticket = await res.json();
      setTickets((prev) => [created, ...prev]);
      setSelectedId(created.id);
    } catch (err) {
      // Fallback: lokale Erzeugung (nicht persistent auf Disk)
      console.error("Persist to server failed, falling back to local state:", err);
      const t: Ticket = {
        id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
        title: payload.title,
        description: payload.description,
        status: "open",
        priority: payload.priority,
        requester: payload.requester,
        assignee: payload.assignee,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        comments: [],
      };
      setTickets((prev) => [t, ...prev]);
      setSelectedId(t.id);
    } finally {
      setShowNew(false);
    }
  }

  async function updateStatus(id: string, status: TicketStatus) {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;

    try {
      const res = await fetch(`http://localhost:4000/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Update failed");
      const updated: Ticket = await res.json();
      upsertTicket(updated);
    } catch (err) {
      console.error("Update status error:", err);
      // Fallback: lokale Änderung
      upsertTicket({ ...t, status, updatedAt: nowIso() });
    }
  }

  async function updateAssignee(id: string, assignee: string) {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;

    try {
      const res = await fetch(`http://localhost:4000/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee: assignee.trim() ? assignee.trim() : undefined }),
      });

      if (!res.ok) throw new Error("Update failed");
      const updated: Ticket = await res.json();
      upsertTicket(updated);
    } catch (err) {
      console.error("Update assignee error:", err);
      // Fallback: lokale Änderung
      upsertTicket({ ...t, assignee: assignee.trim() ? assignee.trim() : undefined, updatedAt: nowIso() });
    }
  }

  async function updatePriority(id: string, priority: TicketPriority) {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;

    try {
      const res = await fetch(`http://localhost:4000/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });

      if (!res.ok) throw new Error("Update failed");
      const updated: Ticket = await res.json();
      upsertTicket(updated);
    } catch (err) {
      console.error("Update priority error:", err);
      // Fallback: lokale Änderung
      upsertTicket({ ...t, priority, updatedAt: nowIso() });
    }
  }

  async function addComment(id: string, text: string) {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;

    const c: Comment = { id: uid("C"), author: currentUser, text, createdAt: nowIso() };
    const newComments = [...t.comments, c];

    try {
      const res = await fetch(`http://localhost:4000/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: newComments }),
      });

      if (!res.ok) throw new Error("Update failed");
      const updated: Ticket = await res.json();
      upsertTicket(updated);
    } catch (err) {
      console.error("Add comment error:", err);
      // Fallback: lokale Änderung
      upsertTicket({ ...t, comments: newComments, updatedAt: nowIso() });
    }
  }

  async function deleteTicket(id: string) {
    try {
      const response = await fetch(`http://localhost:4000/api/tickets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      // Frontend Update: Ticket aus State entfernen
      setTickets((prev) => prev.filter((t) => t.id !== id));
      if (selectedId === id) {
        const remaining = tickets.filter((t) => t.id !== id);
        setSelectedId(remaining[0]?.id ?? "");
      }
      console.log(`Ticket ${id} gelöscht`);
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo" aria-hidden />
          <div>
            <div className="brandTitle">Ticket System</div>
            <div className="brandSub">UI Demo (Vite + React)</div>
          </div>
        </div>

        <div className="topbarActions">
          <button className="btn" onClick={() => setShowNew(true)}>
            + Neues Ticket
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <div className="panel">
            <div className="panelTitle">Suche & Filter</div>

            <label className="field">
              <div className="label">Suche</div>
              <input
                className="input"
                placeholder="z.B. T-1002, login, maria…"
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              />
            </label>

            <div className="row2">
              <label className="field">
                <div className="label">Status</div>
                <select
                  className="select"
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any }))}
                >
                  <option value="all">Alle</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="closed">Closed</option>
                </select>
              </label>

              <label className="field">
                <div className="label">Priorität</div>
                <select
                  className="select"
                  value={filters.priority}
                  onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value as any }))}
                >
                  <option value="all">Alle</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>


                <label className="field">
                <div className="label">Assignee</div>
                <select
                  className="select"
                  value={filters.agent}
                  onChange={(e) => setFilters((f) => ({ ...f, agent: e.target.value as any }))}
                >
                  <option value="all">Alle</option>
                  {agents.map((agent) => (
                    <option key={agent} value={agent}>
                      {agent}
                    </option>
                  ))}
                </select>
              </label>
              </label>
            </div>

            <label className="check">
              <input
                type="checkbox"
                checked={filters.onlyMine}
                onChange={(e) => setFilters((f) => ({ ...f, onlyMine: e.target.checked }))}
              />
              <span>Nur meine Tickets (Assignee = {currentUser})</span>
            </label>

            <button
              className="btn"
              onClick={() =>
                setFilters({
                  q: "",
                  status: "all",
                  priority: "all",
                  agent: "all",
                  onlyMine: false,
                })
              }
            >
              Filter zurücksetzen
            </button>
            <br />
            <br />
          </div>

          <div className="panel">
            <div className="panelTitle">Tickets ({filtered.length})</div>

            <div className="list">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  className={`listItem ${t.id === selectedId ? "active" : ""}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className="liTop">
                    <span className="mono">{t.id}</span>
                    <StatusPill status={t.status} />
                  </div>
                  <div className="liTitle">{t.title}</div>
                  <div className="liMeta">
                    <PriorityPill priority={t.priority} />
                    <span className="dot">•</span>
                    <span className="muted">Updated {formatDate(t.updatedAt)}</span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <div className="empty">Keine Treffer.</div>}
            </div>
          </div>
        </aside>

        <section className="content">
          {selected ? (
            <TicketDetail
              ticket={selected}
              onStatusChange={(s) => updateStatus(selected.id, s)}
              onAssigneeChange={(a) => updateAssignee(selected.id, a)}
              onPriorityChange={(p) => updatePriority(selected.id, p)}
              onAddComment={(text) => addComment(selected.id, text)}
              onDelete={() => deleteTicket(selected.id)}
            />
          ) : (
            <div className="panel">
              <div className="empty">Kein Ticket ausgewählt.</div>
            </div>
          )}
        </section>
      </main>

      {showNew && (
        <Modal title="Neues Ticket" onClose={() => setShowNew(false)}>
          <NewTicketForm onCreate={createTicket} />
        </Modal>
      )}
    </div>
  );
}

function TicketDetail(props: {
  ticket: Ticket;
  onStatusChange: (s: TicketStatus) => void;
  onAssigneeChange: (a: string) => void;
  onPriorityChange: (p: TicketPriority) => void;
  onAddComment: (text: string) => void;
  onDelete: () => void;
}) {
  const { ticket } = props;
  const [comment, setComment] = useState("");

  return (
    <div className="panel detail">
      <div className="detailHeader">
        <div>
          <div className="detailTitle">
            <span className="mono">{ticket.id}</span> {ticket.title}
          </div>
          <div className="detailSub">
            <StatusPill status={ticket.status} /> <PriorityPill priority={ticket.priority} />
            <span className="dot">•</span>
            <span className="muted">Created {formatDate(ticket.createdAt)}</span>
            <span className="dot">•</span>
            <span className="muted">Updated {formatDate(ticket.updatedAt)}</span>
          </div>
        </div>

        <button className="btn danger" onClick={props.onDelete} title="Ticket löschen">
          Löschen
        </button>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="cardTitle">Beschreibung</div>
          <div className="cardBody">{ticket.description}</div>
        </div>

        <div className="card">
          <div className="cardTitle">Details</div>
          <div className="kv">
            <div className="k">Requester</div>
            <div className="v">{ticket.requester}</div>

            <div className="k">Assignee</div>
            <div className="v">
              <select
                className="select"
                value={ticket.assignee ?? ""}
                onChange={(e) => props.onAssigneeChange(e.target.value)}
              >
                <option value="">-- Unassigned --</option>
                {agents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>

            <div className="k">Status</div>
            <div className="v">
              <select
                className="select"
                value={ticket.status}
                onChange={(e) => props.onStatusChange(e.target.value as TicketStatus)}
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="k">Priorität</div>
            <div className="v">
              <select
                className="select"
                value={ticket.priority}
                onChange={(e) => props.onPriorityChange(e.target.value as TicketPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">Kommentare ({ticket.comments.length})</div>

        <div className="comments">
          {ticket.comments.map((c) => (
            <div key={c.id} className="comment">
              <div className="commentMeta">
                <span className="mono">{c.author}</span>
                <span className="dot">•</span>
                <span className="muted">{formatDate(c.createdAt)}</span>
              </div>
              <div>{c.text}</div>
            </div>
          ))}
          {ticket.comments.length === 0 && <div className="empty">Noch keine Kommentare.</div>}
        </div>

        <div className="commentBox">
          <textarea
            className="textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Kommentar schreiben…"
          />
          <div className="commentActions">
            <button
              className="btn"
              onClick={() => {
                const t = comment.trim();
                if (!t) return;
                props.onAddComment(t);
                setComment("");
              }}
            >
              Kommentar hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewTicketForm(props: { onCreate: (t: any) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [requester, setRequester] = useState("dev@company.com");
  const [assignee, setAssignee] = useState("");

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const t = title.trim();
        const d = description.trim();
        if (!t || !d) return;
        props.onCreate({ title: t, description: d, priority, requester: requester.trim(), assignee });
      }}
    >
      <label className="field">
        <div className="label">Titel *</div>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label className="field">
        <div className="label">Beschreibung *</div>
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <div className="row2">
        <label className="field">
          <div className="label">Priorität</div>
          <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className="field">
          <div className="label">Requester</div>
          <input className="input" value={requester} onChange={(e) => setRequester(e.target.value)} />
        </label>
      </div>

      <label className="field">
        <div className="label">Assignee</div>
        <select className="select" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">-- Unassigned --</option>
          {agents.map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </select>
      </label>

      <div className="formActions">
        <button className="btn" type="submit">
          Ticket erstellen
        </button>
      </div>
      <div className="hint">* Pflichtfelder. Speicherung ist nur im Browser-State.</div>
    </form>
  );
}

function Modal(props: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modalHeader">
          <div className="modalTitle">{props.title}</div>
          <button className="iconBtn" onClick={props.onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modalBody">{props.children}</div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: TicketStatus }) {
  const label = status === "open" ? "Open" : status === "in_progress" ? "In progress" : "Closed";
  return <span className={`pill status ${status}`}>{label}</span>;
}

function PriorityPill({ priority }: { priority: TicketPriority }) {
  const label = priority === "low" ? "Low" : priority === "medium" ? "Medium" : "High";
  return <span className={`pill prio ${priority}`}>{label}</span>;
}
