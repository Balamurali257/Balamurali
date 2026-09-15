import time
from collections import defaultdict
from flask import request

# In-memory sliding window rate limiter
# Key -> list of timestamps
_rate_limits = defaultdict(list)
_failed_attempts = defaultdict(int)
_cooldown_until = defaultdict(float)

def is_rate_limited(action_key: str, max_requests: int = 5, window_seconds: int = 60) -> bool:
    """
    Checks whether a specific action identified by action_key has exceeded
    max_requests in window_seconds.
    """
    now = time.time()
    # Check active cooldown
    if _cooldown_until[action_key] > now:
        return True
        
    timestamps = _rate_limits[action_key]
    # Prune old timestamps
    _rate_limits[action_key] = [ts for ts in timestamps if ts > now - window_seconds]
    
    if len(_rate_limits[action_key]) >= max_requests:
        # Enforce a 60-second cooldown
        _cooldown_until[action_key] = now + 60
        return True
        
    _rate_limits[action_key].append(now)
    return False

def get_cooldown_remaining(action_key: str) -> int:
    """Returns remaining seconds for cooldown, or 0."""
    now = time.time()
    remaining = _cooldown_until[action_key] - now
    return max(0, int(remaining))

def record_failed_attempt(action_key: str, max_attempts: int = 5, lock_duration: int = 300) -> int:
    """
    Increments failed attempts. If threshold exceeded, activates cooldown/lock.
    Returns current failure count.
    """
    _failed_attempts[action_key] += 1
    if _failed_attempts[action_key] >= max_attempts:
        _cooldown_until[action_key] = time.time() + lock_duration
    return _failed_attempts[action_key]

def reset_failed_attempts(action_key: str):
    """Resets failed attempts and cooldown upon successful action."""
    _failed_attempts.pop(action_key, None)
    _cooldown_until.pop(action_key, None)
    _rate_limits.pop(action_key, None)

def get_client_ip() -> str:
    """Safely gets client IP considering common reverse proxies."""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr or '127.0.0.1'
