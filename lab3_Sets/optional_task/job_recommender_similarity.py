from typing import Set


class SimilarityMetrics:
    """Similarity metrics for comparing skill sets."""

    @staticmethod
    def jaccard_similarity(set_a: Set, set_b: Set) -> float:
        """Jaccard: intersection / union."""
        intersection = set_a & set_b
        union = set_a | set_b
        
        if len(union) == 0:
            return 0.0
        
        return len(intersection) / len(union)
    
    @staticmethod
    def sorensen_dice_coefficient(set_a: Set, set_b: Set) -> float:
        """Dice: 2 * intersection / (|A| + |B|)."""
        intersection = set_a & set_b
        total_size = len(set_a) + len(set_b)
        
        if total_size == 0:
            return 0.0
        
        return (2 * len(intersection)) / total_size
    
    @staticmethod
    def cosine_similarity(set_a: Set, set_b: Set) -> float:
        """Cosine: intersection / sqrt(|A| * |B|)."""
        if len(set_a) == 0 or len(set_b) == 0:
            return 0.0
        
        intersection = set_a & set_b
        denominator = (len(set_a) * len(set_b)) ** 0.5
        
        if denominator == 0:
            return 0.0
        
        return len(intersection) / denominator
    
    @staticmethod
    def calculate_all_similarities(set_a: Set, set_b: Set) -> dict:
        """Get all three metrics at once."""
        return {
            "jaccard": SimilarityMetrics.jaccard_similarity(set_a, set_b),
            "sorensen_dice": SimilarityMetrics.sorensen_dice_coefficient(set_a, set_b),
            "cosine": SimilarityMetrics.cosine_similarity(set_a, set_b),
            "intersection_size": len(set_a & set_b),
            "union_size": len(set_a | set_b),
        }


class SkillMatcher:
    """Match users with jobs by skill overlap."""

    @staticmethod
    def calculate_skill_match(user_skills: Set, job_skills: Set) -> dict:
        """Check how many required skills the user has."""
        matching = user_skills & job_skills
        missing = job_skills - user_skills
        
        if len(job_skills) == 0:
            match_percentage = 100.0
        else:
            match_percentage = (len(matching) / len(job_skills)) * 100
        
        # Categorize match quality
        if match_percentage >= 90:
            category = "Excellent"
        elif match_percentage >= 70:
            category = "Good"
        elif match_percentage >= 50:
            category = "Fair"
        else:
            category = "Poor"
        
        return {
            "matching_skills": matching,
            "missing_skills": missing,
            "match_percentage": round(match_percentage, 2),
            "match_category": category,
            "required_skills_count": len(job_skills),
            "matching_skills_count": len(matching),
            "missing_skills_count": len(missing),
        }
    
    @staticmethod
    def get_skill_gap(user_skills: Set, job_skills: Set) -> Set:
        """Return skills user is missing for the job."""
        return job_skills - user_skills
    
    @staticmethod
    def get_transferable_skills(user_skills: Set, job_skills: Set) -> Set:
        """Return skills that overlap between user and job."""
        return user_skills & job_skills


if __name__ == "__main__":
    alice_skills = {"Python", "JavaScript", "React", "Node.js"}
    bob_skills = {"Python", "React", "Vue"}

    print("Similarity metrics example")
    print(f"Alice skills: {alice_skills}")
    print(f"Bob skills: {bob_skills}")
    print()

    metrics = SimilarityMetrics.calculate_all_similarities(alice_skills, bob_skills)
    print(f"Jaccard Similarity: {metrics['jaccard']:.3f}")
    print(f"Sørensen-Dice: {metrics['sorensen_dice']:.3f}")
    print(f"Cosine Similarity: {metrics['cosine']:.3f}")
    print()

    print("Skill matching example")
    job_skills = {"Python", "React", "TypeScript", "CSS"}
    match = SkillMatcher.calculate_skill_match(alice_skills, job_skills)
    print(f"Job requires: {job_skills}")
    print(f"User has: {alice_skills}")
    print(f"Match: {match['match_percentage']}% ({match['match_category']})")
    print(f"Matching: {match['matching_skills']}")
    print(f"Missing: {match['missing_skills']}")
