from typing import Dict, List, Set


class User:
    """Job seeker profile with skills and work history."""

    def __init__(self, user_id: str, name: str, skills: List[str],
                 experience_years: int, jobs_applied: List[str] = None):
        self.user_id = user_id
        self.name = name
        self.skills = set(skills)
        self.experience_years = experience_years
        self.jobs_applied = jobs_applied or []
    
    def __repr__(self):
        return f"User({self.name}, skills={self.skills})"

    def __str__(self):
        skills_str = ", ".join(sorted(self.skills))
        return f"{self.name} - Skills: {{{skills_str}}}"


class Job:
    """Job posting with required skill set."""

    def __init__(self, job_id: str, title: str, company: str,
                 required_skills: List[str], salary: int, description: str = ""):
        self.job_id = job_id
        self.title = title
        self.company = company
        self.required_skills = set(required_skills)
        self.salary = salary
        self.description = description
    
    def __repr__(self):
        return f"Job({self.title}, skills={self.required_skills})"

    def __str__(self):
        skills_str = ", ".join(sorted(self.required_skills))
        return f"{self.title} at {self.company} - Skills: {{{skills_str}}}"


def load_users() -> Dict[str, User]:
    users = {
        "alice": User(
            user_id="alice",
            name="Alice Johnson",
            skills=["Python", "JavaScript", "React", "Node.js", "PostgreSQL"],
            experience_years=5,
            jobs_applied=["senior_frontend", "full_stack"]
        ),
        "bob": User(
            user_id="bob",
            name="Bob Smith",
            skills=["Python", "React", "Vue", "CSS", "HTML"],
            experience_years=3,
            jobs_applied=["junior_frontend", "full_stack"]
        ),
        "charlie": User(
            user_id="charlie",
            name="Charlie Brown",
            skills=["Java", "Spring", "MySQL", "Docker"],
            experience_years=4,
            jobs_applied=["backend_engineer", "devops"]
        ),
        "diana": User(
            user_id="diana",
            name="Diana Prince",
            skills=["Python", "JavaScript", "React", "Node.js"],
            experience_years=6,
            jobs_applied=["senior_frontend", "full_stack", "tech_lead"]
        ),
        "evan": User(
            user_id="evan",
            name="Evan Wilson",
            skills=["Python", "Django", "PostgreSQL", "Docker"],
            experience_years=4,
            jobs_applied=["backend_engineer", "full_stack"]
        ),
        "fiona": User(
            user_id="fiona",
            name="Fiona Garcia",
            skills=["JavaScript", "TypeScript", "React", "Vue", "Angular"],
            experience_years=5,
            jobs_applied=["senior_frontend"]
        ),
        "george": User(
            user_id="george",
            name="George Miller",
            skills=["Python", "Machine Learning", "TensorFlow", "Data Science"],
            experience_years=3,
            jobs_applied=["ml_engineer"]
        ),
    }
    return users


def load_jobs() -> Dict[str, Job]:
    jobs = {
        "senior_frontend": Job(
            job_id="senior_frontend",
            title="Senior Frontend Developer",
            company="TechCorp",
            required_skills=["JavaScript", "React", "TypeScript", "CSS"],
            salary=120000,
            description="Build cutting-edge web applications"
        ),
        "full_stack": Job(
            job_id="full_stack",
            title="Full Stack Engineer",
            company="WebDev Inc",
            required_skills=["Python", "JavaScript", "React", "Node.js", "PostgreSQL"],
            salary=130000,
            description="Work on both frontend and backend systems"
        ),
        "junior_frontend": Job(
            job_id="junior_frontend",
            title="Junior Frontend Developer",
            company="StartupXYZ",
            required_skills=["JavaScript", "React", "CSS"],
            salary=70000,
            description="Develop responsive web interfaces"
        ),
        "backend_engineer": Job(
            job_id="backend_engineer",
            title="Backend Engineer",
            company="CloudServices Ltd",
            required_skills=["Python", "PostgreSQL", "Docker", "REST APIs"],
            salary=125000,
            description="Build scalable backend systems"
        ),
        "ml_engineer": Job(
            job_id="ml_engineer",
            title="Machine Learning Engineer",
            company="DataAI Corp",
            required_skills=["Python", "Machine Learning", "TensorFlow", "Data Analysis"],
            salary=140000,
            description="Develop and deploy machine learning models"
        ),
        "devops": Job(
            job_id="devops",
            title="DevOps Engineer",
            company="InfraCorp",
            required_skills=["Docker", "Kubernetes", "AWS", "Python"],
            salary=135000,
            description="Manage infrastructure and deployment"
        ),
        "tech_lead": Job(
            job_id="tech_lead",
            title="Technical Lead",
            company="MegaTech",
            required_skills=["JavaScript", "Python", "React", "Node.js", "Architecture"],
            salary=150000,
            description="Lead technical teams and design systems"
        ),
    }
    return jobs


def print_users(users: Dict[str, User]) -> None:
    print("\nUsers in the system")
    for user_id, user in users.items():
        print(f"\n{user.name} (ID: {user_id})")
        print(f"  Experience: {user.experience_years} years")
        print(f"  Skills: {', '.join(sorted(user.skills))}")
        print(f"  Jobs Applied: {', '.join(user.jobs_applied) if user.jobs_applied else 'None'}")


def print_jobs(jobs: Dict[str, Job]) -> None:
    print("\nJobs in the system")
    for job_id, job in jobs.items():
        print(f"\n{job.title}")
        print(f"  Company: {job.company}")
        print(f"  Salary: ${job.salary:,}")
        print(f"  Required Skills: {', '.join(sorted(job.required_skills))}")


if __name__ == "__main__":
    users = load_users()
    jobs = load_jobs()

    print_users(users)
    print_jobs(jobs)
