// ===========================================================================
//  REPORT QUERIES  -  run AFTER import.cypher
//  Run each block separately so each gets its own screenshot.
// ===========================================================================

// --- Q0. Graph schema (take SCREENSHOT 1) ----------------------------------
CALL db.schema.visualization();

// --- Q1. Count objects  |U|  (SCREENSHOT 2) --------------------------------
MATCH (o:Object) RETURN count(o) AS object_count;

// --- Q2. Count attributes |A|  (SCREENSHOT 3) ------------------------------
MATCH (a:Attribute) RETURN count(a) AS attribute_count;

// --- Q3. All attribute values of one selected object (SCREENSHOT 4) --------
//        pick any country as the object
MATCH (o:Object {id:'United States'})-[r:HAS_VALUE]->(a:Attribute)
RETURN a.name AS attribute, r.value AS value
ORDER BY attribute;

// --- Q3b. Same thing as a GRAPH picture (SCREENSHOT 5) ---------------------
MATCH path = (o:Object {id:'United States'})-[:HAS_VALUE]->(:Attribute)
RETURN path;

// --- Q4. Objects satisfying selected conditions (SCREENSHOT 6) -------------
//        condition: Credit_Rating = 'AAA'  AND  GDP growth > 2.0
MATCH (o:Object)-[r1:HAS_VALUE]->(:Attribute {name:'Credit_Rating'})
MATCH (o)-[r2:HAS_VALUE]->(:Attribute {name:'GDP_Growth_Rate_Percent'})
WHERE r1.value = 'AAA' AND toFloat(r2.value) > 2.0
RETURN o.id AS country, r1.value AS credit_rating, r2.value AS gdp_growth
ORDER BY gdp_growth DESC;

// ===========================================================================
//  OPTIONAL TASK 3 - object groups (hierarchy) queries
// ===========================================================================

// --- Q5. Hierarchy picture: Country -> Grade -> Class (SCREENSHOT 7) -------
MATCH path = (o:Object)-[:BELONGS_TO]->(:Group)-[:BELONGS_TO]->(:Group)
RETURN path;

// --- Q6. Retrieve all objects in a top group via graph path (SCREENSHOT 8)-
//        all countries that belong (through their grade) to Investment Grade
MATCH (o:Object)-[:BELONGS_TO]->(grade:Group)-[:BELONGS_TO]->(cls:Group {name:'Investment Grade'})
RETURN cls.name AS class, grade.name AS grade, collect(o.id) AS countries
ORDER BY grade;
