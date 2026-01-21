// Core nodes
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.user_id IS UNIQUE;

CREATE CONSTRAINT trait_id_unique IF NOT EXISTS
FOR (t:Trait) REQUIRE t.trait_id IS UNIQUE;

CREATE CONSTRAINT question_id_unique IF NOT EXISTS
FOR (q:BlueprintQuestion) REQUIRE q.question_id IS UNIQUE;

CREATE CONSTRAINT event_id_unique IF NOT EXISTS
FOR (e:EvidenceEvent) REQUIRE e.event_id IS UNIQUE;

// Traits catalog load pattern (example, implement in code with MERGE)
MERGE (t:Trait {trait_id:"COG_TEMPO"})
SET t.name="Cognitive Tempo",
    t.description="Speed of synthesis and preference for fast iteration vs slow deliberation.";

// User trait state relationship
// (u)-[:HAS_TRAIT {score, confidence, version, updated_at}]->(t)

// Blueprint mapping
// (q)-[:MAPS_TO {weight}]->(t)

// Evidence events
// (u)-[:GENERATED_EVENT]->(e)
// (e)-[:AFFECTS {delta, reliability}]->(t)
