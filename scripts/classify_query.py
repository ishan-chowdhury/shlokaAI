

from transformers import pipeline 

classifier = pipeline(
    "zero-shot-classification",
    model = "facebook/bart-large-mnli"
)


THEMES = [
    "grief and sorrow",
    "duty and dharma",
    "fear and anxiety",
    "anger",
    "attachment",
    "purpose and meaning",
    "ego and pride",
    "failure and defeat"
]

query = "I don't know what to do with my life, I feel directionless"

result = classifier(query, candidate_labels=THEMES)

# result["labels"] is sorted by confidence, highest first
top_theme = result["labels"][0]
top_score = result["scores"][0]

print(f"Detected theme: {top_theme} (confidence: {top_score:.2f})")

# Print all scores to understand the full confidence breakdown
print("\nAll theme scores:")
for label, score in zip(result["labels"], result["scores"]):
    print(f"  {label}: {score:.3f}")
