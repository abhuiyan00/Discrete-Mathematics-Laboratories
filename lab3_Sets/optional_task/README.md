# Job Recommendation System

## Overview
This project implements a job recommendation engine using set-based similarity methods.
It compares user skill profiles, finds similar users, and recommends jobs that those users successfully applied for.

The system includes:
- User and job data models
- Similarity metrics (Jaccard, Sorensen-Dice, Cosine)
- Skill match analysis (matching and missing skills)
- Recommendation scoring and ranking
- A full demonstration script

## Project Structure
- `job_recommender_data.py`: Data models, sample users/jobs, and print helpers.
- `job_recommender_similarity.py`: Similarity metrics and skill matching utilities.
- `job_recommender_engine.py`: Recommendation engine logic.
- `job_recommender_demo.py`: End-to-end demonstration of all features.

## How the Recommendation Flow Works
1. Load user and job datasets.
2. Pick a target user.
3. Find similar users based on skill overlap.
4. Collect jobs from those similar users.
5. Calculate skill match for each candidate job.
6. Compute recommendation score and rank results.

## Similarity Metrics Used
- Jaccard similarity: intersection over union of skill sets.
- Sorensen-Dice coefficient: weighted overlap, often higher than Jaccard.
- Cosine similarity for set overlap magnitude.

You can switch metric in the engine:

```python
engine.set_similarity_metric("jaccard")
engine.set_similarity_metric("sorensen_dice")
engine.set_similarity_metric("cosine")
```

## Requirements
- Windows CMD (Command Prompt) / terminal from IDE
- Python 3.9+ (recommended)

No third-party packages are required.

## Step-by-Step Guide: Run and Test from terminal

### 1) Open CMD / terminal  and move to project folder
Use Command Prompt and run:

```cmd
cd /d "project/folder"
```

### 2) Check Python installation
Run one of these commands:

```cmd
python --version
```

If `python` is not recognized, try:

```cmd
py --version
```

### 3) (Optional but recommended) Create and activate a virtual environment
Create venv:

```cmd
python -m venv .venv
```

Activate venv:

```cmd
.venv\Scripts\activate
```

If you use `py`, then create venv with:

```cmd
py -m venv .venv
```

### 4) Sanity test each module
Run these commands one by one:

```cmd
python job_recommender_data.py
python job_recommender_similarity.py
python job_recommender_engine.py
```

Expected behavior:
- `job_recommender_data.py` prints all sample users and jobs.
- `job_recommender_similarity.py` prints similarity examples and skill match output.
- `job_recommender_engine.py` prints ranked recommendations for a sample user.

### 5) Run the full demonstration

```cmd
python job_recommender_demo.py
```

This executes all demos:
- Similarity metrics comparison
- Skill matching
- Similar user discovery
- Full recommendations for multiple users
- Metric comparison mode

### 6) If your system uses `py` instead of `python`
Use equivalent commands:

```cmd
py job_recommender_data.py
py job_recommender_similarity.py
py job_recommender_engine.py
py job_recommender_demo.py
```

### 7) Quick troubleshooting
- `ModuleNotFoundError`: Ensure CMD is opened in this project directory.
- `python is not recognized`: Use `py` or install Python and add it to PATH.
- Virtual environment not activating: Run CMD as normal user and verify `.venv\Scripts\activate` exists.

## Minimal Usage Example

```python
from job_recommender_data import load_users, load_jobs
from job_recommender_engine import RecommendationEngine

users = load_users()
jobs = load_jobs()

engine = RecommendationEngine(users, jobs)
result = engine.get_recommendations("alice", similarity_threshold=0.3, top_n=5)

for rec in result["recommendations"]:
    print(f"{rec['job_title']} -> {rec['match_percentage']}% match, score {rec['recommendation_score']}")
```

## Notes
- Recommendation score combines job skill match, average similarity of users who got the job, and number of similar users.
- Sample data includes 7 users and 7 jobs, making it easy to inspect and extend.
