import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('tickets API integration tests', () => {
  const API_URL = 'http://localhost:8080/api/tickets';
  let testTicketId: string | null = null;

  beforeAll(async () => {
    // Wait a bit to ensure server is ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Cleanup: delete test ticket if it was created
    if (testTicketId) {
      try {
        await fetch(`${API_URL}/${testTicketId}`, { method: 'DELETE' });
      } catch (error) {
        console.warn('Could not delete test ticket:', error);
      }
    }
  });

  it('should fetch all tickets (GET /api/tickets)', async () => {
    const response = await fetch(API_URL);
    expect(response.ok).toBe(true);
    
    const tickets = await response.json();
    expect(Array.isArray(tickets)).toBe(true);
  });

  it('should create a new ticket (POST /api/tickets)', async () => {
    const newTicket = {
      title: 'Test Ticket',
      description: 'This is a test ticket created by vitest',
      priority: 'low',
      requester: 'test@company.com',
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    });

    expect(response.status).toBe(201);
    
    const createdTicket = await response.json();
    expect(createdTicket).toHaveProperty('id');
    expect(createdTicket.id).toMatch(/^T-\d+$/);
    expect(createdTicket.title).toBe(newTicket.title);
    expect(createdTicket.description).toBe(newTicket.description);
    expect(createdTicket.status).toBe('open');
    expect(createdTicket).toHaveProperty('createdAt');
    expect(createdTicket).toHaveProperty('updatedAt');

    // Save for cleanup
    testTicketId = createdTicket.id;
  });

  it('should update an existing ticket (PUT /api/tickets/:id)', async () => {
    // First create a ticket to update
    const newTicket = {
      title: 'Ticket to Update',
      description: 'Will be updated',
      requester: 'test@company.com',
    };

    const createResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    });

    const createdTicket = await createResponse.json();
    const ticketId = createdTicket.id;

    // Update the ticket
    const updateData = {
      title: 'Updated Title',
      status: 'closed',
      assignee: 'john@company.com',
    };

    const updateResponse = await fetch(`${API_URL}/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    expect(updateResponse.ok).toBe(true);

    const updatedTicket = await updateResponse.json();
    expect(updatedTicket.title).toBe('Updated Title');
    expect(updatedTicket.status).toBe('closed');
    expect(updatedTicket.assignee).toBe('john@company.com');

    // Cleanup
    await fetch(`${API_URL}/${ticketId}`, { method: 'DELETE' });
  });

  it('should delete a ticket (DELETE /api/tickets/:id)', async () => {
    // Create a ticket to delete
    const newTicket = {
      title: 'Ticket to Delete',
      description: 'Will be deleted',
      requester: 'test@company.com',
    };

    const createResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    });

    const createdTicket = await createResponse.json();
    const ticketId = createdTicket.id;

    // Delete the ticket
    const deleteResponse = await fetch(`${API_URL}/${ticketId}`, {
      method: 'DELETE',
    });

    expect(deleteResponse.ok).toBe(true);

    // Verify it's deleted
    const getResponse = await fetch(API_URL);
    const allTickets = await getResponse.json();
    const deletedTicket = allTickets.find((t: any) => t.id === ticketId);
    expect(deletedTicket).toBeUndefined();
  });

  it('should return 404 when updating non-existent ticket', async () => {
    const response = await fetch(`${API_URL}/T-999999`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    expect(response.status).toBe(404);
  });

  it('should return 404 when deleting non-existent ticket', async () => {
    const response = await fetch(`${API_URL}/T-999999`, {
      method: 'DELETE',
    });
    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid POST data', async () => {
    const invalidTicket = {
      title: 'Missing description',
      // description is required
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidTicket),
    });

    expect(response.status).toBe(400);
  });

  it('should generate sequential ticket IDs', async () => {
    const ticket1Response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Sequential Test 1',
        description: 'Test sequential IDs',
        requester: 'test@company.com',
      }),
    });

    const ticket2Response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Sequential Test 2',
        description: 'Test sequential IDs',
        requester: 'test@company.com',
      }),
    });

    const ticket1 = await ticket1Response.json();
    const ticket2 = await ticket2Response.json();

    const id1 = parseInt(ticket1.id.replace('T-', ''));
    const id2 = parseInt(ticket2.id.replace('T-', ''));

    expect(id2).toBe(id1 + 1);

    // Cleanup
    await fetch(`${API_URL}/${ticket1.id}`, { method: 'DELETE' });
    await fetch(`${API_URL}/${ticket2.id}`, { method: 'DELETE' });
  });
});
