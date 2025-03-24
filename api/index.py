from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from anthropic import Anthropic

# Create the FastAPI application instance
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client
anthropic = Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Add more routes as needed
