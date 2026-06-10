function parseChannel(channel) {
  const [resource, id] = String(channel || "").split(":");
  return { resource, id };
}

function hasPermission(identity, permission) {
  return Array.isArray(identity.permissions) && identity.permissions.includes(permission);
}

function canSubscribe(identity, channel) {
  if (!identity || identity.type === "anonymous") {
    return false;
  }

  if (identity.type === "system") {
    return true;
  }

  if (identity.role === "admin") {
    return true;
  }

  const { resource, id } = parseChannel(channel);

  if (resource === "tutor") {
    return identity.role === "tutor" && String(identity.userId) === id;
  }

  if (resource === "veterinario") {
    return identity.role === "veterinario" && String(identity.userId) === id;
  }

  if (resource === "notificacoes") {
    return hasPermission(identity, `channel:${channel}`);
  }

  return hasPermission(identity, `channel:${channel}`);
}

export default {
  canSubscribe,
};
