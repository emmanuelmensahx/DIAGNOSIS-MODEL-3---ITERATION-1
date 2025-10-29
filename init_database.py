#!/usr/bin/env python3
"""
Database initialization script for AfriDiag

This script initializes the PostgreSQL and MongoDB databases with:
- All required tables and collections
- Default admin, frontline worker, and specialist users
- Sample data for testing

Usage:
    python init_database.py
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.init_db import init_database

if __name__ == "__main__":
    print("AfriDiag Database Initialization")
    print("=" * 40)
    print()
    
    try:
        init_database()
        print()
        print("✅ Database initialization completed successfully!")
        print()
        print("You can now start the API server with:")
        print("  python -m uvicorn main:app --reload")
        print()
        print("API Documentation will be available at:")
        print("  http://127.0.0.1:8000/docs")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        print()
        print("Please check your database configuration and try again.")
        sys.exit(1)