// src/actions/weaviateActions.ts
'use server';

import {getWeaviateClient} from "~/lib/weaviate";
import type {
  MalwareObject,
  MalwareProperties,
} from "~/interfaces/malware";

/**
 * Server Action to fetch objects from the 'malware' collection.
 * @param collection Required Collection to query
 * @param limit Optional limit for the number of results
 * @returns Object indicating success/failure and data/error message
 */
export async function fetchAction(collection: string, limit: number = 10) {
  try {
    const client = await getWeaviateClient();
    const malwareCollection = client.collections.get(collection);

    const result = await malwareCollection.query.fetchObjects({
      limit: limit,
      includeVector: true
    });

    const objectsWithVectors = result.objects.map(obj => ({
        uuid: obj.uuid,
        properties: obj.properties as MalwareProperties,
        vector: obj.vectors
    }));

    /*
    This is to test the plainObjects without vectors.
    const plainObjects = result.objects.map(obj => ({
        uuid: obj.uuid,
        properties: obj.properties,
    }));
    */

    return { success: true, data: objectsWithVectors as MalwareObject[]  };
  } catch (error) {
    return { success: false, error: 'Failed to fetch data from Weaviate.' };
  }
}
 /**
 * Server Action to add a new object to the 'malware' collection
  * @param collection Required Collection to query
 * @param properties The properties (rest, asd) of the new malware object
 * @returns Object indicating success/failure and the new object's UUID or error message
 */
export async function addAction(collection: string, properties: MalwareProperties) {
  try {
    const client = await getWeaviateClient();
    const malwareCollection = client.collections.get(collection);

    const result = await malwareCollection.data.insert(properties);

    return { success: true, uuid: result };

  } catch (error) {
    return { success: false, error: 'Failed to add data to Weaviate.' };
  }
}
