"""Main demo script."""

import sys
# Windows consoles default to cp1252, which can't encode the set-theory glyphs
# (∈, ∉, ✓, ✗, …) this demo prints. Force UTF-8 so it runs everywhere.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from core import Set, MultiSet, EmptySet
from operations import (
    SetOperations, PowerSet, CardinalityOperations,
    InclusionExclusionPrinciple
)
from logic import LogicEvaluator, FormulaParser
from characteristic import (
    CharacteristicFunction, CharacteristicFunctionTable,
    CharacteristicFunctionOperations
)


def print_section(title: str) -> None:
    """Print a formatted section header."""
    print(f"\n{title}")
    print("-" * len(title))


def demo_set_creation():
    """Demonstrate set creation and basic operations."""
    print_section("1. SET CREATION & BASIC OPERATIONS")
    
    # Create sets
    print("Creating sets:")
    fruits = Set(['apple', 'banana', 'orange', 'grape'])
    numbers = Set([1, 2, 3, 4, 5])
    
    print(f"  Fruits: {fruits}")
    print(f"  Numbers: {numbers}")
    print(f"  |Fruits| = {len(fruits)}")
    print(f"  |Numbers| = {len(numbers)}")
    
    # Duplicate handling
    print("\nDuplicate removal:")
    duplicates = Set([1, 1, 2, 2, 3, 3])
    print(f"  Input: [1, 1, 2, 2, 3, 3]")
    print(f"  Result: {duplicates}")
    
    # Set membership
    print("\nSet membership:")
    print(f"  2 ∈ {numbers}: {2 in numbers}")
    print(f"  10 ∈ {numbers}: {10 in numbers}")
    print(f"  'apple' ∈ {fruits}: {'apple' in fruits}")
    
    # Set equality
    print("\nSet equality (order-independent):")
    s1 = Set([1, 2, 3])
    s2 = Set([3, 2, 1])
    print(f"  {s1} = {s2}: {s1 == s2}")


def demo_set_operations():
    """Demonstrate union, intersection, complement."""
    print_section("2. SET OPERATIONS")
    
    a = Set([1, 2, 3, 4, 5])
    b = Set([4, 5, 6, 7, 8])
    
    print(f"Set A: {a}")
    print(f"Set B: {b}")
    
    # Union
    print("\n[UNION] A ∪ B (all elements from both sets):")
    union_result = SetOperations.union(a, b)
    print(f"  A ∪ B = {union_result}")
    print(f"  |A ∪ B| = {len(union_result)}")
    
    # Intersection
    print("\n[INTERSECTION] A ∩ B (elements in both):")
    intersection_result = SetOperations.intersection(a, b)
    print(f"  A ∩ B = {intersection_result}")
    print(f"  |A ∩ B| = {len(intersection_result)}")
    
    # Relative complement A\B
    print("\n[RELATIVE COMPLEMENT] A \\ B (in A but not B):")
    comp_ab = SetOperations.relative_complement(a, b)
    print(f"  A \\ B = {comp_ab}")
    
    # Relative complement B\A
    print("\n[RELATIVE COMPLEMENT] B \\ A (in B but not A):")
    comp_ba = SetOperations.relative_complement(b, a)
    print(f"  B \\ A = {comp_ba}")
    
    # Absolute complement
    print("\n[ABSOLUTE COMPLEMENT] With respect to universal set:")
    u = Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    c = Set([1, 3, 5, 7, 9])
    complement = SetOperations.absolute_complement(c, u)
    print(f"  Universal set U: {u}")
    print(f"  Set C: {c}")
    print(f"  C' = {complement}")


def demo_cartesian_product():
    """Demonstrate Cartesian product."""
    print_section("3. CARTESIAN PRODUCT")
    
    coordinates = Set(['x', 'y', 'z'])
    values = Set([1, 2])
    
    print(f"Set A: {coordinates}")
    print(f"Set B: {values}")
    
    product = SetOperations.cartesian_product(coordinates, values)
    
    print(f"\nA × B (all pairs (a, b) where a ∈ A, b ∈ B):")
    for i, pair in enumerate(product, 1):
        print(f"  {i}. {pair}")
    
    print(f"\n|A × B| = {len(product)} = |A| × |B| = {len(coordinates)} × {len(values)}")
    
    # Example: menu combinations
    print("\nReal-world example - menu combinations:")
    drinks = Set(['coffee', 'tea', 'juice'])
    sizes = Set(['small', 'large'])
    menu = SetOperations.cartesian_product(drinks, sizes)
    print(f"  Drinks: {drinks}")
    print(f"  Sizes: {sizes}")
    print(f"  Total combinations: {len(menu)}")
    for drink, size in menu[:4]:
        print(f"    - {drink.capitalize()} ({size})")
    print(f"    - ... and {len(menu) - 4} more")


