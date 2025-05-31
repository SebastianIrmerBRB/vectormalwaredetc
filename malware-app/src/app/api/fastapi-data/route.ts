// src/app/api/fastapi-data/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { env } from '~/env'; // Import your t3-env configuration

// Define the expected structure of the response from your FastAPI app
interface FastAPIResponse {
    shape: [number, number];
    pacmap_applied: boolean;
    data: number[][]; // Assuming the data is a list of lists of numbers
    message?: string;
}

// Define the possible response types for our Next.js API
export interface NextApiResponseSuccess {
    success: true;
    data: FastAPIResponse;
    message?: string;
}

export interface NextApiResponseError {
    success: false;
    error: string;
}

type NextApiResponse = NextApiResponseSuccess | NextApiResponseError;

export async function GET(request: NextRequest) {
    // Important: API routes are server-side by default

    try {
        const { searchParams } = new URL(request.url);
        const fastapiUrl = new URL('/query_weaviate', env.FASTAPI_URL);

        // Pass all query params through directly
        for (const [key, value] of searchParams.entries()) {
            fastapiUrl.searchParams.set(key, value);
        }

        // Set your hardcoded params
        fastapiUrl.searchParams.set('query', "");
        fastapiUrl.searchParams.set('collection_name', "Malware1");

        console.log(`Calling FastAPI endpoint: ${fastapiUrl.toString()}`);

        // Make the fetch request to your running FastAPI application
        const fastapiResponse = await fetch(fastapiUrl.toString());

        // Check if the fetch request itself was successful (HTTP status)
        if (!fastapiResponse.ok) {
            // Attempt to read the error body from FastAPI if available
            const errorBody = await fastapiResponse.text();
            console.error(`FastAPI fetch failed with status ${fastapiResponse.status}: ${errorBody}`);
             // Return a server error response from Next.js
             return NextResponse.json(
                 { success: false, error: `Failed to fetch from FastAPI: HTTP status ${fastapiResponse.status}` } as NextApiResponseError,
                 { status: 500 } // Indicate an internal error talking to the external API
             );
        }

        // Parse the JSON response from FastAPI
        const fastapiData: FastAPIResponse = await fastapiResponse.json();

        console.log("Successfully fetched data from FastAPI.");
        console.log("FastAPI Data Shape:", fastapiData.shape);

        // Return the data received from FastAPI as the response of this Next.js API route
        // We wrap the FastAPI response inside our NextApiResponseSuccess format
        return NextResponse.json(
            { success: true, data: fastapiData, message: fastapiData.message } as NextApiResponseSuccess,
            { status: 200 }
        );

    } catch (error) {
        console.error("API Route Error:", error);
        // Catch any unexpected errors during the execution of this API route
        return NextResponse.json(
            { success: false, error: `An unexpected server error occurred: ${error instanceof Error ? error.message : String(error)}` } as NextApiResponseError,
            { status: 500 }
        );
    }
}