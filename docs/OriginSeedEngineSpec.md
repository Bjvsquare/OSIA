# Origin Seed Engine Specification

## Overview
The Origin Seed Engine generates a deterministic baseline trait profile (v0) from user birth data while maintaining strict neutrality in all user-facing language.

## Time Mode Support

### Mode: EXACT
- **Input**: Precise birth time (HH:MM)
- **Processing**: Single chart calculation
- **Precision**: HIGH
- **Confidence**: Highest (0.7-1.0)
- **Use Case**: User knows exact birth time

### Mode: WINDOW
- **Input**: Time range (e.g., "6:00-9:00")
- **Processing**: Sample 10 times across window
- **Precision**: MEDIUM
- **Confidence**: Medium (0.5-0.8)
- **Use Case**: User knows approximate time period

### Mode: UNKNOWN
- **Input**: No time information
- **Processing**: Sample 24 times across full day
- **Precision**: BROAD
- **Confidence**: Lower (0.3-0.6)
- **Use Case**: Time unknown or uncertain

## Trait Vector

The engine outputs 24 neutral behavioral traits:

| Trait ID | Name | Description |
|----------|------|-------------|
| COG_TEMPO | Cognitive Tempo | Speed of synthesis and iteration preference |
| COG_ABSTRACTION | Abstraction Preference | Conceptual vs concrete thinking style |
| STRUCTURE_NEED | Structure Need | Need for planning and predictability |
| NOVELTY_APPETITE | Novelty Appetite | Drive for exploration and variety |
| ... | ... | (20 more traits) |

## API Endpoint

### POST /v1/origin-seed/generate

**Request**:
```json
{
  "dob": "1990-05-15",
  "birthplace": {
    "label": "New York, NY",
    "lat": 40.7128,
    "lon": -74.0060
  },
  "birth_time": {
    "mode": "WINDOW",
    "window": {
      "start": "06:00",
      "end": "09:00"
    }
  }
}
```

**Response**:
```json
{
  "user_id": "user-123",
  "precision": "MEDIUM",
  "trait_vector": [
    {
      "trait_id": "COG_TEMPO",
      "score": 72.5,
      "confidence": 0.65,
      "stats": {
        "min": 68.0,
        "max": 77.0,
        "median": 72.5,
        "spread": 9.0
      }
    }
  ],
  "uncertainty": {
    "time_mode": "WINDOW",
    "mean_spread": 12.3,
    "sampling": {
      "samples": 10,
      "strategy": "WINDOW_SAMPLE"
    }
  },
  "version": "v0",
  "generated_at": "2026-01-21T11:00:00Z"
}
```

## Constraints

### Hard Constraints
1. **Never expose raw celestial coordinates** - All origin data stays internal
2. **Never use themed/astrological labels** - Only neutral behavioral language
3. **Deterministic output** - Same inputs => same v0 profile
4. **Confidence-scored** - Every trait has explicit confidence metric

### Language Guard
Forbidden terms in any user-facing output:
- astrology, natal chart, planet, sign, house, aspect
- retrograde, zodiac, ascendant, midheaven
- Any symbolic/themed references

Replace with:
- tendency, pattern, starting hypothesis, confidence, evidence
- behavioral trait, disposition, orientation

## Implementation Notes

### Sampling Strategy
- **Window sampling**: Linearly spaced samples across time range
- **Full day sampling**: Evenly distributed across 24 hours
- **Aggregation**: Median score, spread-based confidence

### Confidence Calculation
```
confidence = max(0.3, 1 - (spread / 100))
```

Where spread is the difference between min and max sampled scores.

## Example Use Cases

1. **User knows exact time**: Use EXACT mode for highest precision
2. **User knows "morning"**: Use WINDOW mode with 06:00-12:00
3. **User has no idea**: Use UNKNOWN mode, accept broader profile

## Future Enhancements
- Support for latitude-based time windows (sunrise/sunset)
- Improved trait mapping algorithms
- Validation against real-world behavioral data
