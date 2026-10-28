"""
FastAPI Microservice for Local Medicine AI Inference
Exposes HTTP endpoints for OCR, Candidate Matching, Health, and Full Local Analysis.
"""

import os
import time
import base64
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .local_inference import LocalMedicineInferenceService

app = FastAPI(
    title="Hybrid Indian Medicine Local AI Service",
    version="1.0.0",
    description="Local OCR + ML Matching Engine for Indian Pharmaceutical Packaging",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service singleton in memory
service = LocalMedicineInferenceService()

metrics_store = {
    "total_requests": 0,
    "local_accepted": 0,
    "local_abstained": 0,
    "unreadable_requests": 0,
    "average_latency_ms": 0.0,
    "total_latency_accum_ms": 0.0,
}

class AnalyzeRequest(BaseModel):
    imageBase64: Optional[str] = None
    packagingTextHint: Optional[str] = None
    mimeType: Optional[str] = "image/png"

class MatchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if service.is_ready else "initializing",
        "model_version": service.matcher.config.get("version", "1.0.0"),
        "catalog_size": len(service.catalog_service.records),
        "abstention_threshold": service.matcher.config.get("abstention_threshold", 0.82),
        "is_ready": service.is_ready,
    }

@app.get("/metrics")
def get_metrics():
    return {
        **metrics_store,
        "average_latency_ms": (
            round(metrics_store["total_latency_accum_ms"] / metrics_store["total_requests"], 2)
            if metrics_store["total_requests"] > 0
            else 0.0
        ),
    }

@app.post("/api/ml/ocr")
async def extract_ocr(
    file: Optional[UploadFile] = File(None),
    imageBase64: Optional[str] = Form(None),
):
    start = time.perf_counter()
    image_bytes = None
    if file:
        image_bytes = await file.read()
    elif imageBase64:
        clean = imageBase64.split(",")[-1]
        image_bytes = base64.b64decode(clean)
    else:
        raise HTTPException(status_code=400, detail="No image provided")

    result = service.ocr_engine.extract_text(image_bytes)
    result["latency_ms"] = round((time.perf_counter() - start) * 1000, 2)
    return result

@app.post("/api/ml/match")
def match_candidates(req: MatchRequest):
    start = time.perf_counter()
    candidates = service.matcher.rank_candidates(req.query, top_k=req.top_k or 5)
    decision = service.matcher.evaluate_decision(candidates, query_text=req.query)
    latency = round((time.perf_counter() - start) * 1000, 2)
    return {
        "query": req.query,
        "candidates": candidates,
        "decision": decision,
        "latency_ms": latency,
    }

@app.post("/api/ml/analyze")
async def analyze_medicine(req: AnalyzeRequest):
    start = time.perf_counter()
    image_bytes = None
    if req.imageBase64:
        clean = req.imageBase64.split(",")[-1]
        image_bytes = base64.b64decode(clean)

    result = service.identify_medicine_local(
        image_input=image_bytes,
        packaging_text_hint=req.packagingTextHint,
    )
    latency = round((time.perf_counter() - start) * 1000, 2)

    # Update accounting metrics
    metrics_store["total_requests"] += 1
    metrics_store["total_latency_accum_ms"] += latency
    internal = result.get("_internal", {})
    if internal.get("decision") == "LOCAL_IDENTIFICATION_ACCEPTED":
        metrics_store["local_accepted"] += 1
    elif internal.get("decision") == "UNREADABLE_IMAGE":
        metrics_store["unreadable_requests"] += 1
    else:
        metrics_store["local_abstained"] += 1

    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)
