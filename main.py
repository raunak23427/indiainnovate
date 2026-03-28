from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from typing import List
import sqlite3
import os
import base64
import json
import google.generativeai as genai

app = FastAPI()
app.mount("/", StaticFiles(directory=".", html=True), name="static")

DB_PATH = "voters.db"

# Configure Gemini API
genai.configure(api_key="AIzaSyBe3UPZ-qoFhBG0MauSHD2fY7R4qFw10vs")

class Voter(BaseModel):
    epic_number: str
    serial_number: int
    voter_name: str
    relation_type: str
    relative_name: str
    house_number: str
    age: int
    gender: str
    assembly_constituency: str
    section_name: str


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.post("/init_db")
def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS voters (
            epic_number TEXT PRIMARY KEY,
            serial_number INTEGER,
            voter_name TEXT,
            relation_type TEXT,
            relative_name TEXT,
            house_number TEXT,
            age INTEGER,
            gender TEXT,
            assembly_constituency TEXT,
            section_name TEXT
        )
    """)
    conn.commit()
    conn.close()
    return {"message": "Database initialized successfully"}


@app.post("/api/admin/upload_voters")
def upload_voters(voters: List[Voter]):
    conn = get_connection()
    inserted = 0
    skipped = 0
    for voter in voters:
        try:
            conn.execute(
                """
                INSERT INTO voters (
                    epic_number, serial_number, voter_name, relation_type,
                    relative_name, house_number, age, gender,
                    assembly_constituency, section_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    voter.epic_number,
                    voter.serial_number,
                    voter.voter_name,
                    voter.relation_type,
                    voter.relative_name,
                    voter.house_number,
                    voter.age,
                    voter.gender,
                    voter.assembly_constituency,
                    voter.section_name,
                ),
            )
            inserted += 1
        except sqlite3.IntegrityError:
            skipped += 1
    conn.commit()
    conn.close()
    return {"inserted": inserted, "skipped": skipped}


@app.get("/api/voters")
def get_voters():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM voters").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/admin/extract_image")
async def extract_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    ext = file.filename.split(".")[-1].lower()
    mime = "image/jpeg" if ext in ["jpg", "jpeg"] else "image/png"

    prompt = (
        "This is an Indian Electoral Roll page. It has a specific layout. "
        "1. The top header contains global data: 'Assembly Constituency No and Name' and 'Section No and Name'. Extract these once. "
        "2. The rest of the page is a grid of boxes. Each box represents one unique voter. "
        "Extract their Serial Number, EPIC Number (usually top right of the box), Name, "
        "Relation Type (infer from Father's/Husband's name), Relative Name, House Number, Age, and Gender. "
        "3. Return ONLY a raw JSON array of objects. Every object must represent one voter and include "
        "both their unique data and the global header data. The keys must be exactly: "
        "epic_number, serial_number, voter_name, relation_type, relative_name, house_number, age, gender, "
        "assembly_constituency, section_name."
    )

    model = genai.GenerativeModel('gemini-1.5-pro')
    response = model.generate_content(
        [
            prompt,
            {"mime_type": mime, "data": image_bytes}
        ]
    )

    raw = response.text.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    try:
        voters = json.loads(raw)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to parse JSON from model response: " + raw[:300])

    conn = get_connection()
    inserted = 0
    skipped = 0
    for v in voters:
        try:
            conn.execute(
                """
                INSERT INTO voters (
                    epic_number, serial_number, voter_name, relation_type,
                    relative_name, house_number, age, gender,
                    assembly_constituency, section_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(v.get("epic_number", "")),
                    int(v.get("serial_number", 0)),
                    str(v.get("voter_name", "")),
                    str(v.get("relation_type", "")),
                    str(v.get("relative_name", "")),
                    str(v.get("house_number", "")),
                    int(v.get("age", 0)),
                    str(v.get("gender", "")),
                    str(v.get("assembly_constituency", "")),
                    str(v.get("section_name", "")),
                ),
            )
            inserted += 1
        except sqlite3.IntegrityError:
            skipped += 1
    conn.commit()
    conn.close()

    return {"inserted": inserted, "skipped": skipped, "voters": voters}


class ComplaintRequest(BaseModel):
    epic_number: str
    grievance_text: str


@app.post("/api/citizen/complaint")
def submit_complaint(req: ComplaintRequest):
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            epic_number TEXT,
            grievance_text TEXT,
            category TEXT,
            status TEXT
        )
    """)
    conn.commit()

    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(
        "Categorize the following civic grievance into exactly one of these categories: "
        "'Solid Waste & Garbage Management', 'Public Infrastructure & Roads', 'Water & Drainage', "
        "'Electrical & Streetlights', 'Public Health & Sanitation', 'Encroachment & Illegal Construction', "
        "'Animal Control', 'Horticulture & Parks', 'Dust & Air Pollution', or 'Other'. "
        "Return ONLY the category name as plain text. Text: " + req.grievance_text
    )

    category = response.text.strip()

    conn.execute(
        "INSERT INTO complaints (epic_number, grievance_text, category, status) VALUES (?, ?, ?, ?)",
        (req.epic_number, req.grievance_text, category, "Pending"),
    )
    conn.commit()
    conn.close()

    return {"message": "Complaint submitted", "category": category}


@app.get("/api/graph_data")
def get_graph_data():
    conn = get_connection()
    voters = conn.execute("SELECT * FROM voters").fetchall()

    complaints_rows = []
    try:
        complaints_rows = conn.execute("SELECT * FROM complaints").fetchall()
    except Exception:
        pass
    conn.close()

    nodes = []
    links = []
    seen_ids = set()

    def add_node(node_id, group, label):
        if node_id not in seen_ids:
            seen_ids.add(node_id)
            nodes.append({"id": node_id, "group": group, "label": label})

    for v in voters:
        v = dict(v)
        add_node(v["epic_number"], "Voter", v["voter_name"])

        age_id = "Age_" + str(v["age"])
        add_node(age_id, "Age", "Age " + str(v["age"]))

        gender_id = "Gender_" + str(v["gender"])
        add_node(gender_id, "Gender", str(v["gender"]))

        house_id = "House_" + str(v["house_number"])
        add_node(house_id, "House", "House " + str(v["house_number"]))

        assembly_id = "Assembly_" + str(v["assembly_constituency"])
        add_node(assembly_id, "Assembly", str(v["assembly_constituency"]))

        section_id = "Section_" + str(v["section_name"])
        add_node(section_id, "Section", str(v["section_name"]))

        links.append({"source": v["epic_number"], "target": age_id})
        links.append({"source": v["epic_number"], "target": gender_id})
        links.append({"source": v["epic_number"], "target": house_id})
        links.append({"source": v["epic_number"], "target": assembly_id})
        links.append({"source": v["epic_number"], "target": section_id})

    voter_epics = set(dict(v)["epic_number"] for v in voters)

    for c in complaints_rows:
        c = dict(c)
        complaint_id = "Complaint_" + str(c["category"])
        add_node(complaint_id, "Complaint", str(c["category"]))
        if c["epic_number"] in voter_epics:
            links.append({"source": c["epic_number"], "target": complaint_id})

    return {"nodes": nodes, "links": links}


class LoginRequest(BaseModel):
    epic_number: str


@app.post("/api/citizen/verify")
def verify_citizen(req: LoginRequest):
    conn = get_connection()
    row = conn.execute(
        "SELECT voter_name FROM voters WHERE epic_number = ?", (req.epic_number,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Voter ID not found in the electoral roll.")
    return {"voter_name": row["voter_name"]}
