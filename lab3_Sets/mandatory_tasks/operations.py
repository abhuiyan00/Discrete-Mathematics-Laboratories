"""Set operations and cardinality helpers."""

from typing import List, Tuple, Optional
from core import Set, MultiSet, EmptySet


class SetOperations:
    """
    Collection of static methods for set operations.
    
    All operations follow standard mathematical definitions.
    """
    
    @staticmethod
    def union(set_a: Set, set_b: Set) -> Set:
        """
        Compute the union of two sets (A ∪ B).
        
        Union contains all elements that are in A or B (or both).
        
        Mathematical definition:
            A ∪ B = {x : x ∈ A or x ∈ B}
        
        Time complexity: O(n + m) where n = |A|, m = |B|
        
        Args:
            set_a: First set.
            set_b: Second set.
        
        Returns:
            New Set containing union of both sets.
        
        Example:
            >>> a = Set([1, 2, 3])
            >>> b = Set([3, 4, 5])
            >>> SetOperations.union(a, b)
            {1, 2, 3, 4, 5}
        """
        result_elements = set_a.to_list()
        
        for element in set_b.to_list():
            if element not in result_elements:
                result_elements.append(element)
        
        return Set(result_elements)
    
    @staticmethod
    def intersection(set_a: Set, set_b: Set) -> Set:
        """
        Compute the intersection of two sets (A ∩ B).
        
        Intersection contains only elements that are in both A and B.
        
        Mathematical definition:
            A ∩ B = {x : x ∈ A and x ∈ B}
        
        Time complexity: O(n * m) where n = |A|, m = |B|
        
        Args:
            set_a: First set.
            set_b: Second set.
        
        Returns:
            New Set containing intersection of both sets.
        
        Example:
            >>> a = Set([1, 2, 3])
            >>> b = Set([3, 4, 5])
            >>> SetOperations.intersection(a, b)
            {3}
        """
        result_elements = []
        
        for element in set_a.to_list():
            if element in set_b:
                result_elements.append(element)
        
        return Set(result_elements)
    
    @staticmethod
    def relative_complement(set_a: Set, set_b: Set) -> Set:
        """
        Compute the relative complement (A \ B).
        
        Relative complement contains elements in A but not in B.
        
        Mathematical definition:
            A \ B = {x : x ∈ A and x ∉ B}
        
        Time complexity: O(n * m) where n = |A|, m = |B|
        
        Args:
            set_a: First set (minuend).
            set_b: Second set (subtrahend).
        
        Returns:
            New Set containing A \ B.
        
        Example:
            >>> a = Set([1, 2, 3, 4])
            >>> b = Set([3, 4, 5])
            >>> SetOperations.relative_complement(a, b)
            {1, 2}
        
        Note:
            A \ B ≠ B \ A in general.
        """
        result_elements = []
        
        for element in set_a.to_list():
            if element not in set_b:
                result_elements.append(element)
        
        return Set(result_elements)
    
    @staticmethod
    def absolute_complement(set_a: Set, universal_set: Set) -> Set:
        """
        Compute the absolute complement (A' or Ac) with respect to universe U.
        
        Absolute complement contains elements in U but not in A.
        
        Mathematical definition:
            A' = U \ A = {x : x ∈ U and x ∉ A}
        
        Time complexity: O(n * m) where n = |U|, m = |A|
        
        Args:
            set_a: Set to complement.
            universal_set: Universal set (the "universe" U).
        
        Returns:
            New Set containing A'.
        
        Raises:
            ValueError: If A is not a subset of U.
        
        Example:
            >>> u = Set([1, 2, 3, 4, 5])
            >>> a = Set([1, 3, 5])
            >>> SetOperations.absolute_complement(a, u)
            {2, 4}
        """
        # Verify that A is subset of U
        for element in set_a.to_list():
            if element not in universal_set:
                raise ValueError(f"Set A must be subset of universal set U. "
                               f"Element {element} not in U.")
        
        # Complement is relative complement with respect to U
        return SetOperations.relative_complement(universal_set, set_a)
    
    @staticmethod
    def cartesian_product(set_a: Set, set_b: Set) -> List[Tuple]:
        """
        Compute the Cartesian product (A × B).
        
        Cartesian product is the set of all ordered pairs (a, b)
        where a ∈ A and b ∈ B.
        
        Mathematical definition:
            A × B = {(a, b) : a ∈ A and b ∈ B}
        
        Time complexity: O(n * m) where n = |A|, m = |B|
        
        Args:
            set_a: First set.
            set_b: Second set.
        
        Returns:
            List of tuples representing A × B.
            Cardinality of result = |A| × |B|.
        
        Example:
            >>> a = Set([1, 2])
            >>> b = Set(['a', 'b'])
            >>> SetOperations.cartesian_product(a, b)
            [(1, 'a'), (1, 'b'), (2, 'a'), (2, 'b')]
        
        Note:
            Result is returned as list of tuples (not a Set) since
            tuples need special handling.
        """
        product = []
        
        for a_element in set_a.to_list():
            for b_element in set_b.to_list():
                product.append((a_element, b_element))
        
        return product
    
    @staticmethod
    def power_set(set_a: Set) -> 'PowerSet':
        """
        Compute the power set (𝒫(A)).
        
        The power set is the set of all subsets of A.
        
        Mathematical definition:
            𝒫(A) = {S : S ⊆ A}
        
        Cardinality: |𝒫(A)| = 2^|A|
        
        Time complexity: O(2^n) where n = |A|
        Space complexity: O(2^n)
        
        Args:
            set_a: Set to compute power set of.
        
        Returns:
            PowerSet object containing all subsets.
        
        Example:
            >>> a = Set([1, 2])
            >>> ps = SetOperations.power_set(a)
            >>> print(ps)
            P(A) = {∅, {1}, {2}, {1, 2}}
        
        Note:
            Power set of empty set is {∅}.
            Power set of set with n elements has 2^n subsets.
        """
        return PowerSet(set_a)


