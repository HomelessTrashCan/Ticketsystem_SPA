import React, { useMemo, useState, useEffect } from "react";
import { useAuth, getAuthHeaders } from "./context/AuthContext";
import { Login } from "./components/Login";
import { PERMISSIONS } from "./rbac/permissions";
import { istTitelGueltig, istBeschreibungGueltig, istKommentarGueltig } from "./utils/ticketHelpers";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

type TicketStatus = "open" | "in_progress" | "closed";
type TicketPriority = "low" | "medium" | "high";

type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
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
  createdBy?: string; // User ID who created the ticket
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

const initialTickets: Ticket[] = [];

type Filters = {
  q: string;
  status: "all" | TicketStatus;
  priority: "all" | TicketPriority;
  agent: "all" | string;
  onlyMine: boolean;
};

export default function App() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Laden...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <TicketApp currentUser={user?.email || "unknown@example.com"} onLogout={logout} />;
}

function TicketApp({ currentUser, onLogout }: { currentUser: string; onLogout: () => void }) {
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
  const [agents, setAgents] = useState<string[]>([]);
  
  // State für Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    const apiBase = API_BASE;
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/tickets`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          console.warn("Could not fetch tickets", res.status);
          return;
        }
        const response = await res.json();
        
        // Handle paginated response
        const tickets = response.data || response;
        const paginationData = response.pagination;
        
        if (!mounted) return;
        if (Array.isArray(tickets)) {
          setTickets(tickets);
          setSelectedId(tickets[0]?.id ?? "");
          
          if (paginationData) {
            setPagination(paginationData);
          }
        }
      } catch (err) {
        console.warn("Failed to load tickets from", apiBase, err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Agents vom Backend laden
  useEffect(() => {
    const apiBase = API_BASE;
    const url = `${apiBase}/api/agents`;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(url, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const data: string[] = await res.json();
        if (!mounted) return;
        if (Array.isArray(data)) setAgents(data);
      } catch (err) {
        console.warn('Failed to load agents from', url, err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    return tickets
      .filter((t) => (filters.onlyMine ? t.assignee === currentUser : true))
      .filter((t) => (filters.agent === "all" ? true : t.assignee === filters.agent))
      .filter((t) => (filters.status === "all" ? true : t.status === filters.status))
      .filter((t) => (filters.priority === "all" ? true : t.priority === filters.priority))
      .filter((t) => {
        if (!filters.q) return true;
        const hay = `${t.id} ${t.title} ${t.description} ${t.requester} ${t.assignee ?? ""}`.toLowerCase();
        return hay.includes(filters.q);
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

    //Optimistic UI Update: Ticket sofort hinzufügen
    const tempId = `temp-${uid('T')}`;
    const optimisticTicket: Ticket = {
      id: tempId,
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

    // UI sofort aktualisieren
    setTickets((prev) => [optimisticTicket, ...prev]);
    setSelectedId(tempId);
    setShowNew(false);

    // Dann an Server senden
    try {
      const res = await fetch(`${API_BASE}/api/tickets`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const created: Ticket = await res.json();
      
      // Ersetze optimistisches Ticket mit Server-Response
      setTickets((prev) => 
        prev.map((t) => (t.id === tempId ? created : t))
      );
      setSelectedId(created.id);
    } catch (err) {
      console.error("Persist to server failed:", err);
      // Bei Fehler: Behalte das optimistische Ticket mit lokalem Prefix
      setTickets((prev) => 
        prev.map((t) => (t.id === tempId ? { ...t, id: `local-${uid('T')}` } : t))
      );
    }
  }

  async function updateStatus(id: string, status: TicketStatus) {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;

    //Optimistic UI Update
    const previousTicket = { ...t };
    upsertTicket({ ...t, status, updatedAt: nowIso() });

    try {
      const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Update failed");
      const updated: Ticket = await res.json();
      upsertTicket(updated);
    } catch (err) {
      console.error("Update status error:", err);
      // Rollback bei Fehler
      upsertTicket(previousTicket);
    }
  }

  async function updateAssignee(id: string, assignee: string) {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;

    //Optimistic UI Update
    const previousTicket = { ...t };
    const newAssignee = assignee.trim() ? assignee.trim() : undefined;
    upsertTicket({ ...t, assignee: newAssignee, updatedAt: nowIso() });

    try {
      const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ assignee: newAssignee }),
      });

      if (!res.ok) throw new Error("Update failed");
      const updated: Ticket = await res.json();
      upsertTicket(updated);
    } catch (err) {
      console.error("Update assignee error:", err);
      // Rollback bei Fehler
      upsertTicket(previousTicket);
    }
  }

  async function updatePriority(id: string, priority: TicketPriority) {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;

    //Optimistic UI Update
    const previousTicket = { ...t };
    upsertTicket({ ...t, priority, updatedAt: nowIso() });

    try {
      const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ priority }),
      });

      if (!res.ok) throw new Error("Update failed");
      const updated: Ticket = await res.json();
      upsertTicket(updated);
    } catch (err) {
      console.error("Update priority error:", err);
      // Rollback bei Fehler
      upsertTicket(previousTicket);
    }
  }

  async function addComment(id: string, text: string) {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;

    const c: Comment = { id: uid("C"), author: currentUser, text, createdAt: nowIso() };
    const newComments = [...t.comments, c];

    //Optimistic UI Update
    const previousTicket = { ...t };
    upsertTicket({ ...t, comments: newComments, updatedAt: nowIso() });

    try {
      const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ comments: newComments }),
      });

      if (!res.ok) throw new Error("Update failed");
      const updated: Ticket = await res.json();
      upsertTicket(updated);
    } catch (err) {
      console.error("Add comment error:", err);
      // Rollback bei Fehler
      upsertTicket(previousTicket);
    }
  }

  async function deleteTicket(id: string) {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;

    //Optimistic UI Update
    const previousTickets = [...tickets];
    const previousSelectedId = selectedId;
    
    setTickets((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) {
      const remaining = tickets.filter((t) => t.id !== id);
      setSelectedId(remaining[0]?.id ?? "");
    }

    try {
      console.log('Sending DELETE for', id);
      const response = await fetch(`${API_BASE}/api/tickets/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      console.log('Delete response status', response.status);
      if (!response.ok) {
        const text = await response.text();
        console.error('Delete response body:', text);
        throw new Error("Delete failed");
      }
      console.log(`Das Ticket ${id} wurde gelöscht`);
    } catch (err) {
      console.error("Delete error:", err);
      // Rollback bei Fehler
      setTickets(previousTickets);
      setSelectedId(previousSelectedId);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo" aria-hidden />
          <div>
            <div className="brandTitle">Ticket System</div>
            <div className="brandSub">Demo (Vite + React)</div>
          </div>
        </div>

        <div className="topbarActions">
          <span className="user-info">👤 {currentUser}</span>
          <button className="btn" onClick={() => setShowNew(true)}>
            + Neues Ticket
          </button>
          <button className="btn" onClick={onLogout}>
            Abmelden
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
                placeholder="z.B. stichwortartig T-1002, login, maria…"
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
              </label>
            </div>

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

            <label className="check">
              <input
                type="checkbox"
                checked={filters.onlyMine}
                onChange={(e) => setFilters((f) => ({ ...f, onlyMine: e.target.checked }))}
              />
              <span>Nur eigene Tickets (Assignee = {currentUser})</span>
            </label>

            <button
              className="btn filter-reset-btn"
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
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  ← Vorherige
                </button>
                
                <span>
                  Seite {pagination.page} von {pagination.totalPages} 
                  ({pagination.total} Tickets)
                </span>
                
                <button 
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  Nächste →
                </button>
              </div>
            )}
          </div>
        </aside>

        <section className="content">
          {selected ? (
            <TicketDetail
              ticket={selected}
              agents={agents}
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
          <NewTicketForm onCreate={createTicket} agents={agents} />
        </Modal>
      )}
    </div>
  );
}

