// src/lib/weaviate.ts
import weaviate, { type WeaviateClient } from 'weaviate-client';
import { env } from "~/env"; // Import the validated env

/**
 * Creates and returns a Weaviate client instance
 */
export async function getWeaviateClient(): Promise<WeaviateClient> {
  return weaviate.connectToWeaviateCloud(
    env.WEAVIATE_HOST, {
      authCredentials: new weaviate.ApiKey(env.WEAVIATE_API_KEY),
    }
  )
}

/**
 * Query a Weaviate collection
 * @param collection The name of the collection to query
 * @param nearText Optional nearText object for semantic search
 * @param filters Optional filters to apply to the query
 * @param limit Optional limit for the number of results
 * @returns The query results
 */
export const queryWeaviate = async (
  collection: string,
  nearText?: { concepts: string[] },
  filters?: Record<string, any>,
  limit: number = 10
) => {
  const client = await getWeaviateClient();

  try {
    const myCollection = client.collections.get(collection);
    let query = myCollection.query;


    return await query.fetchObjects();
  } catch (error) {
    console.error("Weaviate query error:", error);
    throw error;
  }
};


/**
 * Delete a collection from Weaviate
 * @param collectionName Name of the collection to delete
 */
export const deleteWeaviateCollection = async (collectionName: string) => {
  const client = await getWeaviateClient();

  try {
    await client.collections.delete(collectionName);
    return true;
  } catch (error) {
    console.error("Weaviate delete collection error:", error);
    throw error;
  }
};