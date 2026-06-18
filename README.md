# Servidor de tempo real

Este servico funciona como gateway de atualizacao e mensagens em tempo real entre
`api_pet`, `pet` (Django) e clientes WebSocket.

## Fluxo

1. `api_pet` ou `pet` envia um evento HTTP para `POST /api/publish`.
2. O servidor publica a mensagem no canal informado.
3. Clientes conectados por WebSocket e inscritos no canal recebem a atualizacao.

Quando `REDIS_URL` esta configurado, o Redis e usado como barramento. Sem Redis,
o envio funciona apenas dentro da mesma instancia Node.

## Variaveis de ambiente

```env
PORT=3000
CORS_ORIGIN=*
REDIS_URL=redis://usuario:senha@host:porta
API_TOKEN=troque-este-token
WEBSOCKET_TOKEN=troque-este-token
JWT_SECRET=
ALLOW_CLIENT_PUBLISH=false
```

Use o mesmo `API_TOKEN` no Django/`api_pet` para publicar eventos. Use
`WEBSOCKET_TOKEN` para clientes simples ou `JWT_SECRET` para autenticar clientes
com JWT HS256 e controlar inscricao por canal.

## Publicar evento pelo Django ou api_pet

Instale `requests` no projeto Python, se ainda nao existir:

```bash
pip install requests
```

Crie um helper no projeto Django:

```python
# realtime.py
import os
import requests

REALTIME_URL = os.getenv("REALTIME_URL", "http://localhost:3000")
REALTIME_API_TOKEN = os.getenv("REALTIME_API_TOKEN", "")


def publish_realtime(channel, event, payload):
    headers = {}
    if REALTIME_API_TOKEN:
        headers["Authorization"] = f"Bearer {REALTIME_API_TOKEN}"

    response = requests.post(
        f"{REALTIME_URL}/api/publish",
        json={
            "channel": channel,
            "event": event,
            "payload": payload,
        },
        headers=headers,
        timeout=5,
    )
    response.raise_for_status()
    return response.json()
```

Exemplo de uso depois de criar ou atualizar uma consulta:

```python
publish_realtime(
    channel=f"tutor:{consulta.pet.tutor_id}",
    event="consulta_atualizada",
    payload={
        "consulta_id": consulta.id,
        "status": consulta.status,
        "pet_id": consulta.pet_id,
    },
)
```

## Cliente WebSocket

```js
const token = "mesmo-valor-do-WEBSOCKET_TOKEN";
const socket = new WebSocket(`ws://localhost:3000?token=${token}`);

socket.addEventListener("open", () => {
  socket.send(JSON.stringify({
    type: "subscribe",
    channel: "tutor:123"
  }));
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  console.log("tempo real:", message);
});
```

## Contrato das mensagens

Publicacao HTTP:

```json
{
  "channel": "tutor:123",
  "event": "consulta_atualizada",
  "payload": {
    "consulta_id": 10
  }
}
```

Mensagem recebida no WebSocket:

```json
{
  "channel": "tutor:123",
  "event": "consulta_atualizada",
  "payload": {
    "consulta_id": 10
  },
  "sentAt": "2026-06-18T12:00:00.000Z"
}
```

## Canais sugeridos

- `tutor:<id>`: atualizacoes destinadas ao tutor.
- `veterinario:<id>`: agenda, consultas e atendimentos do veterinario.
- `pet:<id>`: atualizacoes especificas de um pet.
- `notificacoes:<id>`: notificacoes gerais de usuario.

## Rodar

```bash
npm install
npm run dev
```

Health check:

```bash
curl http://localhost:3000/health
```

