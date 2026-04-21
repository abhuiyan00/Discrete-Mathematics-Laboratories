"""Tests for the set theory project."""

import sys
from io import StringIO
from core import Set, MultiSet, EmptySet
from operations import (
    SetOperations, PowerSet, CardinalityOperations,
    InclusionExclusionPrinciple
)
from logic import FormulaParser, LogicEvaluator, TruthTable
from characteristic import (
    CharacteristicFunction, CharacteristicFunctionTable,
    CharacteristicFunctionOperations, MultiSetCharacteristicFunction
)


class TestRunner:
    """Simple test runner."""
    
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []
    
    def test(self, name: str, condition: bool, message: str = ""):
        """Run a single test."""
        self.tests.append((name, condition, message))
        if condition:
            self.passed += 1
            print(f"✓ {name}")
        else:
            self.failed += 1
            print(f"✗ {name}")
            if message:
                print(f"  {message}")
    
    def summary(self):
        """Print test summary."""
        total = self.passed + self.failed
        print("\nTest summary")
        print(f"Tests passed: {self.passed}/{total}")
        if self.failed > 0:
            print(f"Failures: {self.failed}")
        print()
        return self.failed == 0


def test_set_basics():
    """Test basic Set operations."""
    print("\n[1] Testing Set Basics")
    runner = TestRunner()
    
    # Creation
    s1 = Set([1, 2, 3])
    runner.test("Set creation", len(s1) == 3)
    
    # Duplicate removal
    s2 = Set([1, 1, 2, 2, 3])
    runner.test("Duplicate removal", len(s2) == 3)
    
    # Membership
    runner.test("Membership check", 2 in s1 and 5 not in s1)
    
    # Equality
    s3 = Set([3, 2, 1])
    runner.test("Set equality (order independent)", s1 == s3)
    
    # Empty set
    empty = EmptySet()
    runner.test("Empty set", len(empty) == 0)
    
    # Add/Remove
    s1.add(4)
    runner.test("Add element", 4 in s1 and len(s1) == 4)
    
    s1.remove(4)
    runner.test("Remove element", 4 not in s1 and len(s1) == 3)
    
    return runner.summary()


def test_multiset_basics():
    """Test MultiSet operations."""
    print("\n[2] Testing MultiSet Basics")
    runner = TestRunner()
    
    # Creation
    ms = MultiSet([1, 1, 2, 2, 2, 3])
    runner.test("MultiSet creation", len(ms) == 6)
    
    # Multiplicity
    runner.test("Multiplicity 1", ms.multiplicity(1) == 2)
    runner.test("Multiplicity 2", ms.multiplicity(2) == 3)
    runner.test("Multiplicity absent", ms.multiplicity(5) == 0)
    
    # Unique elements
    unique = ms.unique_elements()
    runner.test("Unique elements", len(unique) == 3)
    
    return runner.summary()


def test_set_operations():
    """Test union, intersection, complement."""
    print("\n[3] Testing Set Operations")
    runner = TestRunner()
    
    a = Set([1, 2, 3, 4])
    b = Set([3, 4, 5, 6])
    
    # Union
    union = SetOperations.union(a, b)
    runner.test("Union", len(union) == 6 and 5 in union)
    
    # Intersection
    intersection = SetOperations.intersection(a, b)
    runner.test("Intersection", len(intersection) == 2 and 
               3 in intersection and 4 in intersection)
    
    # Relative complement A\B
    comp_ab = SetOperations.relative_complement(a, b)
    runner.test("Relative complement A\\B", len(comp_ab) == 2 and 
               1 in comp_ab and 2 in comp_ab)
    
    # Relative complement B\A
    comp_ba = SetOperations.relative_complement(b, a)
    runner.test("Relative complement B\\A", len(comp_ba) == 2 and 
               5 in comp_ba and 6 in comp_ba)
    
    # Absolute complement
    u = Set([1, 2, 3, 4, 5, 6, 7, 8])
    c = Set([1, 3, 5])
    complement = SetOperations.absolute_complement(c, u)
    runner.test("Absolute complement", len(complement) == 5 and 
               2 in complement and 1 not in complement)
    
    return runner.summary()


