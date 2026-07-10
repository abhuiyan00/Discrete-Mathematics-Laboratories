import sys
# Windows consoles default to cp1252; force UTF-8 so the ✓/✗/★ output can't crash.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from job_recommender_data import load_users, load_jobs, print_users, print_jobs
from job_recommender_similarity import SimilarityMetrics, SkillMatcher
from job_recommender_engine import RecommendationEngine


def print_section(title: str) -> None:
    print(f"\n{title}")
    print()


def demo_similarity_metrics() -> None:
    print_section("Demo 1: Similarity metrics")

    users = load_users()
    alice = users["alice"]
    bob = users["bob"]
    charlie = users["charlie"]
    
    print(f"Alice Skills: {sorted(alice.skills)}")
    print(f"Bob Skills: {sorted(bob.skills)}")
    print(f"Charlie Skills: {sorted(charlie.skills)}")
    print()
    
    print("Alice vs Bob:")
    metrics = SimilarityMetrics.calculate_all_similarities(alice.skills, bob.skills)
    print(f"  Jaccard Similarity: {metrics['jaccard']:.3f} ({metrics['jaccard']*100:.1f}%)")
    print(f"  Sørensen-Dice: {metrics['sorensen_dice']:.3f} ({metrics['sorensen_dice']*100:.1f}%)")
    print(f"  Cosine Similarity: {metrics['cosine']:.3f} ({metrics['cosine']*100:.1f}%)")
    print(f"  Intersection: {alice.skills & bob.skills}")
    print()
    
    print("Alice vs Charlie:")
    metrics = SimilarityMetrics.calculate_all_similarities(alice.skills, charlie.skills)
    print(f"  Jaccard Similarity: {metrics['jaccard']:.3f} ({metrics['jaccard']*100:.1f}%)")
    print(f"  Sørensen-Dice: {metrics['sorensen_dice']:.3f} ({metrics['sorensen_dice']*100:.1f}%)")
    print(f"  Cosine Similarity: {metrics['cosine']:.3f} ({metrics['cosine']*100:.1f}%)")
    print(f"  Intersection: {alice.skills & charlie.skills}")


def demo_skill_matching() -> None:
    print_section("Demo 2: Skill matching with jobs")

    users = load_users()
    jobs = load_jobs()
    alice = users["alice"]
    
    print(f"Alice Skills: {sorted(alice.skills)}\n")
    
    test_jobs = ["senior_frontend", "full_stack", "ml_engineer"]
    
    for job_id in test_jobs:
        job = jobs[job_id]
        match = SkillMatcher.calculate_skill_match(alice.skills, job.required_skills)
        
        print(f"{job.title}:")
        print(f"  Required: {sorted(job.required_skills)}")
        print(f"  Matching: {sorted(match['matching_skills'])}")
        print(f"  Missing: {sorted(match['missing_skills'])}")
        print(f"  Match: {match['match_percentage']}% ({match['match_category']})")
        print()


def demo_find_similar_users() -> None:
    print_section("Demo 3: Finding similar users")

    users = load_users()
    jobs = load_jobs()
    engine = RecommendationEngine(users, jobs)
    
    alice = users["alice"]
    print(f"Finding users similar to {alice.name}")
    print(f"Skills: {sorted(alice.skills)}\n")
    
    similar_users = engine.find_similar_users(alice, similarity_threshold=0.3)
    
    print(f"Found {len(similar_users)} similar user(s):\n")
    
    for i, (user, similarity) in enumerate(similar_users, 1):
        common = alice.skills & user.skills
        print(f"{i}. {user.name}")
        print(f"   Skills: {sorted(user.skills)}")
        print(f"   Jaccard Similarity: {similarity:.3f} ({similarity*100:.1f}%)")
        print(f"   Common Skills: {sorted(common)}")
        print(f"   Jobs They Got: {user.jobs_applied}")
        print()


def demo_job_recommendations() -> None:
    print_section("Demo 4: Job recommendations")

    users = load_users()
    jobs = load_jobs()
    engine = RecommendationEngine(users, jobs)
    
    test_users = ["alice", "bob", "george"]
    
    for user_id in test_users:
        print(f"\nRecommendations for {users[user_id].name}")
        
        result = engine.get_recommendations(user_id, similarity_threshold=0.2, top_n=5)
        
        print(f"Skills: {sorted(result['target_user'].skills)}")
        print(f"Similar Users Found: {len(result['similar_users'])}\n")
        
        if not result["recommendations"]:
            print("No recommendations found.")
            continue
        
        print("Top job recommendations:")
        print()
        
        for i, rec in enumerate(result["recommendations"], 1):
            print(f"{i}. {rec['job_title']}")
            print(f"   Company: {rec['company']}")
            print(f"   Salary: ${rec['salary']:,}")
            print(f"   Recommendation Score: {rec['recommendation_score']:.1f}/100")
            print(f"   Skill Match: {rec['match_percentage']}% ({rec['match_category']})")
            print(f"   Matching: {sorted(rec['matching_skills'])}")
            if rec['missing_skills']:
                print(f"   Missing: {sorted(rec['missing_skills'])}")
            print(f"   {rec['similar_users_count']} similar user(s) got this: {rec['users_who_got_it']}")
            print()


def demo_metric_comparison() -> None:
    print_section("Demo 5: Metric comparison")

    users = load_users()
    jobs = load_jobs()
    alice = users["alice"]
    
    print(f"User: {alice.name}")
    print(f"Skills: {sorted(alice.skills)}\n")
    
    for metric in ["jaccard", "sorensen_dice", "cosine"]:
        print(f"Using {metric.replace('_', '-')} similarity:")
        
        engine = RecommendationEngine(users, jobs)
        engine.set_similarity_metric(metric)
        
        similar_users = engine.find_similar_users(alice, similarity_threshold=0.2)
        
        print(f"Found {len(similar_users)} similar users:\n")
        for user, score in similar_users:
            print(f"  {user.name}: {score:.3f} ({score*100:.1f}%)")
        print()


def main() -> None:
    print("\nJob recommendation system demo\n")
    demo_similarity_metrics()
    demo_skill_matching()
    demo_find_similar_users()
    demo_job_recommendations()
    demo_metric_comparison()

    print("\nDemonstration complete.\n")


if __name__ == "__main__":
    main()