def demo_power_set():
    """Demonstrate power set computation."""
    print_section("4. POWER SET")
    
    # Small set
    a = Set([1, 2])
    ps_a = SetOperations.power_set(a)
    
    print(f"Set A: {a}")
    print(f"\nPower set 𝒫(A) (all subsets):")
    for i, subset in enumerate(ps_a.to_list(), 1):
        print(f"  {i}. {subset}")
    print(f"\n|𝒫(A)| = {len(ps_a)} = 2^|A| = 2^{len(a)}")
    
    # Larger set
    print("\n" + "-" * 40)
    b = Set(['a', 'b', 'c'])
    ps_b = SetOperations.power_set(b)
    print(f"\nSet B: {b}")
    print(f"|𝒫(B)| = 2^{len(b)} = {len(ps_b)} subsets")
    
    # Show subsets by size
    print("\nSubsets by size:")
    for k in range(len(b) + 1):
        subsets_k = ps_b.get_subsets_of_size(k)
        print(f"  Size {k}: {subsets_k}")


def demo_multisets():
    """Demonstrate multiset operations."""
    print_section("5. MULTISETS")
    
    ms = MultiSet([1, 1, 1, 2, 2, 3, 3, 3, 3])
    
    print(f"MultiSet: {ms}")
    print(f"Total elements: {len(ms)}")
    
    print("\nMultiplicities (counts):")
    unique = ms.unique_elements()
    for element in unique.to_list():
        mult = ms.multiplicity(element)
        print(f"  Element {element}: appears {mult} time(s)")
    
    print(f"\nUnique elements (as set): {unique}")


def demo_inclusion_exclusion():
    """Demonstrate inclusion-exclusion principle."""
    print_section("6. INCLUSION-EXCLUSION PRINCIPLE")
    
    # Two sets example
    print("Two sets example:")
    a = Set([1, 2, 3, 4, 5])
    b = Set([4, 5, 6, 7, 8])
    
    print(f"Set A: {a}  |A| = {len(a)}")
    print(f"Set B: {b}  |B| = {len(b)}")
    
    intersection = SetOperations.intersection(a, b)
    print(f"A ∩ B: {intersection}  |A ∩ B| = {len(intersection)}")
    
    union_direct = SetOperations.union(a, b)
    union_ie = InclusionExclusionPrinciple.cardinality_of_union_two_sets(a, b)
    
    print(f"\nUsing inclusion-exclusion principle:")
    print(f"  |A ∪ B| = |A| + |B| - |A ∩ B|")
    print(f"  |A ∪ B| = {len(a)} + {len(b)} - {len(intersection)}")
    print(f"  |A ∪ B| = {union_ie}")
    print(f"\nVerification: A ∪ B = {union_direct}")
    print(f"Actual cardinality: {len(union_direct)} ✓")
    
    # Three sets example
    print("\n" + "-" * 40)
    print("Three sets example:")
    a = Set([1, 2, 3])
    b = Set([2, 3, 4])
    c = Set([3, 4, 5])
    
    print(f"Set A: {a}")
    print(f"Set B: {b}")
    print(f"Set C: {c}")
    
    union_3 = InclusionExclusionPrinciple.cardinality_of_union_three_sets(a, b, c)
    print(f"\n|A ∪ B ∪ C| = {union_3}")
    
    # Verify
    actual_union = SetOperations.union(SetOperations.union(a, b), c)
    print(f"Verification: A ∪ B ∪ C = {actual_union}")
    print(f"Actual cardinality: {len(actual_union)} ✓")


