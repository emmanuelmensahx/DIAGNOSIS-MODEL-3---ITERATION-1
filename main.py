import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os

# Import settings
from app.core.config import settings

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.PROJECT_VERSION,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from app.api.routes import auth, patients, diagnoses, treatments, sync, users, statistics, notifications, prediction, chat, consultations
from app.api import integrations

app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1", tags=["Users"])
app.include_router(patients.router, prefix="/api/v1", tags=["Patients"])
app.include_router(diagnoses.router, prefix="/api/v1", tags=["Diagnoses"])
app.include_router(prediction.router, prefix="/api/v1", tags=["Predictions"])
app.include_router(treatments.router, prefix="/api/v1", tags=["Treatments"])
app.include_router(sync.router, prefix="/api/v1", tags=["Sync"])
app.include_router(statistics.router, prefix="/api/v1", tags=["Statistics"])
app.include_router(notifications.router, prefix="/api/v1", tags=["Notifications"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(consultations.router, prefix="/api/v1", tags=["Consultations"])
app.include_router(integrations.router, prefix="/api/v1", tags=["Integrations"])

# Mount static files from frontend directory
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_path):
    # Mount JS files
    js_path = os.path.join(frontend_path, "js")
    if os.path.exists(js_path):
        app.mount("/js", StaticFiles(directory=js_path), name="js")
    
    # Mount CSS files
    css_path = os.path.join(frontend_path, "css")
    if os.path.exists(css_path):
        app.mount("/css", StaticFiles(directory=css_path), name="css")
    
    # Mount entire frontend for other assets
    app.mount("/frontend", StaticFiles(directory=frontend_path), name="frontend")

@app.get("/", tags=["Root"])
async def read_root():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {
            "message": "Welcome to AfriDiag API",
            "version": "0.1.0",
            "status": "operational",
        }

@app.get("/diagnosis_screen.html", tags=["Frontend"])
async def diagnosis_screen():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "diagnosis_screen.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/patients_screen.html", tags=["Frontend"])
async def patients_screen():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "patients_screen.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/new_patient_screen.html", tags=["Frontend"])
async def new_patient_screen():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "new_patient_screen.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

# Main Application Pages
@app.get("/login.html", tags=["Frontend"])
async def login_page():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "login.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/index.html", tags=["Frontend"])
async def index_page():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/profile_screen.html", tags=["Frontend"])
async def profile_screen():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "profile_screen.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/patient_management.html", tags=["Frontend"])
async def patient_management():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "patient_management.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

# Specialist Pages
@app.get("/specialist_chat.html", tags=["Frontend"])
async def specialist_chat():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "specialist_chat.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/specialist_consultation.html", tags=["Frontend"])
async def specialist_consultation():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "specialist_consultation.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/specialist_dashboard.html", tags=["Frontend"])
async def specialist_dashboard():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "specialist_dashboard.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

# Diagnosis Pages
@app.get("/comprehensive_diagnosis.html", tags=["Frontend"])
async def comprehensive_diagnosis():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "comprehensive_diagnosis.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/enhanced_comprehensive_diagnosis.html", tags=["Frontend"])
async def enhanced_comprehensive_diagnosis():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "enhanced_comprehensive_diagnosis.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/optimized_diagnosis.html", tags=["Frontend"])
async def optimized_diagnosis():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "optimized_diagnosis.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/treatment_guide_screen.html", tags=["Frontend"])
async def treatment_guide_screen():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "treatment_guide_screen.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

# Debug/Test Pages
@app.get("/debug.html", tags=["Frontend"])
async def debug_page():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "debug.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/debug_api_url.html", tags=["Frontend"])
async def debug_api_url():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "debug_api_url.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/test_connection.html", tags=["Frontend"])
async def test_connection():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "test_connection.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/minimal_test.html", tags=["Frontend"])
async def minimal_test():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
    file_path = os.path.join(frontend_path, "minimal_test.html")
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=200)
    else:
        return {"error": "Page not found"}

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "api_version": "0.1.0",
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)