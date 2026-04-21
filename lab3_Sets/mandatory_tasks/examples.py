"""Extra examples for the project."""

from core import Set, MultiSet, EmptySet
from operations import SetOperations, CardinalityOperations, InclusionExclusionPrinciple
from logic import LogicEvaluator, FormulaParser
from characteristic import CharacteristicFunction, CharacteristicFunctionOperations
import time


def print_example(title: str, number: int) -> None:
    """Print formatted example header."""
    header = f"Example {number}: {title}"
    print(f"\n{header}")
    print("-" * len(header))


def example_1_demorgan_laws():
    """Verify De Morgan's Laws with sets."""
    print_example("De Morgan's Laws", 1)
    
    print("De Morgan's Laws:")
    print("  1. ¬(A ∧ B) ≡ (¬A) ∨ (¬B)")
    print("  2. ¬(A ∨ B) ≡ (¬A) ∧ (¬B)")
    print()
    
    # Verify with sets
    u = Set(list(range(1, 11)))  # U = {1, 2, ..., 10}
    a = Set([1, 3, 5, 7, 9])  # odd numbers
    b = Set([2, 4, 6, 8, 10])  # even numbers
    
    print(f"Universe U: {u}")
    print(f"Set A (odd): {a}")
    print(f"Set B (even): {b}")
    print()
    
    # First law: ¬(A ∩ B) = ¬A ∪ ¬B
    a_and_b = SetOperations.intersection(a, b)
    not_a_and_b = SetOperations.absolute_complement(a_and_b, u)
    
    not_a = SetOperations.absolute_complement(a, u)
    not_b = SetOperations.absolute_complement(b, u)
    not_a_or_not_b = SetOperations.union(not_a, not_b)
    
    print("Law 1: ¬(A ∩ B) = ¬A ∪ ¬B")
    print(f"  ¬(A ∩ B) = {not_a_and_b}")
    print(f"  ¬A ∪ ¬B = {not_a_or_not_b}")
    print(f"  Equal? {not_a_and_b == not_a_or_not_b} ✓")
    print()
    
    # Second law: ¬(A ∪ B) = ¬A ∩ ¬B
    a_or_b = SetOperations.union(a, b)
    not_a_or_b = SetOperations.absolute_complement(a_or_b, u)
    
    not_a_and_not_b = SetOperations.intersection(not_a, not_b)
    
    print("Law 2: ¬(A ∪ B) = ¬A ∩ ¬B")
    print(f"  ¬(A ∪ B) = {not_a_or_b}")
    print(f"  ¬A ∩ ¬B = {not_a_and_not_b}")
    print(f"  Equal? {not_a_or_b == not_a_and_not_b} ✓")


def example_2_distributive_law():
    """Verify distributive law of set operations."""
    print_example("Distributive Law", 2)
    
    print("Distributive Law:")
    print("  A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C)")
    print()
    
    a = Set([1, 2, 3, 4])
    b = Set([3, 4, 5, 6])
    c = Set([4, 5, 6, 7])
    
    print(f"Set A: {a}")
    print(f"Set B: {b}")
    print(f"Set C: {c}")
    print()
    
    # Left side: A ∩ (B ∪ C)
    b_union_c = SetOperations.union(b, c)
    left = SetOperations.intersection(a, b_union_c)
    
    # Right side: (A ∩ B) ∪ (A ∩ C)
    a_inter_b = SetOperations.intersection(a, b)
    a_inter_c = SetOperations.intersection(a, c)
    right = SetOperations.union(a_inter_b, a_inter_c)
    
    print("Left side: A ∩ (B ∪ C)")
    print(f"  B ∪ C = {b_union_c}")
    print(f"  A ∩ (B ∪ C) = {left}")
    print()
    
    print("Right side: (A ∩ B) ∪ (A ∩ C)")
    print(f"  A ∩ B = {a_inter_b}")
    print(f"  A ∩ C = {a_inter_c}")
    print(f"  (A ∩ B) ∪ (A ∩ C) = {right}")
    print()
    
    print(f"Left = Right? {left == right} ✓")


