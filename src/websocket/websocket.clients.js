import { randomUUID } from "crypto";

const clients = new Map();
const channels = new Map();

export function addClient(socket, metadata = {}) {
  const id = metadata.id || randomUUID();
  const client = {
    id,
    socket,
    channels: new Set(),
    connectedAt: new Date(),
    metadata,
  };

  clients.set(id, client);
  return client;
}

export function removeClient(client) {
  if (!client) {
    return;
  }

  for (const channel of client.channels) {
    unsubscribeClient(client, channel);
  }

  clients.delete(client.id);
}

export function subscribeClient(client, channel) {
  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }

  channels.get(channel).add(client.id);
  client.channels.add(channel);
}

export function unsubscribeClient(client, channel) {
  const subscribers = channels.get(channel);

  if (subscribers) {
    subscribers.delete(client.id);

    if (subscribers.size === 0) {
      channels.delete(channel);
    }
  }

  client.channels.delete(channel);
}

export function getClientsByChannel(channel) {
  const subscribers = channels.get(channel);

  if (!subscribers) {
    return [];
  }

  return [...subscribers].map((id) => clients.get(id)).filter(Boolean);
}

export function getStats() {
  return {
    clients: clients.size,
    channels: channels.size,
  };
}

export default {
  addClient,
  removeClient,
  subscribeClient,
  unsubscribeClient,
  getClientsByChannel,
  getStats,
};
