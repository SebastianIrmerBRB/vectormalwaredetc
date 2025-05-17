// src/app/VectorVisualization.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type {Data} from "plotly.js";
// Removed unused imports (MalwareObject, UMAP)

// Dynamically import Plotly with NO SSR.
// This is the mechanism that prevents Plotly from running on the server.
const Plot = dynamic(
  () => import('react-plotly.js'),
  { ssr: false }
);

interface VectorVisualizationProps {
  data: number[][];
  isLoading: boolean;

}

export default function VectorVisualization({ data, isLoading }: VectorVisualizationProps) {
  // Remove isClient state and the useEffect that sets it

  // Determine if data is 2D or 3D based on the first point's length
  const dimension = useMemo(() => {
      if (!data || data.length === 0 || data[0] === undefined) return 0;
      const derivedDim = data[0].length;
      // We only handle 2D or 3D for this visualization
      if (derivedDim >= 2 && derivedDim <= 3) return derivedDim;
      return 0; // Indicate invalid dimension for visualization
  }, [data]);

  // Prepare data for Plotly whenever the input data or dimension changes
  const plotlyData = useMemo(() => {
    if (!data || data.length === 0 || dimension < 2 || dimension > 3) {
      return null;
    }

    const xCoords = data.map(point => point[0]);
    const yCoords = data.map(point => point[1]);
    const zCoords = dimension === 3 ? data.map(point => point[2]) : undefined;

    const hoverTexts = data.map(point => {
        let text = `[${point[0]?.toFixed(2) || 'N/A'}, ${point[1]?.toFixed(2) || 'N/A'}`;
        if (dimension === 3 && point[2] !== undefined) {
            text += `, ${point[2]?.toFixed(2) || 'N/A'}`;
        }
        text += ']';
        return text;
    });

    const colors = data.map(point => point[0]);

    // Prepare the Plotly trace
    const trace = {
      x: xCoords,
      y: yCoords,
      z: zCoords,
      text: hoverTexts,
      mode: 'markers',
      type: dimension === 3 ? 'scatter3d' : 'scattergl',
      marker: {
        color: colors,
        colorscale: 'Viridis',
        colorbar: {
          title: 'Component 1 Value',
          thickness: 15,
          len: 0.5,
          y: 0.5,
          titlefont: { size: 10 },
          tickfont: { size: 8 },
        },
        size: dimension === 3 ? 4 : 6,
        opacity: 0.8,
      },
      hoverinfo: 'text',
      hoverlabel: { bgcolor: 'white', font: { size: 10 } },
    };
    console.log('VectorVisualization: Generated trace:', trace);
    return [trace] as Data[];
  }, [data, dimension]); // Re-run this memo when data or dimension changes

  // Determine status message based on data and loading state
   const statusMessage = useMemo(() => {
        if (isLoading) return 'Loading data...';
        if (!data || data.length === 0) return 'No data available. Fetch data first.';
        if (dimension === 0) return 'Data is not in a plottable format (requires array of arrays).';
        if (dimension < 2 || dimension > 3) {
            return `Data is ${dimension}D. Visualization requires 2D or 3D data (from PaCMAP).`;
        }
        return `${data.length} points visualized (${dimension}D)`;

   }, [isLoading, data, dimension]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-500 text-sm">{statusMessage}</p> {/* Use the status message */}
      </div>
    );
  }

   if (!plotlyData) {
       return (
         <div className="flex flex-col items-center justify-center h-full p-4 text-center">
             <div className="text-gray-400 mb-2">
                  {/* Icon indicating no data or wrong format */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 mx-auto">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.25-2.25M3 15l2.25 2.25m0 0l3-3m0-3l3.75-3.75M9 15l3-3m0 0l9-9m-3 3l3-3m-8.25 8.25L12 17.25m0 0l4.5 4.5M7.5 15h2.25m2.25 0H15m-3 6l3-3m2.25 0l4.5 4.5M17.25 16.5L20.25 19.5M16.5 18a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0016.5 4.5H7.5A2.25 2.25 0 005.25 6.75v9A2.25 2.25 0 007.5 18h9z" />
                  </svg>
             </div>
           <p className="text-gray-500 text-sm">{statusMessage}</p> {/* Display the specific status */}
         </div>
       );
   }



  return (
    <div className="flex flex-col w-full h-full">
      {/* Status line */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
           {/* Status indicator remains */}
           <div className={`h-2 w-2 rounded-full ${statusMessage.startsWith('Error') ? 'bg-red-500' : statusMessage.startsWith('Loading') || statusMessage.startsWith('No data') || statusMessage.includes('requires 2D or 3D') || statusMessage.includes('plottable format') ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          <p className="text-sm text-gray-600">{statusMessage}</p> {/* Display the specific status */}
        </div>

      </div>

      <div className="flex-grow w-full">

        <Plot
          data={plotlyData}
            layout={{
            autosize: true,
            margin: { l: 0, r: 0, b: 0, t: 0, pad: 4 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            xaxis: {
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },
            yaxis: {
              showgrid: false,
              zeroline: false,
              showticklabels: false,
            },

            hovermode: 'closest',
            showlegend: false,
          }}
          style={{ width: '100%', height: '100%' }}
          config={{
            displayModeBar: false, // Keep mode bar for zoom/pan/rotate
            responsive: true, // Make plot responsive to container size
          }}
          useResizeHandler={true} // Tell Plotly to listen to container resize
        />
      </div>
    </div>
  );
}