def test_cartesian_product():
    """Test Cartesian product."""
    print("\n[4] Testing Cartesian Product")
    runner = TestRunner()
    
    a = Set([1, 2])
    b = Set(['a', 'b'])
    
    product = SetOperations.cartesian_product(a, b)
    runner.test("Cartesian product size", len(product) == 4)
    runner.test("Cartesian product contains pair", (1, 'a') in product)
    runner.test("Cartesian product ordered", (1, 'a') in product and 
               ('a', 1) not in product)
    
    # Product with empty set
    empty = EmptySet()
    product_empty = SetOperations.cartesian_product(a, empty)
    runner.test("Product with empty set", len(product_empty) == 0)
    
    return runner.summary()


def test_power_set():
    """Test power set computation."""
    print("\n[5] Testing Power Set")
    runner = TestRunner()
    
    # 2-element set
    a = Set([1, 2])
    ps = SetOperations.power_set(a)
    runner.test("Power set size 2^2", len(ps) == 4)
    
    # 3-element set
    b = Set(['x', 'y', 'z'])
    ps_b = SetOperations.power_set(b)
    runner.test("Power set size 2^3", len(ps_b) == 8)
    
    # Empty set should have power set with one element (empty set itself)
    empty = EmptySet()
    ps_empty = SetOperations.power_set(empty)
    runner.test("Power set of empty set", len(ps_empty) == 1)
    
    # Check subsets of size k
    subsets_size_1 = ps.get_subsets_of_size(1)
    runner.test("Subsets of size 1", len(subsets_size_1) == 2)
    
    return runner.summary()


def test_cardinality():
    """Test cardinality operations."""
    print("\n[6] Testing Cardinality")
    runner = TestRunner()
    
    a = Set([1, 2, 3])
    runner.test("Cardinality", CardinalityOperations.cardinality(a) == 3)
    
    b = Set([3, 4, 5])
    runner.test("Disjoint sets false", 
               not CardinalityOperations.are_disjoint(a, b))
    
    c = Set([6, 7])
    runner.test("Disjoint sets true", 
               CardinalityOperations.are_disjoint(a, c))
    
    return runner.summary()


def test_inclusion_exclusion():
    """Test inclusion-exclusion principle."""
    print("\n[7] Testing Inclusion-Exclusion Principle")
    runner = TestRunner()
    
    a = Set([1, 2, 3])
    b = Set([3, 4, 5])
    
    # Two sets
    card_union = InclusionExclusionPrinciple.cardinality_of_union_two_sets(a, b)
    runner.test("Union cardinality 2 sets", card_union == 5)
    
    # Three sets
    c = Set([3, 5, 6])
    card_union_3 = InclusionExclusionPrinciple.cardinality_of_union_three_sets(a, b, c)
    union_actual = SetOperations.union(SetOperations.union(a, b), c)
    runner.test("Union cardinality 3 sets", 
               card_union_3 == len(union_actual))
    
    return runner.summary()


def test_logic_parser():
    """Test logic formula parser."""
    print("\n[8] Testing Logic Parser")
    runner = TestRunner()
    
    # Simple variable
    try:
        parser = FormulaParser("A")
        formula = parser.parse()
        runner.test("Parse single variable", True)
    except:
        runner.test("Parse single variable", False)
    
    # NOT
    try:
        parser = FormulaParser("¬A")
        formula = parser.parse()
        runner.test("Parse NOT", True)
    except:
        runner.test("Parse NOT", False)
    
    # AND
    try:
        parser = FormulaParser("A ∧ B")
        formula = parser.parse()
        runner.test("Parse AND", True)
    except:
        runner.test("Parse AND", False)
    
    # Complex
    try:
        parser = FormulaParser("(A ∨ B) ∧ ¬C")
        formula = parser.parse()
        runner.test("Parse complex formula", True)
    except:
        runner.test("Parse complex formula", False)
    
    return runner.summary()


def test_truth_tables():
    """Test truth table generation."""
    print("\n[9] Testing Truth Tables")
    runner = TestRunner()
    
    # Simple OR
    table_or = LogicEvaluator.generate_truth_table("A ∨ B")
    runner.test("Truth table rows", len(table_or.rows) == 4)
    
    # Tautology: A ∨ ¬A
    is_tautology = LogicEvaluator.is_tautology("A ∨ ¬A")
    runner.test("Tautology detection", is_tautology)
    
    # Contradiction: A ∧ ¬A
    is_contradiction = LogicEvaluator.is_contradiction("A ∧ ¬A")
    runner.test("Contradiction detection", is_contradiction)
    
    # Complex formula
    table_complex = LogicEvaluator.generate_truth_table("(A ∧ B) ∨ ¬C")
    runner.test("Complex formula table", len(table_complex.rows) == 8)
    
    return runner.summary()