class PowerSet:
    """
    Represents the power set of a given set.
    
    The power set 𝒫(A) is the set of all subsets of A,
    including the empty set and A itself.
    
    Attributes:
        original_set: The set to compute power set of.
        subsets: List of all subsets.
    """
    
    def __init__(self, set_a: Set):
        """
        Initialize power set by computing all subsets.
        
        Args:
            set_a: The set to compute power set of.
        """
        self.original_set = set_a
        self.subsets = self._compute_all_subsets(set_a.to_list())
    
    @staticmethod
    def _compute_all_subsets(elements: List) -> List[Set]:
        """
        Compute all subsets of a set using binary enumeration.
        
        For a set with n elements, generates 2^n subsets by iterating
        through all binary numbers from 0 to 2^n - 1.
        
        Args:
            elements: List of elements.
        
        Returns:
            List of all subsets as Set objects.
        """
        n = len(elements)
        subsets = []
        
        # Generate all 2^n combinations
        for i in range(2 ** n):
            subset_elements = []
            
            # Check each bit position
            for j in range(n):
                # If j-th bit is set, include j-th element
                if (i >> j) & 1:
                    subset_elements.append(elements[j])
            
            subsets.append(Set(subset_elements))
        
        return subsets
    
    def __len__(self) -> int:
        """Return cardinality of power set (2^n)."""
        return len(self.subsets)
    
    def __str__(self) -> str:
        """String representation of power set."""
        subsets_str = ", ".join(str(s) for s in self.subsets)
        return f"P(A) = {{{subsets_str}}}"
    
    def __repr__(self) -> str:
        """Developer-friendly representation."""
        return f"PowerSet({self.original_set})"
    
    def to_list(self) -> List[Set]:
        """Get list of all subsets."""
        return self.subsets.copy()
    
    def get_subsets_of_size(self, k: int) -> List[Set]:
        """
        Get all subsets of size exactly k.
        
        Args:
            k: Size of subsets to retrieve.
        
        Returns:
            List of all k-element subsets.
        """
        return [s for s in self.subsets if len(s) == k]
    
    def contains_subset(self, subset: Set) -> bool:
        """
        Check if a given set is a subset of the original set.
        
        Args:
            subset: Set to check.
        
        Returns:
            True if subset is in the power set.
        """
        return subset.is_subset(self.original_set)


class CardinalityOperations:
    """
    Operations related to cardinality and set sizes.
    """
    
    @staticmethod
    def cardinality(set_a: Set) -> int:
        """
        Get the cardinality (size) of a set.
        
        Cardinality is the number of elements in the set.
        
        Args:
            set_a: Set to measure.
        
        Returns:
            Number of elements in the set.
        
        Example:
            >>> a = Set([1, 2, 3])
            >>> CardinalityOperations.cardinality(a)
            3
        """
        return len(set_a)
    
    @staticmethod
    def are_disjoint(set_a: Set, set_b: Set) -> bool:
        """
        Check if two sets are disjoint (have no common elements).
        
        Args:
            set_a: First set.
            set_b: Second set.
        
        Returns:
            True if A ∩ B = ∅.
        """
        intersection = SetOperations.intersection(set_a, set_b)
        return len(intersection) == 0