def demo_logic_formulas():
    """Demonstrate logic formula evaluation."""
    print_section("7. LOGIC FORMULAS & TRUTH TABLES")
    
    # Simple formula
    print("Formula: A ∧ B")
    table = LogicEvaluator.generate_truth_table("A ∧ B")
    print(table)
    
    # More complex
    print("\n" + "-" * 40)
    print("\nFormula: (A ∨ B) ∧ ¬C")
    table2 = LogicEvaluator.generate_truth_table("(A ∨ B) ∧ ¬C")
    print(table2)
    
    # Properties
    print("\n" + "-" * 40)
    print("\nFormula properties:")
    formulas = [
        ("A ∨ ¬A", "tautology"),
        ("A ∧ ¬A", "contradiction"),
        ("A ∨ B", "contingency"),
    ]
    
    for formula, expected in formulas:
        is_taut = LogicEvaluator.is_tautology(formula)
        is_contra = LogicEvaluator.is_contradiction(formula)
        
        if is_taut:
            prop = "TAUTOLOGY (always true)"
        elif is_contra:
            prop = "CONTRADICTION (always false)"
        else:
            prop = "CONTINGENCY (sometimes true/false)"
        
        print(f"  {formula:15} → {prop}")


def demo_characteristic_functions():
    """Demonstrate characteristic functions."""
    print_section("8. CHARACTERISTIC FUNCTIONS")
    
    # Define universal set and subset
    u = Set([1, 2, 3, 4, 5])
    a = Set([1, 3, 5])
    
    print(f"Universal set U: {u}")
    print(f"Set A: {a}")
    
    # Create characteristic function
    chi = CharacteristicFunction(a, u)
    
    print("\nCharacteristic function χ_A(x):")
    print("  Returns 1 if x ∈ A, 0 if x ∉ A")
    print()
    
    for element in u.to_list():
        value = chi(element)
        in_set = "✓" if value == 1 else "✗"
        print(f"  χ_A({element}) = {value}  {in_set}")
    
    # Table representation
    print("\n" + "-" * 40)
    print("\nTabular representation:")
    table = CharacteristicFunctionTable(chi)
    print(table)
    
    # Get truth and false sets
    print("\nDerived sets:")
    print(f"  Truth set (where χ=1): {chi.get_truth_set()}")
    print(f"  False set (where χ=0): {chi.get_false_set()}")


def demo_characteristic_operations():
    """Demonstrate operations on characteristic functions."""
    print_section("9. CHARACTERISTIC FUNCTION OPERATIONS")
    
    u = Set([1, 2, 3, 4, 5])
    a = Set([1, 2, 3])
    b = Set([3, 4, 5])
    
    chi_a = CharacteristicFunction(a, u)
    chi_b = CharacteristicFunction(b, u)
    
    print(f"Universe U: {u}")
    print(f"Set A: {a}")
    print(f"Set B: {b}")
    
    # Intersection
    print("\n[INTERSECTION FUNCTION]")
    print("Property: χ_(A∩B)(x) = min(χ_A(x), χ_B(x))")
    chi_int = CharacteristicFunctionOperations.intersection_function(chi_a, chi_b)
    print(f"A ∩ B: {chi_int.get_truth_set()}")
    
    # Union
    print("\n[UNION FUNCTION]")
    print("Property: χ_(A∪B)(x) = max(χ_A(x), χ_B(x))")
    chi_union = CharacteristicFunctionOperations.union_function(chi_a, chi_b)
    print(f"A ∪ B: {chi_union.get_truth_set()}")
    
    # Complement
    print("\n[COMPLEMENT FUNCTION]")
    print("Property: χ_(A')(x) = 1 - χ_A(x)")
    chi_comp = CharacteristicFunctionOperations.complement_function(chi_a, u)
    print(f"A': {chi_comp.get_truth_set()}")
    
    # Cardinality from function
    print("\n[CARDINALITY FROM FUNCTION]")
    card = CharacteristicFunctionOperations.compute_cardinality_from_function(chi_a)
    print(f"|A| = Σ χ_A(x) for x ∈ U = {card}")


def main():
    """Run all demonstrations."""
    print("\nSet theory demo")
    
    try:
        demo_set_creation()
        demo_set_operations()
        demo_cartesian_product()
        demo_power_set()
        demo_multisets()
        demo_inclusion_exclusion()
        demo_logic_formulas()
        demo_characteristic_functions()
        demo_characteristic_operations()
        
    except Exception as e:
        print(f"\n✗ Error during demonstration: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