def test_characteristic_functions():
    """Test characteristic functions."""
    print("\n[10] Testing Characteristic Functions")
    runner = TestRunner()
    
    a = Set([1, 2, 3, 4, 5])
    subset = Set([1, 3, 5])
    
    # Create function
    chi = CharacteristicFunction(subset, a)
    runner.test("Chi(3) = 1", chi(3) == 1)
    runner.test("Chi(2) = 0", chi(2) == 0)
    
    # Truth set
    truth_set = chi.get_truth_set()
    runner.test("Truth set", truth_set == subset)
    
    # False set
    false_set = chi.get_false_set()
    runner.test("False set cardinality", len(false_set) == 2)
    
    # Table representation
    table = CharacteristicFunctionTable(chi)
    runner.test("Characteristic function table", len(table.table) == 5)
    
    return runner.summary()


def test_characteristic_function_operations():
    """Test operations on characteristic functions."""
    print("\n[11] Testing Characteristic Function Operations")
    runner = TestRunner()
    
    u = Set([1, 2, 3, 4])
    a = Set([1, 2])
    b = Set([2, 3])
    
    chi_a = CharacteristicFunction(a, u)
    chi_b = CharacteristicFunction(b, u)
    
    # Intersection function
    chi_int = CharacteristicFunctionOperations.intersection_function(chi_a, chi_b)
    runner.test("Intersection function χ(2)=1", chi_int(2) == 1)
    runner.test("Intersection function χ(1)=0", chi_int(1) == 0)
    
    # Union function
    chi_union = CharacteristicFunctionOperations.union_function(chi_a, chi_b)
    runner.test("Union function χ(1)=1", chi_union(1) == 1)
    runner.test("Union function χ(4)=0", chi_union(4) == 0)
    
    # Complement function
    chi_comp = CharacteristicFunctionOperations.complement_function(chi_a, u)
    runner.test("Complement function χ(1)=0", chi_comp(1) == 0)
    runner.test("Complement function χ(4)=1", chi_comp(4) == 1)
    
    # Cardinality from function
    card = CharacteristicFunctionOperations.compute_cardinality_from_function(chi_a)
    runner.test("Cardinality from function", card == 2)
    
    return runner.summary()


def test_multiset_characteristic():
    """Test characteristic functions for multisets."""
    print("\n[12] Testing MultiSet Characteristic Functions")
    runner = TestRunner()
    
    ms = MultiSet([1, 1, 2, 2, 2, 3])
    chi = MultiSetCharacteristicFunction(ms)
    
    runner.test("Chi_MS(1) = 2", chi(1) == 2)
    runner.test("Chi_MS(2) = 3", chi(2) == 3)
    runner.test("Chi_MS(5) = 0", chi(5) == 0)
    
    return runner.summary()


def run_all_tests():
    """Run all test suites."""
    print("\nSet theory test suite")
    
    results = []
    results.append(("Set Basics", test_set_basics()))
    results.append(("MultiSet Basics", test_multiset_basics()))
    results.append(("Set Operations", test_set_operations()))
    results.append(("Cartesian Product", test_cartesian_product()))
    results.append(("Power Set", test_power_set()))
    results.append(("Cardinality", test_cardinality()))
    results.append(("Inclusion-Exclusion", test_inclusion_exclusion()))
    results.append(("Logic Parser", test_logic_parser()))
    results.append(("Truth Tables", test_truth_tables()))
    results.append(("Characteristic Functions", test_characteristic_functions()))
    results.append(("Characteristic Function Operations", test_characteristic_function_operations()))
    results.append(("MultiSet Characteristic", test_multiset_characteristic()))
    
    print("\nOverall summary")
    
    all_passed = all(result[1] for result in results)
    passed_suites = sum(1 for _, result in results if result)
    total_suites = len(results)
    
    print(f"Test suites passed: {passed_suites}/{total_suites}")
    
    if all_passed:
        print("\n✓ ALL TESTS PASSED!")
    else:
        print("\n✗ Some tests failed. Review output above.")
    
    return all_passed


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
