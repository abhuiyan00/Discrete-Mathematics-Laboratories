// ===========================================================================
//  Pawlak Information System  S = (U, A)  as a Neo4j graph
//  Dataset: global_finance.csv  (39 countries x 25 attributes)
//    U = set of objects     -> (:Object)      one per country (row)
//    A = set of attributes  -> (:Attribute)   one per column
//    information function   -> (:Object)-[:HAS_VALUE {value}]->(:Attribute)
//
//  Optional task 3: object groups (hierarchy)
//    (:Object)-[:BELONGS_TO]->(:Group rating grade)-[:BELONGS_TO]->(:Group rating class)
//
//  HOW TO RUN
//    1. Copy global_finance.csv into your Neo4j 'import' folder.
//       (Neo4j Desktop: open DB -> "..." -> Open folder -> Import)
//    2. Open Neo4j Browser, paste this whole file, Run.
//       (or run block by block)
// ===========================================================================

// --- 0. clean slate (safe to re-run) --------------------------------------
MATCH (n) DETACH DELETE n;

// --- 1. uniqueness constraints --------------------------------------------
CREATE CONSTRAINT object_id   IF NOT EXISTS FOR (o:Object)    REQUIRE o.id   IS UNIQUE;
CREATE CONSTRAINT attr_name   IF NOT EXISTS FOR (a:Attribute) REQUIRE a.name IS UNIQUE;
CREATE CONSTRAINT group_name  IF NOT EXISTS FOR (g:Group)     REQUIRE g.name IS UNIQUE;

// --- 2. core import: objects, attributes, values --------------------------
LOAD CSV WITH HEADERS FROM 'file:///global_finance.csv' AS row
// 2a. one Object node per country
MERGE (o:Object {id: row.Country})
// 2b. unwind every column as an (attribute name, value) pair
WITH o, row,
[
  {name:'Date',                          value: row.Date},
  {name:'Stock_Index',                   value: row.Stock_Index},
  {name:'Index_Value',                   value: row.Index_Value},
  {name:'Daily_Change_Percent',          value: row.Daily_Change_Percent},
  {name:'Market_Cap_Trillion_USD',       value: row.Market_Cap_Trillion_USD},
  {name:'GDP_Growth_Rate_Percent',       value: row.GDP_Growth_Rate_Percent},
  {name:'Inflation_Rate_Percent',        value: row.Inflation_Rate_Percent},
  {name:'Interest_Rate_Percent',         value: row.Interest_Rate_Percent},
  {name:'Unemployment_Rate_Percent',     value: row.Unemployment_Rate_Percent},
  {name:'Currency_Code',                 value: row.Currency_Code},
  {name:'Exchange_Rate_USD',             value: row.Exchange_Rate_USD},
  {name:'Currency_Change_YTD_Percent',   value: row.Currency_Change_YTD_Percent},
  {name:'Government_Debt_GDP_Percent',   value: row.Government_Debt_GDP_Percent},
  {name:'Current_Account_Balance_Billion_USD', value: row.Current_Account_Balance_Billion_USD},
  {name:'FDI_Inflow_Billion_USD',        value: row.FDI_Inflow_Billion_USD},
  {name:'Commodity_Index',               value: row.Commodity_Index},
  {name:'Oil_Price_USD_Barrel',          value: row.Oil_Price_USD_Barrel},
  {name:'Gold_Price_USD_Ounce',          value: row.Gold_Price_USD_Ounce},
  {name:'Bond_Yield_10Y_Percent',        value: row.Bond_Yield_10Y_Percent},
  {name:'Credit_Rating',                 value: row.Credit_Rating},
  {name:'Political_Risk_Score',          value: row.Political_Risk_Score},
  {name:'Banking_Sector_Health',         value: row.Banking_Sector_Health},
  {name:'Real_Estate_Index',             value: row.Real_Estate_Index},
  {name:'Export_Growth_Percent',         value: row.Export_Growth_Percent},
  {name:'Import_Growth_Percent',         value: row.Import_Growth_Percent}
] AS pairs
UNWIND pairs AS p
MERGE (a:Attribute {name: p.name})
MERGE (o)-[:HAS_VALUE {value: p.value}]->(a);

// --- 3. OPTIONAL TASK 3: build group hierarchy from Credit_Rating ----------
// level 1 group = the rating grade itself (AAA, BB+, ...)
// level 2 group = rating class (Investment Grade vs Speculative Grade)
MATCH (o:Object)-[r:HAS_VALUE]->(:Attribute {name:'Credit_Rating'})
WITH o, r.value AS grade
MERGE (g:Group {name: grade})
  SET g.level = 'grade'
MERGE (o)-[:BELONGS_TO]->(g)
WITH g, grade,
     CASE WHEN grade IN ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-']
          THEN 'Investment Grade' ELSE 'Speculative Grade' END AS cls
MERGE (c:Group {name: cls})
  SET c.level = 'class'
MERGE (g)-[:BELONGS_TO]->(c);

// ===========================================================================
//  done. expected: 39 Objects, 25 Attributes, 975 HAS_VALUE rels,
//                  16 Group nodes (14 grades + 2 classes)
// ===========================================================================