class InclusionExclusionPrinciple:
    """
    Implementation of the inclusion-exclusion principle.
    
    The inclusion-exclusion principle computes the cardinality of
    the union of sets by accounting for overlaps.
    """
    
    @staticmethod
    def cardinality_of_union_two_sets(set_a: Set, set_b: Set) -> int:
        """
        Compute |A ∪ B| using inclusion-exclusion principle.
        
        Formula:
            |A ∪ B| = |A| + |B| - |A ∩ B|
        
        Args:
            set_a: First set.
            set_b: Second set.
        
        Returns:
            Cardinality of the union.
        
        Example:
            >>> a = Set([1, 2, 3])
            >>> b = Set([3, 4, 5])
            >>> InclusionExclusionPrinciple.cardinality_of_union_two_sets(a, b)
            5  # because |A| + |B| - |A∩B| = 3 + 3 - 1 = 5
        """
        card_a = len(set_a)
        card_b = len(set_b)
        
        intersection = SetOperations.intersection(set_a, set_b)
        card_intersection = len(intersection)
        
        return card_a + card_b - card_intersection
    
    @staticmethod
    def cardinality_of_union_three_sets(set_a: Set, set_b: Set, 
                                       set_c: Set) -> int:
        """
        Compute |A ∪ B ∪ C| using inclusion-exclusion principle.
        
        Formula:
            |A ∪ B ∪ C| = |A| + |B| + |C|
                           - |A ∩ B| - |A ∩ C| - |B ∩ C|
                           + |A ∩ B ∩ C|
        
        Pattern: Add singles, subtract pairs, add triples.
        
        Args:
            set_a: First set.
            set_b: Second set.
            set_c: Third set.
        
        Returns:
            Cardinality of the union.
        
        Example:
            >>> a = Set([1, 2, 3])
            >>> b = Set([2, 3, 4])
            >>> c = Set([3, 4, 5])
            >>> InclusionExclusionPrinciple.cardinality_of_union_three_sets(a, b, c)
            5  # |A∪B∪C| = {1, 2, 3, 4, 5}
        """
        # Single sets
        card_a = len(set_a)
        card_b = len(set_b)
        card_c = len(set_c)
        
        # Pairwise intersections
        ab = SetOperations.intersection(set_a, set_b)
        ac = SetOperations.intersection(set_a, set_c)
        bc = SetOperations.intersection(set_b, set_c)
        
        # Three-way intersection
        abc = SetOperations.intersection(ab, set_c)
        
        return (card_a + card_b + card_c 
                - len(ab) - len(ac) - len(bc)
                + len(abc))
    
    @staticmethod
    def cardinality_of_union_multiple_sets(sets: List[Set]) -> int:
        """
        Compute cardinality of union of multiple sets.
        
        Uses the generalized inclusion-exclusion principle.
        
        Args:
            sets: List of sets to union.
        
        Returns:
            Cardinality of the union of all sets.
        
        Note:
            This has exponential time complexity O(2^n) where n is number of sets.
        """
        if len(sets) == 0:
            return 0
        if len(sets) == 1:
            return len(sets[0])
        if len(sets) == 2:
            return InclusionExclusionPrinciple.cardinality_of_union_two_sets(
                sets[0], sets[1])
        if len(sets) == 3:
            return InclusionExclusionPrinciple.cardinality_of_union_three_sets(
                sets[0], sets[1], sets[2])
        
        # General case for n > 3
        # This uses binary enumeration of all subset combinations
        n = len(sets)
        total = 0
        
        # Iterate through all non-empty subsets of sets
        for mask in range(1, 2 ** n):
            # Compute intersection of sets in this subset
            intersection_result = sets[0].copy()
            num_sets_in_mask = 0
            
            for i in range(n):
                if (mask >> i) & 1:
                    if i == 0:
                        num_sets_in_mask = 1
                    else:
                        intersection_result = SetOperations.intersection(
                            intersection_result, sets[i])
                        num_sets_in_mask += 1
            
            cardinality_intersection = len(intersection_result)
            
            # Include-exclude: odd number of sets → add, even → subtract
            if num_sets_in_mask % 2 == 1:
                total += cardinality_intersection
            else:
                total -= cardinality_intersection
        
        return total
