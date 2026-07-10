/* pawlak.js — the Pawlak Information System model + queries, built in the browser
 * from window.PAWLAK (generated from global_finance.csv).
 *
 *   S = (U, A)
 *     U = OBJECTS      (39 countries)
 *     A = ATTRIBUTES   (25 columns)
 *     ρ (value fn)     OBJECTS[i].values[attr]   ->  (:Object)-[:HAS_VALUE {value}]->(:Attribute)
 *
 *   Optional Task 3 — object groups (a partition of U by Credit_Rating):
 *     (:Object)-[:BELONGS_TO]->(:Group grade)-[:BELONGS_TO]->(:Group class)
 *
 * The functions below are the exact analogues of the Cypher in queries.cypher.
 */
(function () {
  const P = window.PAWLAK;
  const ATTRIBUTES = P.ATTRIBUTES;
  const OBJECTS = P.OBJECTS;
  const INVEST = new Set(P.INVESTMENT_GRADES);

  const classOf = (grade) => (INVEST.has(grade) ? "Investment Grade" : "Speculative Grade");
  const gradeOf = (o) => o.values.Credit_Rating;

  const grades = [...new Set(OBJECTS.map(gradeOf))].sort();
  const classes = ["Investment Grade", "Speculative Grade"];

  const objectById = (id) => OBJECTS.find((o) => o.id === id);

  window.Pawlak = {
    ATTRIBUTES,
    OBJECTS,
    grades,
    classes,
    classOf,
    gradeOf,
    objectById,

    counts: {
      objects: OBJECTS.length,
      attributes: ATTRIBUTES.length,
      values: OBJECTS.length * ATTRIBUTES.length,
      grades: grades.length,
      classes: classes.length,
      groups: grades.length + classes.length,
    },

    // Q3 — every attribute value of one object (the object's "row" of S)
    valuesOf(id) {
      const o = objectById(id);
      return ATTRIBUTES.map((a) => ({ attribute: a, value: o.values[a] }));
    },

    // Q4 — objects satisfying a condition: Credit_Rating = 'AAA' AND GDP growth > 2.0
    condition() {
      return OBJECTS.filter(
        (o) => o.values.Credit_Rating === "AAA" && parseFloat(o.values.GDP_Growth_Rate_Percent) > 2.0
      )
        .map((o) => ({
          country: o.id,
          credit_rating: o.values.Credit_Rating,
          gdp_growth: parseFloat(o.values.GDP_Growth_Rate_Percent),
        }))
        .sort((a, b) => b.gdp_growth - a.gdp_growth);
    },

    // group hierarchy:  class -> { grade -> [country ids] }
    hierarchy() {
      const map = {};
      classes.forEach((c) => (map[c] = {}));
      OBJECTS.forEach((o) => {
        const g = gradeOf(o);
        const c = classOf(g);
        (map[c][g] = map[c][g] || []).push(o.id);
      });
      return map;
    },

    // Q6 — all objects that reach the 'Investment Grade' class through their grade
    investmentGrouping() {
      const inv = this.hierarchy()["Investment Grade"];
      return Object.keys(inv)
        .sort()
        .map((g) => ({ class: "Investment Grade", grade: g, countries: inv[g] }));
    },
  };
})();