def example_3_survey_analysis():
    """Real-world example: Analyze survey results using inclusion-exclusion."""
    print_example("Survey Analysis with Inclusion-Exclusion", 3)
    
    print("PROBLEM:")
    print("A survey of 100 students asks about programming languages.")
    print("  - 45 students know Python")
    print("  - 35 students know JavaScript")
    print("  - 20 students know both")
    print()
    
    python = Set(list(range(1, 46)))  # 45 total
    javascript = Set(list(range(26, 61)))  # 35 total
    # This gives overlap of range(26, 46) = 20 students
    
    both = SetOperations.intersection(python, javascript)
    
    print("Given data:")
    print(f"  |Python| = {len(python)}")
    print(f"  |JavaScript| = {len(javascript)}")
    print(f"  |Both| = {len(both)}")
    print()
    
    # Calculate using inclusion-exclusion
    answer = InclusionExclusionPrinciple.cardinality_of_union_two_sets(python, javascript)
    
    print("Using Inclusion-Exclusion Principle:")
    print(f"  |Python ∪ JavaScript| = |Python| + |JavaScript| - |Both|")
    print(f"  |Python ∪ JavaScript| = {len(python)} + {len(javascript)} - {len(both)}")
    print(f"  |Python ∪ JavaScript| = {answer}")
    print()
    
    # Calculate students knowing neither
    all_students = 100
    students_knowing_neither = all_students - answer
    
    print(f"Students knowing at least one language: {answer}")
    print(f"Students knowing neither: {students_knowing_neither}")
    print()
    
    # Only Python
    only_python = SetOperations.relative_complement(python, javascript)
    print(f"Students knowing only Python: {len(only_python)}")
    
    # Only JavaScript
    only_javascript = SetOperations.relative_complement(javascript, python)
    print(f"Students knowing only JavaScript: {len(only_javascript)}")


def example_4_digital_logic_circuit():
    """Design and verify logic circuit with truth table."""
    print_example("Digital Logic Circuit Design", 4)
    
    print("PROBLEM:")
    print("Design a 3-input logic circuit with requirements:")
    print("  - Output TRUE when at least 2 inputs are TRUE")
    print("  - (This is a majority function)")
    print()
    
    # Formula: (A ∧ B) ∨ (A ∧ C) ∨ (B ∧ C)
    formula = "(A ∧ B) ∨ (A ∧ C) ∨ (B ∧ C)"
    
    print(f"Circuit formula: {formula}")
    print()
    
    table = LogicEvaluator.generate_truth_table(formula)
    print("Truth Table:")
    print(table)
    print()
    
    # Count outputs
    true_outputs = sum(1 for _, result in table.rows if result)
    print(f"Outputs that are TRUE: {true_outputs}/8")
    print()
    
    # Verify: majority function should be true exactly when 2 or 3 inputs are true
    print("Verification:")
    for valuation, result in table.rows:
        true_count = sum(1 for v in [valuation['A'], valuation['B'], valuation['C']] if v)
        majority = true_count >= 2
        correct = result == majority
        status = "✓" if correct else "✗"
        print(f"  {valuation} → Output={result}, Majority={majority} {status}")


def example_5_characteristic_function_algebra():
    """Demonstrate algebraic properties of characteristic functions."""
    print_example("Characteristic Function Algebra", 5)
    
    print("Mathematical properties of characteristic functions:")
    print()
    
    u = Set(list(range(1, 11)))  # Universe {1, 2, ..., 10}
    a = Set([1, 2, 3, 4, 5])
    b = Set([4, 5, 6, 7, 8])
    
    chi_a = CharacteristicFunction(a, u)
    chi_b = CharacteristicFunction(b, u)
    
    print(f"Universe U: {u}")
    print(f"Set A: {a}")
    print(f"Set B: {b}")
    print()
    
    # Property 1: χ_(A∩B)(x) = min(χ_A(x), χ_B(x))
    print("Property 1: χ_(A∩B)(x) = min(χ_A(x), χ_B(x))")
    chi_inter = CharacteristicFunctionOperations.intersection_function(chi_a, chi_b)
    
    print("  Element | χ_A | χ_B | min(χ_A,χ_B) | Result | Match?")
    print("  " + "-" * 60)
    for elem in [3, 4, 5, 6]:
        chi_a_val = chi_a(elem)
        chi_b_val = chi_b(elem)
        min_val = min(chi_a_val, chi_b_val)
        result_val = chi_inter(elem)
        match = "✓" if min_val == result_val else "✗"
        print(f"    {elem}     |  {chi_a_val}  |  {chi_b_val}  |      {min_val}       |  {result_val}     | {match}")
    print()
    
    # Property 2: χ_(A∪B)(x) = max(χ_A(x), χ_B(x))
    print("Property 2: χ_(A∪B)(x) = max(χ_A(x), χ_B(x))")
    chi_union = CharacteristicFunctionOperations.union_function(chi_a, chi_b)
    
    print("  Element | χ_A | χ_B | max(χ_A,χ_B) | Result | Match?")
    print("  " + "-" * 60)
    for elem in [3, 4, 5, 6]:
        chi_a_val = chi_a(elem)
        chi_b_val = chi_b(elem)
        max_val = max(chi_a_val, chi_b_val)
        result_val = chi_union(elem)
        match = "✓" if max_val == result_val else "✗"
        print(f"    {elem}     |  {chi_a_val}  |  {chi_b_val}  |      {max_val}       |  {result_val}     | {match}")
    print()
    
    # Property 3: Cardinality from characteristic function
    print("Property 3: |A| = Σ χ_A(x) for all x ∈ U")
    card_from_chi = CharacteristicFunctionOperations.compute_cardinality_from_function(chi_a)
    actual_card = len(a)
    print(f"  Cardinality from function: {card_from_chi}")
    print(f"  Actual cardinality: {actual_card}")
    print(f"  Match? {card_from_chi == actual_card} ✓")


