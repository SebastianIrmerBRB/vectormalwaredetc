import weaviate
import os
from weaviate.classes.config import Configure
huggingface_key = os.getenv("HUGGINGFACE_APIKEY")
headers = {
    "X-HuggingFace-Api-Key": huggingface_key,
}


client = weaviate.connect_to_local(port=5000, grpc_port=50051, headers=headers)

source_objects = [
    {"title": "The Shawshank Redemption", "description": "A wrongfully imprisoned man forms an inspiring friendship while finding hope and redemption in the darkest of places."},
    {"title": "The Godfather", "description": "A powerful mafia family struggles to balance loyalty, power, and betrayal in this iconic crime saga."},
    {"title": "The Dark Knight", "description": "Batman faces his greatest challenge as he battles the chaos unleashed by the Joker in Gotham City."},
    {"title": "Jingle All the Way", "description": "A desperate father goes to hilarious lengths to secure the season's hottest toy for his son on Christmas Eve."},
    {"title": "A Christmas Carol", "description": "A miserly old man is transformed after being visited by three ghosts on Christmas Eve in this timeless tale of redemption."}
]

collection = client.collections.get("DemoCollection")
with collection.batch.fixed_size(batch_size=200) as batch:
    for src_obj in source_objects:
        batch.add_object(
            properties={
                "title": src_obj["title"],
                "description": src_obj["description"],
            },
            # vector=vector  # Optionally provide a pre-obtained vector
        )
        if batch.number_errors > 10:
            print("Batch import stopped due to excessive errors.")
            break
failed_objects = collection.batch.failed_objects
if failed_objects:
    print(f"Number of failed imports: {len(failed_objects)}")
    print(f"First failed object: {failed_objects[0]}")