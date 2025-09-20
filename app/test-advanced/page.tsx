"use client";

import React from "react";

export default function TestAdvancedPage() {
  console.log('TestAdvancedPage: Starting render');
  
  try {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Test Advanced Dashboard</h1>
        <p>This is a simple test page to check if the route works.</p>
        <div className="mt-4">
          <p>If you can see this, the basic route is working.</p>
          <p>Timestamp: {new Date().toISOString()}</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('TestAdvancedPage: Error during render:', error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">Error in Test Advanced Page</h1>
        <pre className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          {error instanceof Error ? error.message : 'Unknown error'}
        </pre>
      </div>
    );
  }
}
