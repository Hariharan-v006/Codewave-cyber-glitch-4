import httpx
import asyncio

async def test_auth():
    async with httpx.AsyncClient() as client:
        # Register
        print("Registering...")
        resp = await client.post("http://localhost:8000/api/auth/register", json={"email": "test@test.com", "password": "password"})
        print(resp.status_code, resp.text)

        # Login
        print("Logging in...")
        resp = await client.post("http://localhost:8000/api/auth/login", json={"email": "test@test.com", "password": "password"})
        print(resp.status_code, resp.text)

if __name__ == "__main__":
    asyncio.run(test_auth())
