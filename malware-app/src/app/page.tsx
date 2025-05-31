// src/app/fastapi-data/page.tsx
'use client'; // This is a client component because it needs state and event handlers

import {useEffect, useState, useTransition} from 'react';
// Import types for the expected response from our *Next.js* API route
import type { NextApiResponseSuccess, NextApiResponseError } from './api/fastapi-data/route';

// Import the visualization component (now expects number[][])
import VectorVisualization from '~/app/VectorVisualization';


// Define the structure of the data we expect to store in state
interface FetchedFastAPIData {
    shape: [number, number]; // e.g., [1024, 1024] or [1024, 3]
    pacmap_applied: boolean;
    data: number[][]; // The actual array of points
    message?: string;
}

// Removed redundant type definitions here as they are imported from the route


export default function FastAPIDataPage() {
  // State to hold the fetched data from FastAPI
  const [fastApiData, setFastApiData] = useState<FetchedFastAPIData | null>(null);
  // State for status/error messages (primarily for the fetch operation)
  const [fetchStatusMessage, setFetchStatusMessage] = useState<string | null>(null);
  const [isFetchError, setIsFetchError] = useState<boolean>(false);

  // State for input controls for the API call
  const [applyDR, setApplyDR] = useState<boolean>(true);
  const [drMethod, setDrMethod] = useState<string>("pacmap");

  const [nComponents, setNComponents] = useState<number>(3); // Default to 3 components for 3D visualization

  const [isPending, startTransition] = useTransition();


  // --- Fetch Handler ---
  const handleFetchData = () => {
    setFetchStatusMessage(null); // Clear previous fetch status
    setIsFetchError(false);
    setFastApiData(null); // Clear previous data

    startTransition(async () => {
      setFetchStatusMessage("Fetching data from FastAPI via Next.js API...");
      try {
        const apiUrl = new URL('/api/fastapi-data', window.location.origin); // Use window.location.origin for local API route

        apiUrl.searchParams.set('apply_dr', String(applyDR));
        apiUrl.searchParams.set('dr_method', String(drMethod));

        if (nComponents) {
             apiUrl.searchParams.set('n_components', String(nComponents));
        }

        console.log(`Calling Next.js API endpoint: ${apiUrl.toString()}`);

        // Make the fetch request to our Next.js API route
        const response = await fetch(apiUrl.toString());

        // Check if the HTTP response itself was successful
        if (!response.ok) {
             const errorBody: NextApiResponseError = await response.json();
             throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
        }

        const result: NextApiResponseSuccess | NextApiResponseError = await response.json();

        if (result.success) {
          console.log("Successfully fetched data from Next.js API route.");
          console.log("Received FastAPI Data:", result.data);
          setFastApiData(result.data); // Set the FastAPI data received via our API route
          setFetchStatusMessage(result.message || result.data.message || "Data fetched successfully.");
        } else {
          // Handle cases where our API route returns success: false
          setFetchStatusMessage(result.error || "An error occurred fetching data via Next.js API.");
          setIsFetchError(true);
        }
      } catch (error) {
          console.error("Error in client fetch:", error);
          setFetchStatusMessage(`Failed to fetch data: ${error instanceof Error ? error.message : String(error)}`);
          setIsFetchError(true);
      }
    });
  };
  useEffect(() => {
    if (fastApiData && !isPending) {
      handleFetchData();
    }
  }, [nComponents]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            FastAPI Data Fetcher & Visualizer
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Fetch random data from your FastAPI application and visualize it
          </p>
        </header>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            {/* Fetch Controls */}
            <div className="space-y-4 rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-medium text-gray-900">
                Fetch Options
              </h2>
              <div className="flex items-center">
                <input
                  id="apply_dr"
                  type="checkbox"
                  checked={applyDR}
                  onChange={(e) => setApplyDR(e.target.checked)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <label
                  htmlFor="apply_dr"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Apply Dimensionality Reduction
                </label>
              </div>
              <div className="flex items-center">
              <input
                id="apply_pacmap"
                type="radio"
                name="dr_method"
                value="pacmap"
                checked={drMethod === "pacmap"}
                onChange={(e) => setDrMethod(e.target.value)}
                disabled={isPending}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <label
                htmlFor="apply_pacmap"
                className="ml-2 block text-sm text-gray-900"
              >
                Apply PaCMAP (Recommended for high-dim data viz)
              </label>

              <input
                id="apply_umap"
                type="radio"
                name="dr_method"
                value="umap"
                checked={drMethod === "umap"}
                onChange={(e) => setDrMethod(e.target.value)}
                disabled={isPending}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ml-4"
              />
              <label
                htmlFor="apply_umap"
                className="ml-2 block text-sm text-gray-900"
              >
                Apply UMAP
              </label>
                             <input
                id="apply_trimap"
                type="radio"
                name="dr_method"
                value="trimap"
                checked={drMethod === "trimap"}
                onChange={(e) => setDrMethod(e.target.value)}
                disabled={isPending}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ml-4"
              />
              <label
                htmlFor="apply_trimap"
                className="ml-2 block text-sm text-gray-900"
              >
                Apply TriMAP (Global Structure)
              </label>

            </div>

              {/* pacmap_components input */}
              {applyDR && (
                <div className="mt-3">
                  <label
                    htmlFor="pacmap_components"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Dimension Reduction
                  </label>
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <input
                        id="pacmap_components_2"
                        type="radio"
                        name="pacmap_components"
                        value="2"
                        checked={nComponents === 2}
                        onChange={() => setNComponents(2)}
                        disabled={isPending}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="pacmap_components_2"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        2D
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="pacmap_components_3"
                        type="radio"
                        name="pacmap_components"
                        value="3"
                        checked={nComponents === 3}
                        onChange={() => setNComponents(3)}
                        disabled={isPending}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="pacmap_components_3"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        3D
                      </label>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Select visualization dimensions
                  </p>
                </div>
              )}

              <button
                onClick={handleFetchData}
                disabled={isPending}
                className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isPending ? (
                  <>
                    <svg
                      className="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  "Fetch Data"
                )}
              </button>
            </div>

            {/* Status/Error Display (for the fetch operation) */}
            {fetchStatusMessage && (
              <div
                className={`rounded-md p-4 ${isFetchError ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    {isFetchError ? (
                      <svg
                        className="h-5 w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{fetchStatusMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Right Column: Visualization and Results Display */}
          <div className="lg:col-span-2">
            {/* Vector Visualization */}
            <div className="mt-0 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Data Visualization
              </h2>
              <div className="h-96 w-full">
                <VectorVisualization
                  data={fastApiData?.data || []} // Pass the raw data array from FastAPI
                  isLoading={
                    (isPending && fetchStatusMessage?.startsWith("Fetching")) ||
                    false
                  } // Pass the relevant loading state
                />
              </div>
            </div>
            {/* Results Display (Details from FastAPI response) */}
            <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">
                  FastAPI Response Details
                </h2>
              </div>
              <div className="p-6">
                {/* Only show details if data has been successfully fetched and is not pending */}
                {!isPending && fastApiData ? (
                  <div className="space-y-4">
                    <p>
                      <strong>Shape:</strong> [{fastApiData.shape.join(", ")}]
                    </p>
                    <p>
                      <strong>Dimension Reduction Applied:</strong>{" "}
                      {fastApiData.pacmap_applied ? "Yes" : "No"}
                    </p>
                    <p>
                      <strong>Message:</strong> {fastApiData.message}
                    </p>

                    {/* Display a snippet of the data (e.g., first 5 rows) */}
                    <div className="mt-4">
                      <h3 className="text-md mb-2 font-medium text-gray-900">
                        Data Snippet (First 5 rows):
                      </h3>
                      {fastApiData.data.slice(0, 5).map((row, rowIndex) => (
                        <div
                          key={rowIndex}
                          className="font-mono text-sm break-all text-gray-700"
                        >
                          Row {rowIndex + 1}: [{row.slice(0, 10).join(", ")}
                          {row.length > 10 ? ", ..." : ""}]
                        </div>
                      ))}
                      {fastApiData.data.length > 5 && (
                        <p className="mt-2 text-sm text-gray-600">
                          ... and {fastApiData.data.length - 5} more rows.
                        </p>
                      )}
                      {fastApiData.data.length === 0 && (
                        <p className="mt-2 text-sm text-gray-600">
                          No data rows returned.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    {isPending && fetchStatusMessage?.startsWith("Fetching") ? (
                      <svg
                        className="mx-auto h-8 w-8 animate-spin text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      "Fetch data to see response details here."
                    )}
                  </div>
                )}
              </div>{" "}
              {/* End p-6 */}
            </div>{" "}
            {/* End bg-white */}
          </div>{" "}
          {/* End lg:col-span-2 */}
        </div>{" "}
        {/* End grid */}
      </div>{" "}
      {/* End max-w-7xl */}
    </div> // End min-h-screen
  );
}