function TicketDetail(props: {
  ticket: Ticket;
  agents: string[];
  onStatusChange: (s: TicketStatus) => void;
  onAssigneeChange: (a: string) => void;
  onPriorityChange: (p: TicketPriority) => void;
  onAddComment: (text: string) => void;
  onDelete: () => void;
}) {
  const { ticket } = props;
  const [comment, setComment] = useState("");
  const { hasPermission } = useAuth();
  
  // Permission checks
  const canDelete = hasPermission(PERMISSIONS.TICKET_DELETE);
  const canEditPriority = hasPermission(PERMISSIONS.PRIORITY_EDIT);
  const canAssign = hasPermission(PERMISSIONS.TICKET_ASSIGN);
  const canChangeStatusAll = hasPermission(PERMISSIONS.STATUS_CHANGE_ALL);
  const canCloseOwn = hasPermission(PERMISSIONS.TICKET_CLOSE_OWN);
  const canCommentOnClosed = hasPermission(PERMISSIONS.COMMENT_ADD_CLOSED);

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

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Only show delete button if user has permission */}
          {canDelete && (
            <button className="btn danger" onClick={props.onDelete} title="Ticket löschen">
              Löschen
            </button>
          )}
          
          {/* Users with canCloseOwn can close tickets */}
          {canCloseOwn && !canChangeStatusAll && ticket.status !== 'closed' && (
            <button 
              className="btn" 
              onClick={() => props.onStatusChange('closed')} 
              title="Ticket schließen"
            >
              Ticket schließen
            </button>
          )}
        </div>
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
              {/* Only users with TICKET_ASSIGN permission can change assignee */}
              {canAssign ? (
                <select
                  className="select"
                  value={ticket.assignee ?? ""}
                  onChange={(e) => props.onAssigneeChange(e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {props.agents.map((agent) => (
                    <option key={agent} value={agent}>
                      {agent}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{ticket.assignee || "Nicht zugewiesen"}</span>
              )}
            </div>

            <div className="k">Status</div>
            <div className="v">
              {/* Only users with STATUS_CHANGE_ALL permission can change status via dropdown */}
              {canChangeStatusAll ? (
                <select
                  className="select"
                  value={ticket.status}
                  onChange={(e) => props.onStatusChange(e.target.value as TicketStatus)}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="closed">Closed</option>
                </select>
              ) : (
                <StatusPill status={ticket.status} />
              )}
            </div>

            <div className="k">Priorität</div>
            <div className="v">
              {/* Only users with PRIORITY_EDIT permission can change priority */}
              {canEditPriority ? (
                <select
                  className="select"
                  value={ticket.priority}
                  onChange={(e) => props.onPriorityChange(e.target.value as TicketPriority)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <PriorityPill priority={ticket.priority} />
              )}
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

        {/* Only allow comments on open tickets, or closed if user has permission */}
        {(ticket.status !== 'closed' || canCommentOnClosed) ? (
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
                  
                  // Validierung mit Unit-getesteter Funktion
                  if (!istKommentarGueltig(t)) {
                    alert('Kommentar darf nicht leer sein und maximal 500 Zeichen haben!');
                    return;
                  }
                  
                  props.onAddComment(t);
                  setComment("");
                }}
              >
                Kommentar hinzufügen
              </button>
            </div>
          </div>
        ) : (
          <div className="empty" style={{ marginTop: '16px', fontStyle: 'italic', color: '#666' }}>
            Dieses Ticket ist geschlossen. Keine weiteren Kommentare möglich.
          </div>
        )}
      </div>
    </div>
  );
}

function NewTicketForm(props: { onCreate: (t: any) => void; agents: string[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [requester, setRequester] = useState("dev@company.com");
  const [assignee, setAssignee] = useState("");
  const { hasPermission } = useAuth();
  
  // Permission checks
  const canEditPriority = hasPermission(PERMISSIONS.PRIORITY_EDIT);
  const canAssign = hasPermission(PERMISSIONS.TICKET_ASSIGN);

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const t = title.trim();
        const d = description.trim();
        
        
        // Validierung mit Unit-getesteten Funktionen
        if (!istTitelGueltig(t)) {
          alert('Titel muss zwischen 3 und 100 Zeichen lang sein!');
          return;
        }
        
 if (!istBeschreibungGueltig(d)) {
          alert('Beschreibung muss zwischen 3 und 100 Zeichen lang sein!');
          return;
        }

/*
        if (!istKommentarGueltig(d)) {
          alert('Kommentar darf nicht leer sein!');
          return;
        }
   */     
        // Users only send title and description, backend sets requester/priority/assignee
        // Users with permissions can set additional fields
        const ticketData: any = { title: t, description: d };
        if (canEditPriority) {
          ticketData.priority = priority;
          ticketData.requester = requester.trim();
        }
        if (canAssign) {
          ticketData.assignee = assignee;
        }
       
        
        props.onCreate(ticketData);
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

      {/* Only users with PRIORITY_EDIT permission can set priority and requester */}
      {canEditPriority && (
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
      )}

      {/* Only users with TICKET_ASSIGN permission can assign tickets */}
      {canAssign && (
        <label className="field">
          <div className="label">Assignee</div>
          <select className="select" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">-- Unassigned --</option>
            {props.agents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
        </label>
      )}

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