def example_6_multiset_operations():
    """Advanced multiset operations."""
    print_example("Multiset Operations", 6)
    
    print("Multisets allow elements to appear multiple times.")
    print()
    
    # Create multisets representing colored balls
    bag1 = MultiSet(['red', 'red', 'blue', 'green', 'green', 'green'])
    bag2 = MultiSet(['red', 'blue', 'blue', 'yellow'])
    
    print(f"Bag 1: {bag1}")
    print(f"Bag 2: {bag2}")
    print()
    
    print("Element multiplicities:")
    unique_all = Set(bag1.to_list() + bag2.to_list()).to_list()
    for color in sorted(unique_all):
        mult1 = bag1.multiplicity(color)
        mult2 = bag2.multiplicity(color)
        print(f"  {color:8}: {mult1} in bag1, {mult2} in bag2")
    print()
    
    # Real-world application
    print("Application: Merging inventory from two warehouses")
    total_items = len(bag1) + len(bag2)
    print(f"Total items: {total_items}")


def example_7_power_set_subsets():
    """Analyze power sets and subsets."""
    print_example("Power Set Analysis", 7)
    
    a = Set(['A', 'B', 'C'])
    ps = SetOperations.power_set(a)
    
    print(f"Set A: {a}")
    print(f"|A| = {len(a)}")
    print()
    
    print(f"Power set 𝒫(A) has 2^|A| = 2^{len(a)} = {len(ps)} subsets")
    print()
    
    print("Subsets organized by size:")
    for k in range(len(a) + 1):
        subsets_k = ps.get_subsets_of_size(k)
        count = len(subsets_k)
        
        # Binomial coefficient C(n,k) = n!/(k!(n-k)!)
        import math
        binomial = math.comb(len(a), k)
        
        print(f"  Size {k}: {count} subsets (C({len(a)},{k}) = {binomial}) ✓")
        for subset in subsets_k:
            print(f"    - {subset}")


def example_8_cartesian_product_relations():
    """Use Cartesian products to define relations."""
    print_example("Cartesian Products and Relations", 8)
    
    print("Cartesian products define relations between sets.")
    print()
    
    # Example 1: Coordinate system
    print("Example 1: 2D Coordinates")
    x_coords = Set(['0', '1', '2'])
    y_coords = Set(['0', '1', '2'])
    
    grid = SetOperations.cartesian_product(x_coords, y_coords)
    
    print(f"X-coordinates: {x_coords}")
    print(f"Y-coordinates: {y_coords}")
    print(f"Grid (X × Y) has {len(grid)} points:")
    
    for i, (x, y) in enumerate(grid, 1):
        if i <= 5:  # Show first 5
            print(f"  ({x}, {y})", end="")
            if i < 5:
                print(", ", end="")
    print(f", ... ({grid[-1][0]}, {grid[-1][1]})")
    print()
    
    # Example 2: Product combinations
    print("Example 2: Menu Combinations")
    entrees = Set(['Burger', 'Salad', 'Pasta'])
    drinks = Set(['Water', 'Soda', 'Coffee'])
    
    menu = SetOperations.cartesian_product(entrees, drinks)
    
    print(f"Entrees: {entrees}")
    print(f"Drinks: {drinks}")
    print(f"Unique combinations: {len(menu)}")
    print()
    
    print("Sample meals:")
    for i, (entree, drink) in enumerate(menu[:5], 1):
        print(f"  {i}. {entree} with {drink}")
    if len(menu) > 5:
        print(f"  ... and {len(menu) - 5} more")


def run_all_examples():
    """Run all advanced examples."""
    
    try:
        example_1_demorgan_laws()
        example_2_distributive_law()
        example_3_survey_analysis()
        example_4_digital_logic_circuit()
        example_5_characteristic_function_algebra()
        example_6_multiset_operations()
        example_7_power_set_subsets()
        example_8_cartesian_product_relations()
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    run_all_examples()
