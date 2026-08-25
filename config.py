import os

class Config:
    # Never use "*" in production.
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://127.0.0.1:5500,http://localhost:5500"
        ).split(",")
        if origin.strip()
    ]
    MAX_CONTENT_LENGTH = 64 * 1024
    RATELIMIT_DEFAULT = "60 per minute"
