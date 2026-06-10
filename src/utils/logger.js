const levels = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
  debug: "DEBUG",
};

function write(level, message, meta) {
  const payload = {
    level: levels[level] || levels.info,
    time: new Date().toISOString(),
    message,
    ...(meta ? { meta } : {}),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function info(message, meta) { return write("info", message, meta); }
export function warn(message, meta) { return write("warn", message, meta); }
export function error(message, meta) { return write("error", message, meta); }
export function debug(message, meta) { return write("debug", message, meta); }
