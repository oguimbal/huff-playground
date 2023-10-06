import React from 'react';

export const ErrorDisplay = ({ error }: { error: Error | string }) => {
    return (<pre className="globalError">{typeof error === 'string' ? error : error.message}</pre>);
}