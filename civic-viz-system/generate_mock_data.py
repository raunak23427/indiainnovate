import json
import random
import pandas as pd
from datetime import datetime, timedelta

def main():
    # 1. SETUP
    num_users = 300
    num_complaints = 1000
    
    booths = [201, 202, 203, 204, 205, 206]
    areas = ["Dwarka", "Rohini", "Saket", "Laxmi Nagar", "Janakpuri", "Pitampura"]
    booth_area_map = {b: a for b, a in zip(booths, areas)}
    
    first_names = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
                   "Shaurya", "Atharv", "Aaryan", "Dhruv", "Kabir", "Ritvik", "Karthik", "Abhinav", "Ishan", "Aryan",
                   "Diya", "Aadhya", "Ananya", "Sara", "Myra", "Kiara", "Kriti", "Aaliyah", "Aditi", "Pari",
                   "Jiya", "Sneha", "Kavya", "Saanvi", "Riya", "Nisha", "Alia", "Neha", "Ishita", "Anjali"]
                   
    last_names = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Kumar", "Patel", "Reddy", "Mehta", "Chawla",
                  "Yadav", "Jain", "Bansal", "Arora", "Kapoor", "Chopra", "Das", "Bose", "Sengupta", "Banerjee",
                  "Nair", "Pillai", "Iyer", "Gowda", "Desai", "Joshi", "Kulkarni", "Awasti", "Mishra", "Pandey"]
                  
    categories = [
        "Water Supply", "Electricity", "Road Damage", "Sanitation", "Garbage Collection", 
        "Drainage", "Street Lights", "Public Safety", "Infrastructure", "Corruption"
    ]
    
    # 2. GENERATE USERS
    users = []
    users_by_booth = {b: [] for b in booths}
    
    for i in range(1, num_users + 1):
        voter_id = f"VID{i:05d}"
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        
        # Evenly distribute booths (50 per booth)
        booth_idx = (i - 1) // 50
        booth_id = booths[booth_idx]
        area = booth_area_map[booth_id]
        
        user = {
            "voter_id": voter_id,
            "name": name,
            "booth_id": booth_id,
            "area": area
        }
        users.append(user)
        users_by_booth[booth_id].append(user)
        
    # 3. GENERATE COMPLAINTS
    complaints = []
    
    # Weights for booth distribution (203 & 205 high, 201 low, rest normal)
    # Target: 1000 complaints. Low=50, Normal=100 each, High=325 each. 
    # Total: 50 + 100(202) + 325(203) + 100(204) + 325(205) + 100(206) = 1000
    booth_weights = {
        201: 50,
        202: 100,
        203: 325,
        204: 100,
        205: 325,
        206: 100
    }
    
    # Weights for categories
    # Highest: Water Supply, Road Damage
    # Medium: Electricity, Garbage Collection
    # Low: Others
    cat_weights = {
        "Water Supply": 25,
        "Road Damage": 25,
        "Electricity": 15,
        "Garbage Collection": 10,
        "Sanitation": 5,
        "Drainage": 5,
        "Street Lights": 5,
        "Public Safety": 5,
        "Infrastructure": 3,
        "Corruption": 2
    }
    
    # Normalize category weights into list for random.choices
    cat_list = list(cat_weights.keys())
    cat_probs = list(cat_weights.values())
    
    # Status distribution
    status_choices = ["Pending", "In Progress", "Resolved"]
    status_weights = [50, 30, 20]
    
    # Descriptions mapping for realism
    desc_map = {
        "Water Supply": ["No water supply for 3 days", "Contaminated water coming from taps", "Low water pressure in the morning", "Pipe burst near the main road leading to water logging"],
        "Electricity": ["Frequent power cuts during the night", "Voltage fluctuations damaging appliances", "Transform spark leaving locality without power", "Street transformer making loud noises"],
        "Road Damage": ["Huge pothole causing accidents", "Road completely washed away after rain", "Gravel loose on the newly constructed road", "Open manhole in the middle of the street"],
        "Sanitation": ["Public toilet in unhygienic condition", "Sewage flowing on the streets", "No sweeping done in the sector for a week", "Dead animal lying on the road"],
        "Garbage Collection": ["Garbage truck hasn't visited for 4 days", "Overflowing community dustbin", "People burning garbage in the open park", "Garbage dumped near school wall"],
        "Drainage": ["Blocked drains causing severe foul smell", "Storm water drain mixed with sewage", "Drain overflowing into residential area", "Mosquito breeding in stagnant drain water"],
        "Street Lights": ["Main street completely dark at night", "Flickering street light causing nuisance", "Pole fallen down after recent storm", "Street light wires hanging dangerously low"],
        "Public Safety": ["No police patrolling at night", "Anti-social elements gathering in the park", "Chain snatching incident reported recently", "Stray dog menace in the colony"],
        "Infrastructure": ["Bus stop shed completely broken", "Park benches are damaged and unusable", "Boundary wall of community center collapsed", "No signboards for major streets"],
        "Corruption": ["Demand for bribe for issuing certificates", "Contractor used poor quality materials for road", "Illegal construction ignoring building bylaws", "Ration shop owner overcharging"]
    }
    
    now = datetime.now()
    
    # Generate common cluster events to simulate realism
    # For hot booths, we'll create specific "events" that many people complain about.
    cluster_events = {
        203: [{"category": "Road Damage", "desc": "Huge crater on the Saket main road causing severe traffic jams", "date_offset": 2},
              {"category": "Water Supply", "desc": "Pipeline burst leading to zero water supply in Block B", "date_offset": 4}],
        205: [{"category": "Water Supply", "desc": "Contaminated brownish water supplied in Janakpuri East", "date_offset": 1},
              {"category": "Garbage Collection", "desc": "Sanitation workers on strike, garbage piling up near Metro pillar", "date_offset": 3}]
    }

    complaint_count = 0
    
    for booth_id, count in booth_weights.items():
        booth_users = users_by_booth[booth_id]
        
        for _ in range(count):
            complaint_count += 1
            c_id = f"CMP{complaint_count:05d}"
            
            user = random.choice(booth_users)
            
            # Determine if this is a cluster event complaint (40% chance for hot booths)
            is_cluster = (booth_id in cluster_events) and (random.random() < 0.4)
            
            if is_cluster:
                event = random.choice(cluster_events[booth_id])
                cat = event["category"]
                desc = event["desc"]
                # Spike date - within the last 5 days
                days_ago = event["date_offset"] + random.uniform(0, 1)
            else:
                cat = random.choices(cat_list, weights=cat_probs, k=1)[0]
                desc = random.choice(desc_map[cat])
                
                # Timestamp logic: recent spikes (30% chance within last 5 days, 70% chance 5-30 days ago)
                if random.random() < 0.3:
                    days_ago = random.uniform(0, 5)
                else:
                    days_ago = random.uniform(5, 30)
                    
            status = random.choices(status_choices, weights=status_weights, k=1)[0]
            timestamp = now - timedelta(days=days_ago)
            
            # Formatting Date
            timestamp_str = timestamp.strftime("%Y-%m-%d %H:%M:%S")
            
            complaint = {
                "complaint_id": c_id,
                "voter_id": user["voter_id"],
                "booth_id": user["booth_id"],
                "area": user["area"],
                "category": cat,
                "description": desc,
                "status": status,
                "timestamp": timestamp_str
            }
            complaints.append(complaint)

    # 4. EXPORT TO JSON & EXCEL
    
    # JSONs
    with open("mock_users.json", "w") as f:
        json.dump(users, f, indent=4)
        
    with open("mock_complaints.json", "w") as f:
        json.dump(complaints, f, indent=4)
        
    # EXCELs
    df_users = pd.DataFrame(users)
    df_users.to_excel("mock_users.xlsx", index=False)
    
    df_complaints = pd.DataFrame(complaints)
    df_complaints.to_excel("mock_complaints.xlsx", index=False)
    
    print(f"✅ Generated {len(users)} users and {len(complaints)} complaints successfully!")
    print("Files created: mock_users.json, mock_complaints.json, mock_users.xlsx, mock_complaints.xlsx")

if __name__ == "__main__":
    main()
