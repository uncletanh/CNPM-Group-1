import asyncio
import json
import logging
import os
import uuid
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import WebSocket

logger = logging.getLogger(__name__)

try:
    from redis.asyncio import Redis
except ImportError:  # Cho phep chay local truoc khi cai dependency moi.
    Redis = None  # type: ignore[assignment,misc]


class RealtimeManager:
    def __init__(self) -> None:
        self._agents: dict[int, set[WebSocket]] = defaultdict(set)
        self._widgets: dict[tuple[int, str], set[WebSocket]] = defaultdict(set)
        self._instance_id = uuid.uuid4().hex
        self._subscriber_started = False

    async def connect_agent(self, workspace_id: int, websocket: WebSocket) -> None:
        self._ensure_redis_subscriber()
        await websocket.accept()
        self._agents[workspace_id].add(websocket)

    async def connect_widget(
        self, workspace_id: int, session_key: str, websocket: WebSocket
    ) -> None:
        self._ensure_redis_subscriber()
        await websocket.accept()
        self._widgets[(workspace_id, session_key)].add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        for connections in [*self._agents.values(), *self._widgets.values()]:
            connections.discard(websocket)

    async def notify_agents(self, workspace_id: int, payload: dict) -> None:
        await self._broadcast(self._agents[workspace_id], payload)
        await self._publish("agents", workspace_id, None, payload)

    async def notify_widget(
        self, workspace_id: int, session_key: str, payload: dict
    ) -> None:
        await self._broadcast(self._widgets[(workspace_id, session_key)], payload)
        await self._publish("widget", workspace_id, session_key, payload)

    def _ensure_redis_subscriber(self) -> None:
        if self._subscriber_started or Redis is None or not os.getenv("REDIS_URL", "").strip():
            return
        self._subscriber_started = True
        asyncio.create_task(self._redis_listener())

    async def _publish(
        self,
        target: str,
        workspace_id: int,
        session_key: str | None,
        payload: dict,
    ) -> None:
        redis_url = os.getenv("REDIS_URL", "").strip()
        if Redis is None or not redis_url:
            return
        client = Redis.from_url(redis_url, decode_responses=True)
        try:
            await client.publish(
                "novachat:realtime",
                json.dumps(
                    {
                        "instance": self._instance_id,
                        "target": target,
                        "workspace_id": workspace_id,
                        "session_key": session_key,
                        "payload": payload,
                    },
                    ensure_ascii=False,
                ),
            )
        except Exception as exc:
            logger.warning("Không thể publish sự kiện Redis: %s", exc)
        finally:
            await client.aclose()

    async def _redis_listener(self) -> None:
        redis_url = os.getenv("REDIS_URL", "").strip()
        client = Redis.from_url(redis_url, decode_responses=True)
        pubsub = client.pubsub()
        try:
            await pubsub.subscribe("novachat:realtime")
            async for item in pubsub.listen():
                if item.get("type") != "message":
                    continue
                event = json.loads(item["data"])
                if event.get("instance") == self._instance_id:
                    continue
                workspace_id = int(event["workspace_id"])
                if event.get("target") == "agents":
                    connections = self._agents[workspace_id]
                else:
                    connections = self._widgets[(workspace_id, event.get("session_key"))]
                await self._broadcast(connections, event.get("payload") or {})
        except Exception as exc:
            logger.warning("Redis Pub/Sub tạm dừng: %s", exc)
        finally:
            self._subscriber_started = False
            await pubsub.aclose()
            await client.aclose()

    async def _broadcast(self, connections: set[WebSocket], payload: dict) -> None:
        stale: list[WebSocket] = []
        for websocket in list(connections):
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            connections.discard(websocket)


realtime_manager = RealtimeManager()
_local_locks: dict[int, asyncio.Lock] = defaultdict(asyncio.Lock)


@asynccontextmanager
async def takeover_lock(session_id: int) -> AsyncIterator[bool]:
    """Redis distributed lock; local lock keeps development usable without Redis."""
    redis_url = os.getenv("REDIS_URL", "").strip()
    if Redis is not None and redis_url:
        client = Redis.from_url(redis_url, decode_responses=True)
        lock = client.lock(f"novachat:takeover:{session_id}", timeout=10, blocking_timeout=2)
        try:
            acquired = await lock.acquire()
            yield bool(acquired)
            if acquired and await lock.owned():
                await lock.release()
            return
        except Exception as exc:
            logger.warning("Redis unavailable; using process-local takeover lock: %s", exc)
        finally:
            await client.aclose()

    async with _local_locks[session_id]:
        yield True
