from typing import Dict, List, Tuple
from job_recommender_data import User, Job
from job_recommender_similarity import SimilarityMetrics, SkillMatcher


class RecommendationEngine:
    """Find similar users and recommend jobs based on their success."""

    def __init__(self, users: Dict[str, User], jobs: Dict[str, Job]):
        self.users = users
        self.jobs = jobs
        self.similarity_metric = "jaccard"
    
    def set_similarity_metric(self, metric: str) -> None:
        """Change which metric to use for similarity."""
        if metric not in ["jaccard", "sorensen_dice", "cosine"]:
            raise ValueError(f"Unknown metric: {metric}")
        self.similarity_metric = metric
    
    def calculate_similarity(self, skills_a: set, skills_b: set) -> float:
        """Calculate similarity with current metric."""
        if self.similarity_metric == "jaccard":
            return SimilarityMetrics.jaccard_similarity(skills_a, skills_b)
        elif self.similarity_metric == "sorensen_dice":
            return SimilarityMetrics.sorensen_dice_coefficient(skills_a, skills_b)
        else:  # cosine
            return SimilarityMetrics.cosine_similarity(skills_a, skills_b)
    
    def find_similar_users(self, target_user: User,
                            similarity_threshold: float = 0.3) -> List[Tuple[User, float]]:
        """Find users with similar skill sets."""
        similar_users = []

        for user_id, user in self.users.items():
            if user.user_id == target_user.user_id:
                continue

            similarity = self.calculate_similarity(
                target_user.skills,
                user.skills
            )

            if similarity >= similarity_threshold:
                similar_users.append((user, similarity))

        return sorted(similar_users, key=lambda x: x[1], reverse=True)
    
    def get_recommended_jobs_from_similar_users(
        self,
        target_user: User,
        similar_users: List[Tuple[User, float]]
    ) -> Dict[str, dict]:
        """Collect all jobs that similar users have applied for."""
        recommended_jobs = {}
        
        for similar_user, similarity_score in similar_users:
            for job_id in similar_user.jobs_applied:
                if job_id not in recommended_jobs:
                    recommended_jobs[job_id] = {
                        "job_id": job_id,
                        "similar_users": [],
                        "similarity_scores": [],
                        "count": 0
                    }
                
                recommended_jobs[job_id]["similar_users"].append(similar_user.name)
                recommended_jobs[job_id]["similarity_scores"].append(similarity_score)
                recommended_jobs[job_id]["count"] += 1
        
        # Calculate average similarity for each job
        for job_id, job_info in recommended_jobs.items():
            avg_similarity = sum(job_info["similarity_scores"]) / len(job_info["similarity_scores"])
            job_info["avg_similarity"] = round(avg_similarity, 3)
        
        return recommended_jobs
    
    def rank_job_recommendations(
        self,
        target_user: User,
        recommended_jobs: Dict[str, dict],
        top_n: int = 5
    ) -> List[dict]:
        """Rank recommendations by skill match and user similarity."""
        ranked_recommendations = []
        
        for job_id, job_info in recommended_jobs.items():
            job = self.jobs[job_id]
            
            # Calculate skill match
            match_info = SkillMatcher.calculate_skill_match(
                target_user.skills,
                job.required_skills
            )
            
            # Create recommendation
            recommendation = {
                "job_id": job_id,
                "job_title": job.title,
                "company": job.company,
                "salary": job.salary,
                "match_percentage": match_info["match_percentage"],
                "match_category": match_info["match_category"],
                "matching_skills": match_info["matching_skills"],
                "missing_skills": match_info["missing_skills"],
                "similar_users_count": job_info["count"],
                "users_who_got_it": job_info["similar_users"],
                "avg_user_similarity": job_info["avg_similarity"],
                "recommendation_score": self._calculate_recommendation_score(
                    match_info["match_percentage"],
                    job_info["avg_similarity"],
                    job_info["count"]
                )
            }
            
            ranked_recommendations.append(recommendation)
        
        # Sort by recommendation score (highest first)
        ranked_recommendations.sort(
            key=lambda x: x["recommendation_score"],
            reverse=True
        )
        
        return ranked_recommendations[:top_n]
    
    @staticmethod
    def _calculate_recommendation_score(
        match_percentage: float,
        avg_user_similarity: float,
        num_similar_users: int
    ) -> float:
        """Score combines skill match (60%), user similarity (30%), count (10%)."""
        match_score = match_percentage / 100.0
        user_count_score = min(num_similar_users, 5) / 5.0
        recommendation_score = (
            (match_score * 0.60) +
            (avg_user_similarity * 0.30) +
            (user_count_score * 0.10)
        ) * 100
        
        return round(recommendation_score, 2)
    
    def get_recommendations(
        self,
        target_user_id: str,
        similarity_threshold: float = 0.3,
        top_n: int = 5
    ) -> dict:
        """Main entry point - get job recommendations for a user."""
        if target_user_id not in self.users:
            raise ValueError(f"User {target_user_id} not found")

        target_user = self.users[target_user_id]
        similar_users = self.find_similar_users(target_user, similarity_threshold)

        if not similar_users:
            return {
                "target_user": target_user,
                "similar_users": [],
                "recommendations": [],
                "message": "No similar users found"
            }

        recommended_jobs = self.get_recommended_jobs_from_similar_users(
            target_user,
            similar_users
        )
        ranked_recommendations = self.rank_job_recommendations(
            target_user,
            recommended_jobs,
            top_n
        )
        
        return {
            "target_user": target_user,
            "similar_users": similar_users,
            "recommendations": ranked_recommendations
        }


if __name__ == "__main__":
    from job_recommender_data import load_users, load_jobs

    users = load_users()
    jobs = load_jobs()
    engine = RecommendationEngine(users, jobs)

    result = engine.get_recommendations("diana", similarity_threshold=0.3, top_n=5)
 
    print(f"Getting recommendations for {result['target_user'].name}...")
    print(f"Target User: {result['target_user'].name}")
    print(f"Similar Users Found: {len(result['similar_users'])}\n")

    print("Top recommendations:")
    for i, rec in enumerate(result["recommendations"], 1):
        print(f"\n{i}. {rec['job_title']} at {rec['company']}")
        print(f"   Salary: ${rec['salary']:,}")
        print(f"   Recommendation Score: {rec['recommendation_score']:.1f}/100")
        print(f"   Skill Match: {rec['match_percentage']}% ({rec['match_category']})")
        print(f"   Matching Skills: {', '.join(sorted(rec['matching_skills']))}")
        if rec['missing_skills']:
            print(f"   Missing Skills: {', '.join(sorted(rec['missing_skills']))}")
        print(f"   {rec['similar_users_count']} similar user(s) got this job")
